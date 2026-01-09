import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import * as authCtrl from '../service/auth.controller.js';

const router = Router();

// Public auth routes only
router.post('/auth/register', asyncHandler(authCtrl.createAdmin));
router.post('/auth/login', asyncHandler(authCtrl.login));
router.post('/auth/logout', asyncHandler(authCtrl.logout));

export default router;
