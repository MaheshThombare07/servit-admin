import { Router } from 'express';
import * as usersCtrl from '../service/users.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { checkAccess } from '../middleware/accessControl.js';

const router = Router();

// Users routes - requires 'users' access
router.get('/users', checkAccess('users'), asyncHandler(usersCtrl.listUsers));
router.get('/users/:userId', checkAccess('users'), asyncHandler(usersCtrl.getUser));
router.get('/users/:userId/bookings', checkAccess('users'), asyncHandler(usersCtrl.getUserBookingHistory));
router.patch('/users/:userId/status', checkAccess('users'), asyncHandler(usersCtrl.updateUserStatus));
router.delete('/users/:userId', checkAccess('users'), asyncHandler(usersCtrl.deleteUser));

export default router;
