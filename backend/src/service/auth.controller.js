import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, ensureFirebaseInitialized } from '../lib/firebase.js';
import { getCache, setCache } from '../../lib/cache.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

function getAdminSdk() {
  return ensureFirebaseInitialized();
}

const adminSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).required(),
  mobile: Joi.string().trim().required(),
  role: Joi.string().valid('super_admin', 'sub_admin').default('sub_admin'),
  access: Joi.array().items(Joi.string().trim()).default([]),
});

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function createAdmin(req, res) {
  const { value, error } = adminSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ ok: false, error: error.details.map(d => d.message).join(', ') });
  }

  // Check if admin with this email already exists
  const existingSnap = await db().collection('Admin').where('email', '==', value.email).limit(1).get();
  if (!existingSnap.empty) {
    return res.status(409).json({ ok: false, error: 'Admin with this email already exists' });
  }

  const adminSdk = getAdminSdk();
  const { FieldValue } = adminSdk.firestore;

  const hash = await bcrypt.hash(value.password, 10);
  const payload = {
    name: value.name,
    email: value.email,
    password: hash,
    mobile: value.mobile,
    role: value.role,
    access: value.access || [],
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = db().collection('Admin').doc();
  await docRef.set(payload);

  const token = signToken({ id: docRef.id, role: value.role, access: value.access || [] });
  res.status(201).json({
    ok: true,
    token,
    admin: { id: docRef.id, ...payload, password: undefined },
  });
}

export async function login(req, res) {
  const { value, error } = Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }).validate(req.body, { abortEarly: false, stripUnknown: true });

  if (error) {
    return res.status(400).json({ ok: false, error: error.details.map(d => d.message).join(', ') });
  }

  // Check cache first
  const cacheKey = `admin_${value.email}`;
  let admin = getCache(cacheKey);
  
  if (!admin) {
    const snap = await db().collection('Admin').where('email', '==', value.email).limit(1).get();
    if (snap.empty) {
      return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    }
    
    const doc = snap.docs[0];
    admin = { id: doc.id, ...doc.data() };
    
    // Cache the admin data (without password)
    const adminForCache = { ...admin };
    delete adminForCache.password;
    setCache(cacheKey, adminForCache);
  }

  if (admin.isActive === false) {
    return res.status(403).json({ ok: false, error: 'Account is disabled' });
  }

  // Need to fetch password for comparison if not in cache
  if (!admin.password) {
    const snap = await db().collection('Admin').doc(admin.id).get();
    const fullAdmin = snap.data();
    admin.password = fullAdmin.password;
  }

  const isMatch = await bcrypt.compare(value.password, admin.password || '');
  if (!isMatch) {
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }

  const token = signToken({ id: admin.id, role: admin.role, access: admin.access || [] });
  const responseAdmin = { ...admin };
  delete responseAdmin.password;
  
  res.json({
    ok: true,
    token,
    admin: responseAdmin,
  });
}

export async function me(req, res) {
  const { admin } = req;
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  res.json({ ok: true, admin: { ...admin, password: undefined } });
}

export async function logout(_req, res) {
  res.json({ ok: true });
}

export async function refreshToken(req, res) {
  const { admin } = req;
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // Generate new token with same payload
  const token = signToken({ id: admin.id, role: admin.role, access: admin.access || [] });
  res.json({
    ok: true,
    token,
    admin: { ...admin, password: undefined }
  });
}

export async function getAllAdmins(req, res) {
  const { admin } = req;
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    // Optimized query with specific fields and ordering
    const snapshot = await db().collection('Admin')
      .orderBy('createdAt', 'desc')
      .get();
    
    const admins = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      mobile: doc.data().mobile,
      role: doc.data().role,
      access: doc.data().access,
      isActive: doc.data().isActive,
      createdAt: doc.data().createdAt
      // password is excluded for security
    }));
    
    res.json({ ok: true, admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch admins' });
  }
}

export async function toggleAdminStatus(req, res) {
  const { admin } = req;
  if (!admin) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const { adminId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ ok: false, error: 'isActive must be a boolean' });
  }

  // Prevent admin from disabling themselves
  if (adminId === admin.id) {
    return res.status(400).json({ ok: false, error: 'Cannot disable your own account' });
  }

  try {
    const adminRef = db().collection('Admin').doc(adminId);
    const doc = await adminRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ ok: false, error: 'Admin not found' });
    }

    await adminRef.update({ isActive });
    
    const updatedAdmin = {
      id: adminId,
      ...doc.data(),
      isActive,
      password: undefined
    };
    
    res.json({ ok: true, admin: updatedAdmin });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    res.status(500).json({ ok: false, error: 'Failed to update admin status' });
  }
}