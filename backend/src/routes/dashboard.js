import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as dashboardCtrl from '../service/dashboard.controller.js';

const router = Router();

// Dashboard statistics endpoints
router.get('/dashboard/stats', asyncHandler(dashboardCtrl.getDashboardStats));
router.get('/dashboard/recent-bookings', asyncHandler(dashboardCtrl.getRecentBookings));
router.get('/dashboard/pending-validations', asyncHandler(dashboardCtrl.getPendingValidations));
router.get('/dashboard/booking-trends', asyncHandler(dashboardCtrl.getBookingTrends));

export default router;
