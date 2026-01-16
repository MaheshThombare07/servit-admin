import { db } from '../lib/firebase.js';

const usersCol = () => db().collection('serveit_users');
const partnersCol = () => db().collection('partners');
const bookingsCol = () => db().collection('Bookings');

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(req, res) {
  try {
    // Fetch all collections in parallel
    const [usersSnap, partnersSnap, bookingsSnap] = await Promise.all([
      usersCol().get(),
      partnersCol().get(),
      bookingsCol().get()
    ]);

    // Calculate user stats
    const totalUsers = usersSnap.size;
    const blockedUsers = usersSnap.docs.filter(doc => doc.data().blocked === true).length;
    const activeUsers = totalUsers - blockedUsers;

    // Calculate partner stats
    const allPartners = partnersSnap.docs.map(doc => {
      const data = doc.data();
      let verificationStatus = 'pending_verification';
      
      // Check verification status based on verificationDetails fields
      if (data?.verificationDetails?.verified === true) {
        verificationStatus = 'verified';
      } else if (data?.verificationDetails?.rejected === true) {
        verificationStatus = 'rejected';
      }
      
      return { 
        id: doc.id, 
        ...data,
        verificationStatus
      };
    });
    
    const totalPartners = allPartners.length;
    const verifiedPartners = allPartners.filter(p => p.verificationStatus === 'verified').length;
    const pendingPartners = allPartners.filter(p => p.verificationStatus === 'pending_verification').length;
    const rejectedPartners = allPartners.filter(p => p.verificationStatus === 'rejected').length;

    // Calculate booking stats
    let allBookings = [];
    bookingsSnap.docs.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.bookings && Array.isArray(userData.bookings)) {
        allBookings = allBookings.concat(userData.bookings.map(b => ({
          ...b,
          userId: userDoc.id
        })));
      }
    });

    const totalBookings = allBookings.length;
    
    // Get current month bookings
    const now = Date.now();
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const monthlyBookings = allBookings.filter(b => b.createdAt >= startOfMonth).length;

    // Get previous month bookings for comparison
    const startOfPrevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime();
    const endOfPrevMonth = startOfMonth - 1;
    const prevMonthBookings = allBookings.filter(b => 
      b.createdAt >= startOfPrevMonth && b.createdAt <= endOfPrevMonth
    ).length;

    // Calculate percentage changes
    const userChange = calculatePercentageChange(totalUsers, totalUsers - 10); // Mock previous count
    const partnerChange = calculatePercentageChange(totalPartners, totalPartners - 5);
    const bookingChange = calculatePercentageChange(monthlyBookings, prevMonthBookings);

    // Booking status breakdown
    const pendingBookings = allBookings.filter(b => b.bookingStatus === 'pending').length;
    const acceptedBookings = allBookings.filter(b => b.bookingStatus === 'accepted').length;
    const completedBookings = allBookings.filter(b => b.bookingStatus === 'completed').length;
    const cancelledBookings = allBookings.filter(b => b.bookingStatus === 'cancelled').length;

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        change: userChange
      },
      partners: {
        total: totalPartners,
        verified: verifiedPartners,
        pending: pendingPartners,
        rejected: rejectedPartners,
        change: partnerChange
      },
      bookings: {
        total: totalBookings,
        monthly: monthlyBookings,
        pending: pendingBookings,
        accepted: acceptedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        change: bookingChange
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
}

/**
 * Get recent bookings (last 5)
 */
export async function getRecentBookings(req, res) {
  try {
    const bookingsSnap = await bookingsCol().get();
    let allBookings = [];

    // Collect all bookings with user info
    for (const userDoc of bookingsSnap.docs) {
      const userData = userDoc.data();
      if (userData.bookings && Array.isArray(userData.bookings)) {
        userData.bookings.forEach(booking => {
          allBookings.push({
            ...booking,
            userId: userDoc.id,
            userName: userData.userName,
            userMobileNo: userData.mobileNo
          });
        });
      }
    }

    // Sort by createdAt (newest first) and take first 5
    allBookings.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const recentBookings = allBookings.slice(0, 5);

    // Fetch provider info for each booking
    const bookingsWithProviders = await Promise.all(
      recentBookings.map(async (booking) => {
        if (booking.providerId) {
          try {
            const providerDoc = await partnersCol().doc(booking.providerId).get();
            if (providerDoc.exists) {
              return {
                ...booking,
                providerName: providerDoc.data().name || 'Unknown Provider'
              };
            }
          } catch (err) {
            console.error(`Error fetching provider ${booking.providerId}:`, err);
          }
        }
        return {
          ...booking,
          providerName: 'Not Assigned'
        };
      })
    );

    res.json({ bookings: bookingsWithProviders });
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
}

/**
 * Get pending partner validations
 */
export async function getPendingValidations(req, res) {
  try {
    // Get all partners since verificationStatus is calculated, not stored
    const partnersSnap = await partnersCol().get();

    const pendingPartners = partnersSnap.docs
      .map(doc => {
        const data = doc.data();
        let verificationStatus = 'pending_verification';
        
        // Check verification status based on verificationDetails fields
        if (data?.verificationDetails?.verified === true) {
          verificationStatus = 'verified';
        } else if (data?.verificationDetails?.rejected === true) {
          verificationStatus = 'rejected';
        }
        
        return {
          id: doc.id,
          ...data,
          verificationStatus
        };
      })
      .filter(partner => partner.verificationStatus === 'pending_verification');

    // Sort by createdAt (oldest first for review priority)
    pendingPartners.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    res.json({ partners: pendingPartners });
  } catch (error) {
    console.error('Error fetching pending validations:', error);
    res.status(500).json({ error: 'Failed to fetch pending validations' });
  }
}

/**
 * Get booking trends for chart (last 4 weeks)
 */
export async function getBookingTrends(req, res) {
  try {
    const bookingsSnap = await bookingsCol().get();
    let allBookings = [];

    bookingsSnap.docs.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.bookings && Array.isArray(userData.bookings)) {
        allBookings = allBookings.concat(userData.bookings);
      }
    });

    // Get data for last 4 weeks
    const now = Date.now();
    const fourWeeksAgo = now - (4 * 7 * 24 * 60 * 60 * 1000);
    
    // Filter bookings from last 4 weeks
    const recentBookings = allBookings.filter(b => b.createdAt >= fourWeeksAgo);

    // Group by week
    const weeklyData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = now - ((i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = now - (i * 7 * 24 * 60 * 60 * 1000);
      
      const weekBookings = recentBookings.filter(b => 
        b.createdAt >= weekStart && b.createdAt < weekEnd
      );

      weeklyData.push({
        week: `Week ${4 - i}`,
        bookings: weekBookings.length,
        weekStart,
        weekEnd
      });
    }

    res.json({ trends: weeklyData });
  } catch (error) {
    console.error('Error fetching booking trends:', error);
    res.status(500).json({ error: 'Failed to fetch booking trends' });
  }
}

/**
 * Helper function to calculate percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Math.round(change);
}
