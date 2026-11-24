import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createIngredientSchema,
  updateIngredientSchema,
  stockTakeAdjustmentSchema,
  wasteDamageSchema,
  unitConversionSchema,
} from './inventory.validator';

const router = Router();
const controller = new InventoryController();

router.use(authenticate);

// Nguyên liệu
router.get('/', controller.getIngredients);
router.get('/:id', controller.getIngredientById);
router.post('/', requireRoles('ADMIN'), validate(createIngredientSchema), controller.createIngredient);
router.put('/:id', requireRoles('ADMIN'), validate(updateIngredientSchema), controller.updateIngredient);
router.delete('/:id', requireRoles('ADMIN'), controller.deleteIngredient);

// Kiểm kê cân đối
router.post(
  '/adjustment',
  requireRoles('ADMIN', 'KITCHEN'),
  validate(stockTakeAdjustmentSchema),
  controller.adjustStock
);

// Báo hỏng / hao hụt
router.post('/waste', requireRoles('ADMIN', 'KITCHEN'), validate(wasteDamageSchema), controller.recordWaste);

// Đối chiếu sổ cái
router.get('/:id/reconciliation', requireRoles('ADMIN'), controller.reconcileLedger);

// Quy đổi đơn vị
router.post(
  '/:id/conversions',
  requireRoles('ADMIN'),
  validate(unitConversionSchema),
  controller.setUnitConversion
);

export default router;
