import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/rbac.middleware';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

router.get('/dashboard', requireRoles('ADMIN', 'CASHIER'), controller.getDashboardSummary);
router.get('/pnl', requireRoles('ADMIN'), controller.getProfitAndLoss);
router.get('/stock-valuation', requireRoles('ADMIN', 'KITCHEN'), controller.getStockValuation);
router.get('/top-selling', requireRoles('ADMIN', 'CASHIER', 'KITCHEN'), controller.getTopSellingItems);

export default router;
