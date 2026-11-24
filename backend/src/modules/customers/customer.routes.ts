import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCustomerSchema, updateCustomerSchema } from './customer.validator';

const router = Router();
const controller = new CustomerController();

router.use(authenticate);

router.get('/', controller.getCustomers);
router.get('/:id', controller.getCustomerById);
router.post(
  '/',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(createCustomerSchema),
  controller.createCustomer
);
router.put(
  '/:id',
  requireRoles('ADMIN', 'CASHIER'),
  validate(updateCustomerSchema),
  controller.updateCustomer
);

export default router;
