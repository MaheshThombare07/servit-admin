import { Router } from 'express';
import * as partnersCtrl from '../service/partners.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Partners routes
router.get('/partners', asyncHandler(partnersCtrl.listPartners));
router.get('/partners/:partnerId', asyncHandler(partnersCtrl.getPartner));
router.post('/partners/:partnerId/verify', asyncHandler(partnersCtrl.verifyPartner));
router.post('/partners/:partnerId/reject', asyncHandler(partnersCtrl.rejectPartner));

export default router;

