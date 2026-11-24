import { Router } from 'express';
import { KitchenController } from './kitchen.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { cancelCookedItemSchema } from './kitchen.validator';

const router = Router();
const controller = new KitchenController();

router.use(authenticate);

router.get('/queue', requireRoles('ADMIN', 'KITCHEN'), controller.getQueue);
router.post('/items/:itemId/cook', requireRoles('ADMIN', 'KITCHEN'), controller.startCooking);
router.post('/items/:itemId/ready', requireRoles('ADMIN', 'KITCHEN'), controller.markReady);
router.post(
  '/items/:itemId/cancel-cooked',
  requireRoles('ADMIN', 'KITCHEN'),
  validate(cancelCookedItemSchema),
  controller.cancelCookedItem
);

export default router;
