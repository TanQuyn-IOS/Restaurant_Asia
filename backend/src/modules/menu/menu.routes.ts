import { Router } from 'express';
import { MenuController } from './menu.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  setBOMSchema,
} from './menu.validator';

const router = Router();
const controller = new MenuController();

router.use(authenticate);

// Danh mục
router.get('/categories', controller.getCategories);
router.post('/categories', requireRoles('ADMIN'), validate(createCategorySchema), controller.createCategory);
router.put('/categories/:id', requireRoles('ADMIN'), validate(updateCategorySchema), controller.updateCategory);
router.delete('/categories/:id', requireRoles('ADMIN'), controller.deleteCategory);

// Món ăn
router.get('/items', controller.getMenuItems);
router.get('/items/:id', controller.getMenuItemById);
router.post('/items', requireRoles('ADMIN'), validate(createMenuItemSchema), controller.createMenuItem);
router.put('/items/:id', requireRoles('ADMIN'), validate(updateMenuItemSchema), controller.updateMenuItem);
router.delete('/items/:id', requireRoles('ADMIN'), controller.deleteMenuItem);
router.patch('/items/:id/toggle-availability', requireRoles('ADMIN', 'KITCHEN'), controller.toggleAvailability);

// Định mức nguyên liệu BOM
router.put('/items/:id/bom', requireRoles('ADMIN', 'KITCHEN'), validate(setBOMSchema), controller.setBOMRecipes);

export default router;
