import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(100),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const recipeItemSchema = z.object({
  ingredientId: z.string().uuid(),
  quantityRequired: z.number().positive('Số lượng định mức phải lớn hơn 0'),
  unit: z.string().min(1, 'Đơn vị không được để trống'),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid('ID danh mục không hợp lệ'),
  name: z.string().min(1, 'Tên món không được để trống').max(150),
  price: z.number().min(0, 'Giá bán phải >= 0'),
  costPrice: z.number().min(0, 'Giá vốn phải >= 0').default(0),
  unit: z.string().default('phần'),
  description: z.string().optional(),
  image: z.string().url().or(z.string()).optional(),
  isAvailable: z.boolean().default(true),
  prepTimeMinutes: z.number().int().min(1).default(15),
  spicyLevel: z.number().int().min(0).max(5).default(0),
  tags: z.string().optional(),
  isPopular: z.boolean().default(false),
  taxRateOverride: z.number().min(0).max(100).nullable().optional(),
  recipes: z.array(recipeItemSchema).optional(), // BOM nguyên liệu
});

export const updateMenuItemSchema = createMenuItemSchema.partial();

export const setBOMSchema = z.object({
  recipes: z.array(recipeItemSchema),
});
