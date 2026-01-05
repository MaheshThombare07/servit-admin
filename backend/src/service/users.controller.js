import Joi from 'joi';
import { db } from '../lib/firebase.js';

const usersCol = () => db().collection('serveit_users');

// Validation Schemas
const blockUserSchema = Joi.object({
  blocked: Joi.boolean().required(),
  blockReason: Joi.string().allow('').default('')
});

// List all users (with optional filtering)
export async function listUsers(req, res) {
  const { blocked, limit = 50, offset = 0 } = req.query;
  let query = usersCol();
  
  // Filter by blocked status if provided
  if (blocked !== undefined) {
    const isBlocked = blocked === 'true';
    query = query.where('blocked', '==', isBlocked);
  }
  
  // Add pagination
  query = query.limit(parseInt(limit)).offset(parseInt(offset));
  
  const snap = await query.get();
  const items = snap.docs.map(d => ({ 
    id: d.id, 
    ...d.data()
  }));
  
  res.json(items);
}

// Get single user by ID
export async function getUser(req, res) {
  const { userId } = req.params;
  const doc = await usersCol().doc(userId).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const data = doc.data();
  res.json({ 
    id: doc.id, 
    ...data
  });
}

// Block/Unblock a user
export async function updateUserStatus(req, res) {
  const { userId } = req.params;
  const { value, error } = blockUserSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  
  const docRef = usersCol().doc(userId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const now = Date.now();
  const updateData = {
    blocked: value.blocked,
    blockedAt: value.blocked ? now : null,
    unblockedAt: value.blocked ? null : now,
    blockReason: value.blocked ? value.blockReason : '',
    updatedAt: now
  };
  
  await docRef.update(updateData);
  
  const updatedDoc = await docRef.get();
  res.json({ id: updatedDoc.id, ...updatedDoc.data() });
}

// Get user booking history
export async function getUserBookingHistory(req, res) {
  const { userId } = req.params;
  
  try {
    // Get user document from Bookings collection
    const bookingDoc = await db().collection('Bookings').doc(userId).get();
    
    if (!bookingDoc.exists) {
      return res.json({ bookings: [], address: null });
    }
    
    const bookingData = bookingDoc.data();
    const bookings = bookingData.bookings || [];
    
    // Sort bookings by createdAt in descending order (newest first)
    const sortedBookings = bookings.sort((a, b) => {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    
    res.json({
      bookings: sortedBookings,
      address: bookingData.address || null,
      userId: userId
    });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
}

// Delete a user (optional - for admin use)
export async function deleteUser(req, res) {
  const { userId } = req.params;
  const docRef = usersCol().doc(userId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await docRef.delete();
  res.json({ ok: true, message: 'User deleted successfully' });
}
