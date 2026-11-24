import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { Decimal } from '@prisma/client/runtime/library';

export class TaxService {
  async getAllTaxConfigs() {
    return prisma.taxConfig.findMany({
      include: { category: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async getActiveTaxConfig(categoryId?: string) {
    const now = new Date();
    // Ưu tiên cấu hình thuế theo danh mục
    if (categoryId) {
      const catTax = await prisma.taxConfig.findFirst({
        where: {
          categoryId,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
      });
      if (catTax) return catTax;
    }

    // Mặc định thuế toàn nhà hàng
    return prisma.taxConfig.findFirst({
      where: {
        isDefault: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
    });
  }

  async createTaxConfig(data: any) {
    const existing = await prisma.taxConfig.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError(`Mã cấu hình thuế "${data.code}" đã tồn tại`);

    return prisma.taxConfig.create({
      data: {
        ...data,
        rate: new Decimal(data.rate),
        effectiveFrom: new Date(data.effectiveFrom),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      },
    });
  }

  async updateTaxConfig(id: string, data: any) {
    const tax = await prisma.taxConfig.findUnique({ where: { id } });
    if (!tax) throw new NotFoundError('Không tìm thấy cấu hình thuế');

    return prisma.taxConfig.update({
      where: { id },
      data: {
        ...data,
        rate: data.rate !== undefined ? new Decimal(data.rate) : undefined,
        effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
        effectiveTo: data.effectiveTo !== undefined ? (data.effectiveTo ? new Date(data.effectiveTo) : null) : undefined,
      },
    });
  }
}
