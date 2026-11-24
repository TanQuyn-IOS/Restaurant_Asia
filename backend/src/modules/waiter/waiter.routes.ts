import { Router } from 'express';
import { WaiterController } from './waiter.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createServiceRequestSchema,
  updateServiceRequestSchema,
} from './waiter.validator';

const router = Router();
const controller = new WaiterController();

router.use(authenticate);

router.post(
  '/items/:itemId/served',
  requireRoles('ADMIN', 'WAITER', 'CASHIER'),
  controller.markServed
);

router.get('/service-requests', controller.getServiceRequests);
router.post(
  '/service-requests',
  validate(createServiceRequestSchema),
  controller.createServiceRequest
);
router.put(
  '/service-requests/:id',
  requireRoles('ADMIN', 'WAITER', 'CASHIER'),
  validate(updateServiceRequestSchema),
  controller.updateServiceRequest
);

export default router;
