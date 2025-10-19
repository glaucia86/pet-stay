import { z } from 'zod';
import { idSchema, paginationSchema } from '../../core/config.js';

// Create listing schema
export const createListingSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50).max(2000),
  pricePerDay: z.number().int().positive(),
  currency: z.string().default('BRL'),
  maxPets: z.number().int().positive().default(1),
  acceptsDogs: z.boolean().default(true),
  acceptsCats: z.boolean().default(true),
  acceptsSmallPets: z.boolean().default(true),
  acceptsMediumPets: z.boolean().default(true),
  acceptsLargePets: z.boolean().default(false),
  hasYard: z.boolean().default(false),
  allowsWalks: z.boolean().default(true),
  providesMedication: z.boolean().default(false),
  photos: z.array(z.string().url()).max(10).default([]),
  policies: z.string().max(1000).optional(),
  cancellationPolicy: z.string().max(500).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// Update listing schema
export const updateListingSchema = createListingSchema.partial();

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

// Get listing params
export const getListingParamsSchema = z.object({
  listingId: idSchema,
});

export type GetListingParams = z.infer<typeof getListingParamsSchema>;

// Search listings query
export const searchListingsQuerySchema = paginationSchema.extend({
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  acceptsDogs: z.string().transform(val => val === 'true').optional(),
  acceptsCats: z.string().transform(val => val === 'true').optional(),
  hasYard: z.string().transform(val => val === 'true').optional(),
  petSize: z.enum(['small', 'medium', 'large']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type SearchListingsQuery = z.infer<typeof searchListingsQuerySchema>;

// Toggle listing active status
export const toggleActiveSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleActiveInput = z.infer<typeof toggleActiveSchema>;
