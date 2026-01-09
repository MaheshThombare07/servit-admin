import { Router } from 'express';
import * as partnersCtrl from '../service/partners.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { checkAccess } from '../middleware/accessControl.js';

const router = Router();

// Partners routes - requires 'partners' access
router.get('/partners', checkAccess('partners'), asyncHandler(partnersCtrl.listPartners));
router.get('/partners/:partnerId', checkAccess('partners'), asyncHandler(partnersCtrl.getPartner));
router.post('/partners/:partnerId/verify', checkAccess('partners'), asyncHandler(partnersCtrl.verifyPartner));
router.post('/partners/:partnerId/reject', checkAccess('partners'), asyncHandler(partnersCtrl.rejectPartner));

export default router;

