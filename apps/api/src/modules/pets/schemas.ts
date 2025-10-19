import { z } from 'zod';
import { idSchema } from '../../core/config.js';

// Create pet schema
export const createPetSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat']),
  breed: z.string().max(100).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  gender: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  medicalInfo: z.string().max(1000).optional(),
  specialNeeds: z.string().max(500).optional(),
  isVaccinated: z.boolean().default(false),
  vaccinationDetails: z.string().optional(),
  photoUrl: z.string().url().optional(),
  temperament: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;

// Update pet schema
export const updatePetSchema = createPetSchema.partial();

export type UpdatePetInput = z.infer<typeof updatePetSchema>;

// Get pet params
export const getPetParamsSchema = z.object({
  petId: idSchema,
});

export type GetPetParams = z.infer<typeof getPetParamsSchema>;
