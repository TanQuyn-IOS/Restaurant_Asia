import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createSupplierSchema,
  updateSupplierSchema,
  createGoodsReceiptSchema,
  createSupplierPaymentSchema,
} from './supplier.validator';

const router = Router();
const controller = new SupplierController();

router.use(authenticate);

// Nhà cung cấp
router.get('/', controller.getAllSuppliers);
router.get('/:id', controller.getSupplierById);
router.post('/', requireRoles('ADMIN'), validate(createSupplierSchema), controller.createSupplier);
router.put('/:id', requireRoles('ADMIN'), validate(updateSupplierSchema), controller.updateSupplier);

// Phiếu nhập kho
router.get('/receipts/all', requireRoles('ADMIN', 'KITCHEN'), controller.getGoodsReceipts);
router.post(
  '/receipts',
  requireRoles('ADMIN', 'KITCHEN'),
  validate(createGoodsReceiptSchema),
  controller.createGoodsReceipt
);

// Chi trả công nợ
router.post(
  '/payments',
  requireRoles('ADMIN', 'CASHIER'),
  validate(createSupplierPaymentSchema),
  controller.createSupplierPayment
);

export default router;
