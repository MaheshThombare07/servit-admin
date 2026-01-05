import { Router } from 'express';
import * as bookingsCtrl from '../service/bookings.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Bookings routes
router.get('/bookings', asyncHandler(bookingsCtrl.getAllBookings));
router.get('/bookings/:bookingId', asyncHandler(bookingsCtrl.getBookingDetails));

export default router;
