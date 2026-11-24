import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { idempotencyGuard } from '../../middlewares/idempotency.middleware';
import {
  createPaymentSchema,
  refundPaymentSchema,
  generateVietQRSchema,
} from './payment.validator';

const router = Router();
const controller = new PaymentController();

router.use(authenticate);

router.get('/', requireRoles('ADMIN', 'CASHIER'), controller.getPayments);

router.post(
  '/',
  requireRoles('ADMIN', 'CASHIER'),
  idempotencyGuard('createPayment'),
  validate(createPaymentSchema),
  controller.createPayment
);

router.post(
  '/refund',
  requireRoles('ADMIN', 'CASHIER'),
  idempotencyGuard('refundPayment'),
  validate(refundPaymentSchema),
  controller.refundPayment
);

router.post(
  '/vietqr',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(generateVietQRSchema),
  controller.generateVietQR
);

export default router;
