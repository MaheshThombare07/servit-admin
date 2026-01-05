import Joi from 'joi';
import { db } from '../lib/firebase.js';

const bookingsCol = () => db().collection('Bookings');
const partnersCol = () => db().collection('partners');

// Validation Schemas
const getAllBookingsSchema = Joi.object({
  bookingId: Joi.string().optional(),
  service: Joi.string().optional(),
  city: Joi.string().optional(),
  pincode: Joi.string().optional(),
  status: Joi.string().optional(),
  providerId: Joi.string().optional(),
  startDate: Joi.number().optional(),
  endDate: Joi.number().optional(),
  limit: Joi.number().default(50),
  offset: Joi.number().default(0)
});

// Helper function to extract pincode from address
function extractPincode(address) {
  if (!address) return null;
  const pincodeMatch = address.match(/\b(\d{6})\b/);
  return pincodeMatch ? pincodeMatch[1] : null;
}

// Helper function to extract city from address
function extractCity(address) {
  if (!address) return null;
  // Common Indian cities patterns
  const cityPatterns = [
    /Mumbai|Bombay/i,
    /Delhi/i,
    /Bangalore|Bengaluru/i,
    /Chennai/i,
    /Kolkata|Calcutta/i,
    /Pune/i,
    /Hyderabad/i,
    /Ahmedabad/i,
    /Chhatrapati Sambhajinagar|Aurangabad/i,
    /Nagpur/i,
    /Thane/i,
    /Nashik/i
  ];
  
  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) return match[0];
  }
  return null;
}

// Get all bookings with advanced filtering
export async function getAllBookings(req, res) {
  const { value, error } = getAllBookingsSchema.validate(req.query);
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    // Get all user booking documents
    const bookingsSnapshot = await bookingsCol().get();
    const allBookings = [];
    const providerDetailsCache = new Map();

    // Process each user's bookings
    for (const userDoc of bookingsSnapshot.docs) {
      const userData = userDoc.data();
      const userAddress = userData.address || '';
      const userPincode = extractPincode(userAddress);
      const userCity = extractCity(userAddress);
      
      if (userData.bookings && Array.isArray(userData.bookings)) {
        for (const booking of userData.bookings) {
          // Apply filters
          if (value.bookingId && !booking.bookingId.toLowerCase().includes(value.bookingId.toLowerCase())) continue;
          if (value.service && booking.serviceName !== value.service) continue;
          if (value.status && booking.bookingStatus !== value.status) continue;
          if (value.providerId && booking.providerId !== value.providerId) continue;
          if (value.startDate && booking.createdAt < value.startDate) continue;
          if (value.endDate && booking.createdAt > value.endDate) continue;
          if (value.city && userCity && !userCity.toLowerCase().includes(value.city.toLowerCase())) continue;
          if (value.pincode && userPincode && userPincode !== value.pincode) continue;

          // Get provider details if provider is assigned
          let providerInfo = null;
          if (booking.providerId && !providerDetailsCache.has(booking.providerId)) {
            try {
              const providerDoc = await partnersCol().doc(booking.providerId).get();
              if (providerDoc.exists) {
                providerInfo = { id: providerDoc.id, ...providerDoc.data() };
                providerDetailsCache.set(booking.providerId, providerInfo);
              }
            } catch (err) {
              console.error(`Error fetching provider ${booking.providerId}:`, err);
            }
          }
          
          if (booking.providerId && providerDetailsCache.has(booking.providerId)) {
            providerInfo = providerDetailsCache.get(booking.providerId);
          }

          allBookings.push({
            ...booking,
            userId: userDoc.id,
            userAddress: userAddress,
            userPincode: userPincode,
            userCity: userCity,
            providerInfo: providerInfo
          });
        }
      }
    }

    // Sort by createdAt (newest first)
    allBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Apply pagination
    const startIndex = parseInt(value.offset);
    const endIndex = startIndex + parseInt(value.limit);
    const paginatedBookings = allBookings.slice(startIndex, endIndex);

    // Get unique values for filter options
    const services = [...new Set(allBookings.map(b => b.serviceName).filter(Boolean))];
    const cities = [...new Set(allBookings.map(b => b.userCity).filter(Boolean))];
    const pincodes = [...new Set(allBookings.map(b => b.userPincode).filter(Boolean))];
    const statuses = [...new Set(allBookings.map(b => b.bookingStatus).filter(Boolean))];

    res.json({
      bookings: paginatedBookings,
      total: allBookings.length,
      filters: {
        services,
        cities,
        pincodes,
        statuses
      }
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// Get single booking details with full provider information
export async function getBookingDetails(req, res) {
  const { bookingId } = req.params;
  
  try {
    // Find the booking across all user documents
    const bookingsSnapshot = await bookingsCol().get();
    let foundBooking = null;
    let userDoc = null;

    for (const doc of bookingsSnapshot.docs) {
      const userData = doc.data();
      if (userData.bookings && Array.isArray(userData.bookings)) {
        const booking = userData.bookings.find(b => b.bookingId === bookingId);
        if (booking) {
          foundBooking = booking;
          userDoc = { id: doc.id, ...userData };
          break;
        }
      }
    }

    if (!foundBooking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Get provider details if assigned
    let providerInfo = null;
    if (foundBooking.providerId) {
      try {
        const providerDoc = await partnersCol().doc(foundBooking.providerId).get();
        if (providerDoc.exists) {
          providerInfo = { id: providerDoc.id, ...providerDoc.data() };
        }
      } catch (err) {
        console.error(`Error fetching provider ${foundBooking.providerId}:`, err);
      }
    }

    res.json({
      booking: {
        ...foundBooking,
        userAddress: userDoc.address,
        userPincode: extractPincode(userDoc.address),
        userCity: extractCity(userDoc.address),
        userId: userDoc.id,
        userName: userDoc.userName,
        userMobileNo: userDoc.mobileNo
      },
      providerInfo,
      userInfo: userDoc
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
}
