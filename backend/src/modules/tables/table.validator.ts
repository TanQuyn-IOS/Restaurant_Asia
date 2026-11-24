import { z } from 'zod';

export const createAreaSchema = z.object({
  name: z.string().min(1, 'Tên khu vực không được để trống').max(100),
  description: z.string().max(255).optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export const updateAreaSchema = createAreaSchema.partial();

export const createTableSchema = z.object({
  name: z.string().min(1, 'Tên bàn không được để trống').max(50),
  areaId: z.string().uuid('ID khu vực không hợp lệ'),
  capacity: z.number().int().min(1).default(4),
  shape: z.enum(['ROUND', 'SQUARE', 'RECTANGLE']).default('SQUARE'),
  posX: z.number().default(0),
  posY: z.number().default(0),
  width: z.number().default(90),
  height: z.number().default(90),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  areaId: z.string().uuid().optional(),
  capacity: z.number().int().min(1).optional(),
  shape: z.enum(['ROUND', 'SQUARE', 'RECTANGLE']).optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING']).optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP', 'GROUP']).nullable().optional(),
  version: z.number().int().optional(), // Optimistic locking
});

export const transferTableSchema = z.object({
  sourceTableId: z.string().uuid(),
  targetTableId: z.string().uuid(),
  orderId: z.string().uuid(),
  sourceVersion: z.number().int(),
  targetVersion: z.number().int(),
});
