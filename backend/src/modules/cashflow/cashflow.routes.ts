import { Router } from 'express';
import { CashFlowController } from './cashflow.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCashFlowSchema } from './cashflow.validator';

const router = Router();
const controller = new CashFlowController();

router.use(authenticate);

router.get('/', requireRoles('ADMIN', 'CASHIER'), controller.getRecords);
router.get('/summary', requireRoles('ADMIN', 'CASHIER'), controller.getSummary);
router.post(
  '/',
  requireRoles('ADMIN', 'CASHIER'),
  validate(createCashFlowSchema),
  controller.createRecord
);

export default router;
