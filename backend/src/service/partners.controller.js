import Joi from 'joi';
import { db } from '../lib/firebase.js';

const partnersCol = () => db().collection('partners');

// Validation Schemas
const verifySchema = Joi.object({
  remark: Joi.string().allow('').default('')
});

const rejectSchema = Joi.object({
  rejectionReason: Joi.string().required(),
  remark: Joi.string().allow('').default('')
});

// List all partners (with optional filtering)
export async function listPartners(req, res) {
  const { status } = req.query;
  let query = partnersCol();
  
  // Get all partners without filtering
  const snap = await query.get();
  const allItems = snap.docs.map(d => { 
    const data = d.data();
    let verificationStatus = 'pending_verification';
    
    // Check verification status based on verificationDetails fields only
    if (data?.verificationDetails?.verified === true) {
      verificationStatus = 'verified';
    } else if (data?.verificationDetails?.rejected === true) {
      verificationStatus = 'rejected';
    }
    // If both verified and rejected are false or undefined, it remains pending_verification
    
    return { 
      id: d.id, 
      ...data,
      verificationStatus,
      status: verificationStatus // Add status field for frontend compatibility
    };
  });
  
  // Filter on client side based on calculated status
  let items = allItems;
  if (status && status !== 'all') {
    items = allItems.filter(item => item.status === status);
  }
  
  res.json(items);
}

// Get single partner by ID
export async function getPartner(req, res) {
  const { partnerId } = req.params;
  const doc = await partnersCol().doc(partnerId).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  
  const data = doc.data();
  let verificationStatus = 'pending_verification';
  
  // Check verification status based on verificationDetails fields only
  if (data?.verificationDetails?.verified === true) {
    verificationStatus = 'verified';
  } else if (data?.verificationDetails?.rejected === true) {
    verificationStatus = 'rejected';
  }
  // If both verified and rejected are false or undefined, it remains pending_verification
  
  res.json({ 
    id: doc.id, 
    ...data,
    verificationStatus,
    status: verificationStatus // Add status field for frontend compatibility
  });
}

// Verify a partner
export async function verifyPartner(req, res) {
  const { partnerId } = req.params;
  const { value, error } = verifySchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  const docRef = partnersCol().doc(partnerId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  
  const now = Date.now();
  const updateData = {
    'verificationDetails.verified': true,
    'verificationDetails.rejected': false,
    'verificationDetails.verifiedAt': now,
    'verificationDetails.verifiedBy': 'admin', // You can add actual admin ID later
    // 'verificationDetails.remark': value.remark || '',
    // 'verificationDetails.rejectionReason': '',
    'status': 'verified',
    'verificationDetails.isVerified': true
  };
  
  await docRef.update(updateData);
  
  const updatedDoc = await docRef.get();
  res.json({ id: updatedDoc.id, ...updatedDoc.data() });
}

// Reject a partner
export async function rejectPartner(req, res) {
  const { partnerId } = req.params;
  const { value, error } = rejectSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  const docRef = partnersCol().doc(partnerId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Partner not found' });
  }
  
  const updateData = {
    'verificationDetails.verified': false,
    'verificationDetails.rejected': true,
    'verificationDetails.rejectionReason': value.rejectionReason,
    'verificationDetails.remark': value.remark || '',
    // 'verificationDetails.verifiedAt': null,
    // 'verificationDetails.verifiedBy': null,
    'status': 'rejected'
  };
  
  await docRef.update(updateData);
  
  const updatedDoc = await docRef.get();
  res.json({ id: updatedDoc.id, ...updatedDoc.data() });
}