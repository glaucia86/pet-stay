import { z } from 'zod';

export const searchListingsSchema = z.object({
  // Location filters
  city: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().default(50), // km

  // Price filters
  minPrice: z.number().int().positive().optional(),
  maxPrice: z.number().int().positive().optional(),

  // Pet type filters
  acceptsDogs: z.boolean().optional(),
  acceptsCats: z.boolean().optional(),

  // Pet size filters
  petSize: z.enum(['small', 'medium', 'large']).optional(),

  // Amenities
  hasYard: z.boolean().optional(),
  allowsWalks: z.boolean().optional(),
  providesMedication: z.boolean().optional(),

  // Date availability
  startDate: z.string().optional(),
  endDate: z.string().optional(),

  // Rating filter
  minRating: z.number().min(1).max(5).optional(),

  // Sorting
  sortBy: z.enum(['price', 'distance', 'rating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type SearchListingsInput = z.infer<typeof searchListingsSchema>;
