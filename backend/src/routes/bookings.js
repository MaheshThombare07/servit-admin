import { Router } from 'express';
import * as bookingsCtrl from '../service/bookings.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { checkAccess } from '../middleware/accessControl.js';

const router = Router();

// Bookings routes - requires 'bookings' access
router.get('/bookings', checkAccess('bookings'), asyncHandler(bookingsCtrl.getAllBookings));
router.get('/bookings/:bookingId', checkAccess('bookings'), asyncHandler(bookingsCtrl.getBookingDetails));

export default router;
