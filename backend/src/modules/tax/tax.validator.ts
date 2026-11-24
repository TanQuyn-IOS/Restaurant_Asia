import { z } from 'zod';

export const createTaxConfigSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(100),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().optional(),
  isDefault: z.boolean().default(false),
  categoryId: z.string().uuid().optional(),
});

export const updateTaxConfigSchema = createTaxConfigSchema.partial();
