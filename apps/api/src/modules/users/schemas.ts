import { z } from 'zod';
import { emailSchema, idSchema, paginationSchema } from '../../core/config.js';

// Update user profile schema
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Update tutor profile schema
export const updateTutorSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export type UpdateTutorInput = z.infer<typeof updateTutorSchema>;

// Update host profile schema
export const updateHostSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  propertyType: z.string().optional(),
  propertySize: z.number().optional(),
  hasYard: z.boolean().optional(),
  acceptedPetSizes: z.array(z.string()).optional(),
  acceptedPetTypes: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
});

export type UpdateHostInput = z.infer<typeof updateHostSchema>;

// Get user params
export const getUserParamsSchema = z.object({
  userId: idSchema,
});

export type GetUserParams = z.infer<typeof getUserParamsSchema>;

// List users query
export const listUsersQuerySchema = paginationSchema.extend({
  role: z.enum(['TUTOR', 'HOST', 'ADMIN']).optional(),
  search: z.string().optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
