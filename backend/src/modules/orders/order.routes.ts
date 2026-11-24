import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { idempotencyGuard } from '../../middlewares/idempotency.middleware';
import {
  createOrderSchema,
  addItemsToOrderSchema,
  applyDiscountSchema,
  splitOrderSchema,
} from './order.validator';

const router = Router();
const controller = new OrderController();

router.use(authenticate);

router.get('/', controller.getOrders);
router.get('/table/:tableId', controller.getActiveOrderByTable);
router.get('/:id', controller.getOrderById);

router.post(
  '/',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  idempotencyGuard('createOrder'),
  validate(createOrderSchema),
  controller.createOrder
);

router.post(
  '/:id/items',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(addItemsToOrderSchema),
  controller.addItems
);

router.post(
  '/:id/items/:itemId/cancel',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  controller.cancelItem
);

router.post(
  '/:id/discount',
  requireRoles('ADMIN', 'CASHIER'),
  validate(applyDiscountSchema),
  controller.applyDiscount
);

router.post(
  '/:id/split',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(splitOrderSchema),
  controller.splitOrder
);

export default router;
