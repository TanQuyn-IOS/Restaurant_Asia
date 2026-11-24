import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middlewares/errorHandler.middleware';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import tableRoutes from './modules/tables/table.routes';
import menuRoutes from './modules/menu/menu.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import orderRoutes from './modules/orders/order.routes';
import kitchenRoutes from './modules/kitchen/kitchen.routes';
import waiterRoutes from './modules/waiter/waiter.routes';
import paymentRoutes from './modules/payments/payment.routes';
import supplierRoutes from './modules/suppliers/supplier.routes';
import cashFlowRoutes from './modules/cashflow/cashflow.routes';
import hrRoutes from './modules/hr/hr.routes';
import customerRoutes from './modules/customers/customer.routes';
import reservationRoutes from './modules/reservations/reservation.routes';
import taxRoutes from './modules/tax/tax.routes';
import reportRoutes from './modules/reports/report.routes';
import auditRoutes from './modules/audit/audit.routes';
import syncRoutes from './modules/sync/sync.routes';

export const createApp = (): Application => {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health Check Endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Restaurant Asia Backend API',
      version: '2.4.0',
    });
  });

  // REST API v1 Routing
  const apiV1 = express.Router();

  apiV1.use('/auth', authRoutes);
  apiV1.use('/tables', tableRoutes);
  apiV1.use('/menu', menuRoutes);
  apiV1.use('/inventory', inventoryRoutes);
  apiV1.use('/orders', orderRoutes);
  apiV1.use('/kitchen', kitchenRoutes);
  apiV1.use('/waiter', waiterRoutes);
  apiV1.use('/payments', paymentRoutes);
  apiV1.use('/suppliers', supplierRoutes);
  apiV1.use('/cashflow', cashFlowRoutes);
  apiV1.use('/hr', hrRoutes);
  apiV1.use('/customers', customerRoutes);
  apiV1.use('/reservations', reservationRoutes);
  apiV1.use('/tax', taxRoutes);
  apiV1.use('/reports', reportRoutes);
  apiV1.use('/audit-logs', auditRoutes);
  apiV1.use('/sync', syncRoutes);

  app.use('/api/v1', apiV1);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
