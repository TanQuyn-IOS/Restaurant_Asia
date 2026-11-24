import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors';
import { createOutboxEvent } from '../../realtime/outbox.helper';
import { Decimal } from '@prisma/client/runtime/library';

export class MenuService {
  // === DANH MỤC (CATEGORIES) ===
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: {
            menuItems: { where: { isDeleted: false } },
          },
        },
      },
    });
  }

  async createCategory(data: { name: string; displayOrder?: number; isActive?: boolean }) {
    const existing = await prisma.category.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictError(`Danh mục "${data.name}" đã tồn tại`);
    return prisma.category.create({ data });
  }

  async updateCategory(id: string, data: any) {
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundError('Không tìm thấy danh mục');
    return prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id: string) {
    const cat = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { menuItems: { where: { isDeleted: false } } },
        },
      },
    });
    if (!cat) throw new NotFoundError('Không tìm thấy danh mục');
    if (cat._count.menuItems > 0) {
      throw new BadRequestError('Không thể xóa danh mục đang có món ăn hoạt động');
    }
    return prisma.category.delete({ where: { id } });
  }

  // === MÓN ĂN (MENU ITEMS) ===
  async getAllMenuItems(query: { categoryId?: string; search?: string; isAvailable?: boolean; includeDeleted?: boolean }) {
    const where: any = {};

    if (!query.includeDeleted) {
      where.isDeleted = false;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
        { tags: { contains: query.search } },
      ];
    }

    return prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async getMenuItemById(id: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true,
          },
        },
      },
    });
    if (!item || item.isDeleted) throw new NotFoundError('Không tìm thấy món ăn');
    return item;
  }

  async createMenuItem(data: any) {
    const { recipes, ...itemData } = data;

    return prisma.$transaction(async (tx) => {
      const createdItem = await tx.menuItem.create({
        data: itemData,
      });

      if (recipes && Array.isArray(recipes) && recipes.length > 0) {
        for (const r of recipes) {
          await tx.recipe.create({
            data: {
              menuItemId: createdItem.id,
              ingredientId: r.ingredientId,
              quantityRequired: r.quantityRequired,
              unit: r.unit,
            },
          });
        }
        // Tính toán lại giá vốn từ BOM
        await this.recalculateCostPrice(tx, createdItem.id);
      }

      const result = await tx.menuItem.findUnique({
        where: { id: createdItem.id },
        include: {
          category: true,
          recipes: { include: { ingredient: true } },
        },
      });

      await createOutboxEvent(tx, 'MENU', createdItem.id, 'menu.item_created', result);
      return result;
    });
  }

  async updateMenuItem(id: string, data: any) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.isDeleted) throw new NotFoundError('Không tìm thấy món ăn');

    const { recipes, ...updateData } = data;

    return prisma.$transaction(async (tx) => {
      await tx.menuItem.update({
        where: { id },
        data: updateData,
      });

      if (recipes && Array.isArray(recipes)) {
        await tx.recipe.deleteMany({ where: { menuItemId: id } });
        for (const r of recipes) {
          await tx.recipe.create({
            data: {
              menuItemId: id,
              ingredientId: r.ingredientId,
              quantityRequired: r.quantityRequired,
              unit: r.unit,
            },
          });
        }
        await this.recalculateCostPrice(tx, id);
      }

      const result = await tx.menuItem.findUnique({
        where: { id },
        include: {
          category: true,
          recipes: { include: { ingredient: true } },
        },
      });

      await createOutboxEvent(tx, 'MENU', id, 'menu.item_updated', result);
      return result;
    });
  }

  async softDeleteMenuItem(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Không tìm thấy món ăn');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.menuItem.update({
        where: { id },
        data: { isDeleted: true },
      });

      await createOutboxEvent(tx, 'MENU', id, 'menu.item_deleted', { id });
      return updated;
    });
  }

  async toggleAvailability(id: string) {
    const item = await prisma.menuItem.findUnique({ where: { id } });
    if (!item || item.isDeleted) throw new NotFoundError('Không tìm thấy món ăn');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.menuItem.update({
        where: { id },
        data: { isAvailable: !item.isAvailable },
      });

      await createOutboxEvent(tx, 'MENU', id, 'menu.item_availability_changed', updated);
      return updated;
    });
  }

  // === ĐỊNH MỨC NGUYÊN LIỆU (BOM RECIPES) & TỰ ĐỘNG TÍNH GIÁ VỐN ===
  async setBOMRecipes(menuItemId: string, recipes: Array<{ ingredientId: string; quantityRequired: number; unit: string }>) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.menuItem.findUnique({ where: { id: menuItemId } });
      if (!item || item.isDeleted) throw new NotFoundError('Không tìm thấy món ăn');

      await tx.recipe.deleteMany({ where: { menuItemId } });

      for (const r of recipes) {
        await tx.recipe.create({
          data: {
            menuItemId,
            ingredientId: r.ingredientId,
            quantityRequired: r.quantityRequired,
            unit: r.unit,
          },
        });
      }

      await this.recalculateCostPrice(tx, menuItemId);

      return tx.recipe.findMany({
        where: { menuItemId },
        include: { ingredient: true },
      });
    });
  }

  private async recalculateCostPrice(tx: any, menuItemId: string) {
    const recipes = await tx.recipe.findMany({
      where: { menuItemId },
      include: { ingredient: true },
    });

    let totalCost = new Decimal(0);
    for (const r of recipes) {
      const ingCost = new Decimal(r.ingredient.costPerUnit || 0);
      const qty = new Decimal(r.quantityRequired || 0);
      totalCost = totalCost.plus(ingCost.times(qty));
    }

    await tx.menuItem.update({
      where: { id: menuItemId },
      data: { costPrice: totalCost },
    });
  }
}
