import jwt from 'jsonwebtoken';
import { db } from '../lib/firebase.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }

  const snap = await db().collection('Admin').doc(payload.id).get();
  if (!snap.exists) {
    return res.status(401).json({ ok: false, error: 'Account no longer exists' });
  }

  const admin = snap.data();
  if (admin.isActive === false) {
    return res.status(403).json({ ok: false, error: 'Account is disabled' });
  }

  req.admin = { id: snap.id, ...admin };
  next();
});

