import { Router } from 'express';
import { TableController } from './table.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createAreaSchema,
  updateAreaSchema,
  createTableSchema,
  updateTableSchema,
  transferTableSchema,
} from './table.validator';

const router = Router();
const controller = new TableController();

router.use(authenticate);

// Khu vực
router.get('/areas', controller.getAreas);
router.post('/areas', requireRoles('ADMIN'), validate(createAreaSchema), controller.createArea);
router.put('/areas/:id', requireRoles('ADMIN'), validate(updateAreaSchema), controller.updateArea);
router.delete('/areas/:id', requireRoles('ADMIN'), controller.deleteArea);

// Bàn ăn
router.get('/', controller.getTables);
router.get('/:id', controller.getTableById);
router.post('/', requireRoles('ADMIN'), validate(createTableSchema), controller.createTable);
router.put('/:id', requireRoles('ADMIN', 'CASHIER', 'WAITER'), validate(updateTableSchema), controller.updateTable);
router.delete('/:id', requireRoles('ADMIN'), controller.deleteTable);

// Sơ đồ bàn (Floor Plan layout)
router.post('/positions', requireRoles('ADMIN'), controller.updatePositions);

// Chuyển bàn
router.post(
  '/transfer',
  requireRoles('ADMIN', 'CASHIER', 'WAITER'),
  validate(transferTableSchema),
  controller.transferTable
);

export default router;
