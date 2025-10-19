import { z } from 'zod';
import { idSchema, paginationSchema } from '../../core/config.js';

// Create booking schema
export const createBookingSchema = z.object({
  listingId: idSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalPrice: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// Get booking params
export const getBookingParamsSchema = z.object({
  bookingId: idSchema,
});

export type GetBookingParams = z.infer<typeof getBookingParamsSchema>;

// List bookings query
export const listBookingsQuerySchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'ongoing', 'completed', 'canceled']).optional(),
  role: z.enum(['tutor', 'host']).optional(),
});

export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;

// Update booking status schema
export const updateBookingStatusSchema = z.object({
  status: z.enum(['confirmed', 'canceled']),
  cancellationReason: z.string().max(500).optional(),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
