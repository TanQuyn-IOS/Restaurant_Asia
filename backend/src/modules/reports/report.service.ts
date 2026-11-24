import { prisma } from '../../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class ReportService {
  // === EXECUTIVE DASHBOARD SUMMARY ===
  async getDashboardSummary() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayPayments,
      todayOrders,
      activeTablesCount,
      allIngredients,
      recentPendingKds,
    ] = await Promise.all([
      // Doanh thu hôm nay
      prisma.payment.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          paidAt: { gte: todayStart },
        },
        _sum: { amount: true, refundedAmount: true },
      }),
      // Số đơn hàng và số lượt khách hôm nay
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _count: { id: true },
        _sum: { customerCount: true },
      }),
      // Số bàn đang có khách
      prisma.restaurantTable.count({
        where: { status: 'OCCUPIED' },
      }),
      // Danh sách nguyên liệu kiểm tra cảnh báo hết hàng
      prisma.ingredient.findMany({
        select: { id: true, name: true, currentStock: true, minStockLevel: true, baseUnit: true },
      }),
      // Đơn bếp đang chờ
      prisma.orderItem.count({
        where: {
          status: 'PENDING',
          order: { status: 'ACTIVE' },
        },
      }),
    ]);

    const totalRevenue = new Decimal(todayPayments._sum.amount || 0).minus(
      new Decimal(todayPayments._sum.refundedAmount || 0)
    );

    const lowStockCount = allIngredients.filter((i) =>
      new Decimal(i.currentStock).lte(new Decimal(i.minStockLevel))
    ).length;

    return {
      todayRevenue: totalRevenue.toNumber(),
      todayOrdersCount: todayOrders._count.id || 0,
      todayGuestCount: todayOrders._sum.customerCount || 0,
      activeTablesCount,
      lowStockCount,
      pendingKdsCount: recentPendingKds,
    };
  }

  // === BÁO CÁO KẾT QUẢ KINH DOANH (P&L: PROFIT & LOSS) ===
  async getProfitAndLoss(startDate: string, endDate: string) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [payments, refunds, cogsAgg, expenses] = await Promise.all([
      // 1. Doanh thu
      prisma.payment.aggregate({
        where: {
          paymentStatus: 'COMPLETED',
          paidAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      // Hoàn tiền
      prisma.paymentRefund.aggregate({
        where: {
          refundStatus: 'COMPLETED',
          completedAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      // 2. Giá vốn hàng bán (COGS) từ xuất kho nguyên liệu nấu món
      prisma.stockTransaction.aggregate({
        where: {
          transactionType: 'ORDER_CONSUMPTION',
          createdAt: { gte: start, lte: end },
        },
        _sum: { totalCost: true },
      }),
      // 3. Chi phí vận hành khác (lương, điện nước, marketing, ...)
      prisma.cashFlowRecord.groupBy({
        by: ['category'],
        where: {
          type: 'OUTFLOW',
          category: { in: ['STAFF_SALARY', 'UTILITIES', 'MARKETING', 'OTHER'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
    ]);

    const grossRevenue = new Decimal(payments._sum.amount || 0);
    const totalRefunds = new Decimal(refunds._sum.amount || 0);
    const netRevenue = grossRevenue.minus(totalRefunds);

    // COGS lưu số âm trong sổ cái nên lấy trị tuyệt đối
    const cogs = new Decimal(cogsAgg._sum.totalCost || 0).abs();
    const grossProfit = netRevenue.minus(cogs);

    let totalExpenses = new Decimal(0);
    const expenseBreakdown: Record<string, number> = {};
    for (const exp of expenses) {
      const amt = new Decimal(exp._sum.amount || 0);
      totalExpenses = totalExpenses.plus(amt);
      expenseBreakdown[exp.category] = amt.toNumber();
    }

    const netProfit = grossProfit.minus(totalExpenses);

    return {
      period: { startDate, endDate },
      grossRevenue: grossRevenue.toNumber(),
      totalRefunds: totalRefunds.toNumber(),
      netRevenue: netRevenue.toNumber(),
      cogs: cogs.toNumber(),
      grossProfit: grossProfit.toNumber(),
      grossMarginPercent: netRevenue.gt(0) ? grossProfit.dividedBy(netRevenue).times(100).toDecimalPlaces(2).toNumber() : 0,
      expenses: {
        total: totalExpenses.toNumber(),
        breakdown: expenseBreakdown,
      },
      netProfit: netProfit.toNumber(),
      netMarginPercent: netRevenue.gt(0) ? netProfit.dividedBy(netRevenue).times(100).toDecimalPlaces(2).toNumber() : 0,
    };
  }

  // === ĐỊNH GIÁ TỒN KHO NGUYÊN LIỆU (STOCK VALUATION) ===
  async getStockValuation() {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    let totalValuation = new Decimal(0);
    const items = ingredients.map((ing) => {
      const stock = new Decimal(ing.currentStock);
      const unitCost = new Decimal(ing.costPerUnit);
      const totalCost = stock.times(unitCost);
      totalValuation = totalValuation.plus(totalCost);

      return {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        baseUnit: ing.baseUnit,
        currentStock: stock.toNumber(),
        costPerUnit: unitCost.toNumber(),
        totalCost: totalCost.toNumber(),
        isLowStock: stock.lte(new Decimal(ing.minStockLevel)),
      };
    });

    return {
      totalValuation: totalValuation.toNumber(),
      itemCount: items.length,
      items,
    };
  }

  // === TOP MÓN ĂN BÁN CHẠY ===
  async getTopSellingItems(limit: number = 10, startDate?: string, endDate?: string) {
    const where: any = {
      status: { not: 'CANCELLED' },
      order: { status: 'COMPLETED' },
    };
    if (startDate || endDate) {
      where.orderedAt = {};
      if (startDate) where.orderedAt.gte = new Date(startDate);
      if (endDate) where.orderedAt.lte = new Date(endDate);
    }

    const items = await prisma.orderItem.groupBy({
      by: ['name'],
      where,
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return items.map((i) => ({
      name: i.name,
      totalQuantity: i._sum.quantity || 0,
    }));
  }
}
