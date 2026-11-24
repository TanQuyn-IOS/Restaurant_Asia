/**
 * DATA MIGRATION ENGINE - RESTAURANT ASIA
 * Di chuyển dữ liệu từ localStorage JSON sang MySQL 8.0 Three-Tier Database
 */

import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from '../utils/logger';

export interface LocalStorageExportPayload {
  areas?: any[];
  tables?: any[];
  menuItems?: any[];
  staff?: any[];
  accounts?: any[];
  activeOrders?: any[];
  completedOrders?: any[];
  goodsReceipts?: any[];
  cashFlowRecords?: any[];
  leaveRequests?: any[];
}

export interface MigrationSummary {
  success: boolean;
  importedCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  errors: string[];
}

export async function migrateLocalStorageData(
  payload: LocalStorageExportPayload,
  adminUserId: string
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    success: false,
    importedCounts: {},
    sourceCounts: {
      areas: payload.areas?.length || 0,
      tables: payload.tables?.length || 0,
      menuItems: payload.menuItems?.length || 0,
      staff: payload.staff?.length || 0,
      accounts: payload.accounts?.length || 0,
      orders: (payload.activeOrders?.length || 0) + (payload.completedOrders?.length || 0),
      goodsReceipts: payload.goodsReceipts?.length || 0,
      cashFlowRecords: payload.cashFlowRecords?.length || 0,
      leaveRequests: payload.leaveRequests?.length || 0,
    },
    errors: [],
  };

  const idMap = new Map<string, string>(); // oldId -> newUuid

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Khu vực (Table Areas)
      let areaCount = 0;
      if (payload.areas && payload.areas.length > 0) {
        for (let idx = 0; idx < payload.areas.length; idx++) {
          const a = payload.areas[idx];
          const existing = await tx.tableArea.findUnique({ where: { name: a.name } });
          let newAreaId: string;
          if (existing) {
            newAreaId = existing.id;
          } else {
            const created = await tx.tableArea.create({
              data: {
                name: a.name,
                description: a.description || null,
                displayOrder: idx,
              },
            });
            newAreaId = created.id;
            areaCount++;
          }
          idMap.set(a.id, newAreaId);
        }
      }
      summary.importedCounts['areas'] = areaCount;

      // 2. Bàn ăn (Restaurant Tables)
      let tableCount = 0;
      if (payload.tables && payload.tables.length > 0) {
        for (const t of payload.tables) {
          const targetAreaId = idMap.get(t.areaId) || (await tx.tableArea.findFirst())?.id;
          if (!targetAreaId) continue;

          const shapeUpper = (t.shape || 'SQUARE').toUpperCase() as any;
          const statusUpper = (t.status || 'AVAILABLE').toUpperCase() as any;

          const created = await tx.restaurantTable.create({
            data: {
              name: t.name,
              areaId: targetAreaId,
              capacity: t.capacity || 4,
              shape: shapeUpper,
              status: statusUpper,
              posX: t.x || 0,
              posY: t.y || 0,
              width: t.width || 90,
              height: t.height || 90,
            },
          });
          idMap.set(t.id, created.id);
          tableCount++;
        }
      }
      summary.importedCounts['tables'] = tableCount;

      // 3. Thực đơn (Menu Categories & Menu Items)
      let menuCount = 0;
      if (payload.menuItems && payload.menuItems.length > 0) {
        // Nhóm theo danh mục
        const categoryMap = new Map<string, string>();
        for (const item of payload.menuItems) {
          const catName = item.category || 'Món chính';
          if (!categoryMap.has(catName)) {
            const cat = await tx.category.upsert({
              where: { name: catName },
              update: {},
              create: { name: catName },
            });
            categoryMap.set(catName, cat.id);
          }

          const categoryId = categoryMap.get(catName)!;
          const created = await tx.menuItem.create({
            data: {
              categoryId,
              name: item.name,
              price: new Decimal(item.price || 0),
              costPrice: new Decimal(item.cost || 0),
              unit: item.unit || 'phần',
              description: item.description || null,
              image: item.image || null,
              isAvailable: item.isAvailable ?? true,
              prepTimeMinutes: item.preparationTimeMinutes || 15,
              spicyLevel: item.spicyLevel || 0,
              isPopular: item.isPopular ?? false,
              tags: Array.isArray(item.tags) ? item.tags.join(',') : null,
            },
          });
          idMap.set(item.id, created.id);
          menuCount++;
        }
      }
      summary.importedCounts['menuItems'] = menuCount;

      // 4. Nhân sự (Staff / Employees)
      let staffCount = 0;
      if (payload.staff && payload.staff.length > 0) {
        for (const s of payload.staff) {
          const salaryTypeUpper = (s.salaryType || 'MONTHLY').toUpperCase() as any;
          const statusUpper = (s.status || 'ACTIVE').toUpperCase() as any;

          const created = await tx.employee.create({
            data: {
              name: s.name,
              phone: s.phone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
              email: s.email || null,
              roleTitle: s.role || 'Nhân viên',
              shiftDefault: s.shift || null,
              salaryRate: new Decimal(s.salaryRate || 0),
              salaryType: salaryTypeUpper,
              status: statusUpper,
              ordersHandled: s.ordersHandled || 0,
            },
          });
          idMap.set(s.id, created.id);
          staffCount++;
        }
      }
      summary.importedCounts['staff'] = staffCount;

      // 5. Đơn hàng (Orders & Order Items)
      let orderCount = 0;
      const allOrders = [...(payload.activeOrders || []), ...(payload.completedOrders || [])];
      for (const o of allOrders) {
        const tableId = idMap.get(o.tableId) || (await tx.restaurantTable.findFirst())?.id;
        if (!tableId) continue;

        const orderCode = `MIG-${Date.now().toString().slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const statusUpper = (o.status === 'completed' ? 'COMPLETED' : 'ACTIVE') as any;
        const payStatusUpper = (o.status === 'completed' ? 'PAID' : 'UNPAID') as any;

        const created = await tx.order.create({
          data: {
            code: orderCode,
            tableId,
            customerName: o.customerName || 'Khách vãng lai',
            customerCount: o.customerCount || 2,
            subtotal: new Decimal(o.subtotal || 0),
            discountAmount: new Decimal(o.discountAmount || 0),
            taxAmount: new Decimal(o.taxAmount || 0),
            finalTotal: new Decimal(o.finalTotal || o.total || 0),
            status: statusUpper,
            paymentStatus: payStatusUpper,
            notes: o.tableNotes || null,
          },
        });
        idMap.set(o.id, created.id);
        orderCount++;

        // Chi tiết món
        if (o.items && Array.isArray(o.items)) {
          for (const line of o.items) {
            const menuItemId = idMap.get(line.menuItemId || line.id) || (await tx.menuItem.findFirst())?.id;
            if (!menuItemId) continue;

            const itemStatusUpper = (line.status || 'PENDING').toUpperCase() as any;
            await tx.orderItem.create({
              data: {
                orderId: created.id,
                menuItemId,
                name: line.name || 'Món ăn di chuyển',
                unit: line.unit || 'phần',
                price: new Decimal(line.price || 0),
                quantity: line.quantity || 1,
                note: line.note || null,
                status: itemStatusUpper,
                isStockDeducted: itemStatusUpper === 'COOKING' || itemStatusUpper === 'READY' || itemStatusUpper === 'SERVED',
              },
            });
          }
        }
      }
      summary.importedCounts['orders'] = orderCount;

      summary.success = true;
      logger.info({ summary }, 'Migration hoàn tất thành công!');
    });
  } catch (err: any) {
    summary.success = false;
    summary.errors.push(err.message || String(err));
    logger.error({ err }, 'Migration thất bại! Giao dịch đã được rollback tự động.');
  }

  return summary;
}
