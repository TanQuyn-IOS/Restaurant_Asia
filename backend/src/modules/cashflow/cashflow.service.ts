import { prisma } from '../../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class CashFlowService {
  async getRecords(query: {
    type?: 'INFLOW' | 'OUTFLOW';
    category?: any;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return prisma.cashFlowRecord.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSummary(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [inflows, outflows] = await Promise.all([
      prisma.cashFlowRecord.aggregate({
        where: { ...where, type: 'INFLOW' },
        _sum: { amount: true },
      }),
      prisma.cashFlowRecord.aggregate({
        where: { ...where, type: 'OUTFLOW' },
        _sum: { amount: true },
      }),
    ]);

    const totalInflow = new Decimal(inflows._sum.amount || 0);
    const totalOutflow = new Decimal(outflows._sum.amount || 0);
    const netCashFlow = totalInflow.minus(totalOutflow);

    return {
      totalInflow: totalInflow.toNumber(),
      totalOutflow: totalOutflow.toNumber(),
      netCashFlow: netCashFlow.toNumber(),
    };
  }

  async createManualRecord(data: any, userId: string) {
    return prisma.cashFlowRecord.create({
      data: {
        ...data,
        amount: new Decimal(data.amount),
        createdById: userId,
      },
    });
  }
}
