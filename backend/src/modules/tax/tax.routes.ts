import { Router } from 'express';
import { TaxController } from './tax.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createTaxConfigSchema, updateTaxConfigSchema } from './tax.validator';

const router = Router();
const controller = new TaxController();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/active', controller.getActive);
router.post('/', requireRoles('ADMIN'), validate(createTaxConfigSchema), controller.create);
router.put('/:id', requireRoles('ADMIN'), validate(updateTaxConfigSchema), controller.update);

export default router;
