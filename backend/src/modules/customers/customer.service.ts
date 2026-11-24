import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';

export class CustomerService {
  async getCustomers(query: { search?: string; customerType?: any }) {
    const where: any = {};
    if (query.customerType) where.customerType = query.customerType;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search } },
        { phone: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }

    return prisma.customer.findMany({
      where,
      orderBy: { totalSpent: 'desc' },
    });
  }

  async getCustomerById(id: string) {
    const cust = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reservations: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });
    if (!cust) throw new NotFoundError('Không tìm thấy khách hàng');
    return cust;
  }

  async createCustomer(data: any) {
    const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing) throw new ConflictError(`Khách hàng có số điện thoại ${data.phone} đã tồn tại`);
    return prisma.customer.create({ data });
  }

  async updateCustomer(id: string, data: any) {
    const cust = await prisma.customer.findUnique({ where: { id } });
    if (!cust) throw new NotFoundError('Không tìm thấy khách hàng');
    return prisma.customer.update({ where: { id }, data });
  }
}
