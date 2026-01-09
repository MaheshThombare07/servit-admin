import { Router } from 'express';
import * as svc from '../service/services.controller.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { checkAccess } from '../middleware/accessControl.js';

const router = Router();

// Categories (menservices, womensservices) - requires 'categories' access
router.get('/categories', checkAccess('categories'), asyncHandler(svc.listCategories));
router.post('/categories', checkAccess('categories'), asyncHandler(svc.createCategory));
router.patch('/categories/:categoryId', checkAccess('categories'), asyncHandler(svc.updateCategory));
router.delete('/categories/:categoryId', checkAccess('categories'), asyncHandler(svc.deleteCategory));

// Services under a category (serviceList) - requires 'categories' access
router.get('/categories/:categoryId/services', checkAccess('categories'), asyncHandler(svc.listServices));
router.post('/categories/:categoryId/services', checkAccess('categories'), asyncHandler(svc.createService));
router.get('/categories/:categoryId/services/:serviceId', checkAccess('categories'), asyncHandler(svc.getService));
router.patch('/categories/:categoryId/services/:serviceId', checkAccess('categories'), asyncHandler(svc.updateService));
router.delete('/categories/:categoryId/services/:serviceId', checkAccess('categories'), asyncHandler(svc.deleteService));

// Subservices array operations - requires 'categories' access
router.post('/categories/:categoryId/services/:serviceId/subservices', checkAccess('categories'), asyncHandler(svc.addSubService));
router.patch('/categories/:categoryId/services/:serviceId/subservices/:subId', checkAccess('categories'), asyncHandler(svc.updateSubService));
router.delete('/categories/:categoryId/services/:serviceId/subservices/:subId', checkAccess('categories'), asyncHandler(svc.deleteSubService));

export default router;
