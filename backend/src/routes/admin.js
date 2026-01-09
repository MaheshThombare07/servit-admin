import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authCtrl from '../service/auth.controller.js';
import { checkAccess } from '../middleware/accessControl.js';

const router = Router();

// Protected auth endpoints
router.get('/auth/me', asyncHandler(authCtrl.me));
router.post('/auth/refresh', asyncHandler(authCtrl.refreshToken));

// Admin management routes - requires 'settings' access
router.get('/admins', checkAccess('settings'), asyncHandler(authCtrl.getAllAdmins));
// router.post('/admin/register', checkAccess('settings'), asyncHandler(authCtrl.createAdmin));
router.put('/admin/:adminId/status', checkAccess('settings'), asyncHandler(authCtrl.toggleAdminStatus));

export default router;
