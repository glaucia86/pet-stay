import { z } from 'zod';
import { idSchema } from '../../core/config.js';

// Create review schema
export const createReviewSchema = z.object({
  bookingId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// Update review schema
export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).max(1000).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// Get review params
export const getReviewParamsSchema = z.object({
  reviewId: idSchema,
});

export type GetReviewParams = z.infer<typeof getReviewParamsSchema>;

// List reviews query schema
export const listReviewsQuerySchema = z.object({
  userId: idSchema.optional(),
  listingId: idSchema.optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
