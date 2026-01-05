import { Router } from 'express';
import * as svc from '../service/services.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

// Categories (menservices, womensservices)
router.get('/categories', asyncHandler(svc.listCategories));
router.post('/categories', asyncHandler(svc.createCategory));
router.patch('/categories/:categoryId', asyncHandler(svc.updateCategory));
router.delete('/categories/:categoryId', asyncHandler(svc.deleteCategory));

// Services under a category (serviceList)
router.get('/categories/:categoryId/services', asyncHandler(svc.listServices));
router.post('/categories/:categoryId/services', asyncHandler(svc.createService));
router.get('/categories/:categoryId/services/:serviceId', asyncHandler(svc.getService));
router.patch('/categories/:categoryId/services/:serviceId', asyncHandler(svc.updateService));
router.delete('/categories/:categoryId/services/:serviceId', asyncHandler(svc.deleteService));

// Subservices array operations
router.post('/categories/:categoryId/services/:serviceId/subservices', asyncHandler(svc.addSubService));
router.patch('/categories/:categoryId/services/:serviceId/subservices/:subId', asyncHandler(svc.updateSubService));
router.delete('/categories/:categoryId/services/:serviceId/subservices/:subId', asyncHandler(svc.deleteSubService));

export default router;
