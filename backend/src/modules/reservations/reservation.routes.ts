import { Router } from 'express';
import { ReservationController } from './reservation.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createReservationSchema,
  updateReservationStatusSchema,
} from './reservation.validator';

const router = Router();
const controller = new ReservationController();

router.use(authenticate);

router.get('/', controller.getReservations);
router.post(
  '/',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(createReservationSchema),
  controller.createReservation
);
router.patch(
  '/:id/status',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(updateReservationStatusSchema),
  controller.updateStatus
);

export default router;
