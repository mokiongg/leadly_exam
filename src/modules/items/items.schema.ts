import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  initial_quantity: z
    .number({ message: 'Initial quantity must be a number' })
    .int('Initial quantity must be an integer')
    .min(1, 'Initial quantity must be at least 1'),
});

export const itemIdParamSchema = z.object({
  id: z.uuid({ message: 'Invalid item ID format' }),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type ItemIdParam = z.infer<typeof itemIdParamSchema>;
