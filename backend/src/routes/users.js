import { Router } from 'express';
import * as usersCtrl from '../service/users.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Users routes
router.get('/users', asyncHandler(usersCtrl.listUsers));
router.get('/users/:userId', asyncHandler(usersCtrl.getUser));
router.get('/users/:userId/bookings', asyncHandler(usersCtrl.getUserBookingHistory));
router.patch('/users/:userId/status', asyncHandler(usersCtrl.updateUserStatus));
router.delete('/users/:userId', asyncHandler(usersCtrl.deleteUser));

export default router;
