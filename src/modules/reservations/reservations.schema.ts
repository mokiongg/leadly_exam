import { z } from 'zod';

export const createReservationSchema = z.object({
  item_id: z.uuid({ message: 'Invalid item ID format' }),
  customer_id: z.string().min(1, 'Customer ID is required').max(255, 'Customer ID must be at most 255 characters'),
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
});

export const reservationIdParamSchema = z.object({
  id: z.uuid({ message: 'Invalid reservation ID format' }),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReservationIdParam = z.infer<typeof reservationIdParamSchema>;
