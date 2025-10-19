import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { PetService } from './service.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';
import { uploadImageToS3, isS3Configured } from '../../core/s3.js';
import {
  createPetSchema,
  updatePetSchema,
  getPetParamsSchema,
  type CreatePetInput,
  type UpdatePetInput,
  type GetPetParams,
} from './schemas.js';

export async function registerPetRoutes(app: FastifyInstance) {
  const petService = new PetService();

  // Create a new pet
  app.post<{ Body: CreatePetInput }>('/pets', {
    onRequest: [authenticateJWT],
    schema: {
      body: zodToJsonSchema(createPetSchema),
    },
    handler: async (request: FastifyRequest<{ Body: CreatePetInput }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const pet = await petService.createPet(user.userId, request.body);
        reply.status(201);
        return pet;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to create pet' };
      }
    },
  });

  // Get all pets for current user
  app.get('/pets', {
    onRequest: [authenticateJWT],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const pets = await petService.listPetsByTutor(user.userId);
        return pets;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to list pets' };
      }
    },
  });

  // Get pet by ID
  app.get<{ Params: GetPetParams }>('/pets/:petId', {
    onRequest: [authenticateJWT],
    schema: {
      params: zodToJsonSchema(getPetParamsSchema),
    },
    handler: async (request: FastifyRequest<{ Params: GetPetParams }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const pet = await petService.getPetById(request.params.petId, user.userId);
        return pet;
      } catch (error) {
        reply.status(404);
        return { error: error instanceof Error ? error.message : 'Pet not found' };
      }
    },
  });

  // Update pet
  app.patch<{ Params: GetPetParams; Body: UpdatePetInput }>('/pets/:petId', {
    onRequest: [authenticateJWT],
    schema: {
      params: zodToJsonSchema(getPetParamsSchema),
      body: zodToJsonSchema(updatePetSchema),
    },
    handler: async (request: FastifyRequest<{ Params: GetPetParams; Body: UpdatePetInput }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const pet = await petService.updatePet(request.params.petId, user.userId, request.body);
        return pet;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to update pet' };
      }
    },
  });

  // Delete pet
  app.delete<{ Params: GetPetParams }>('/pets/:petId', {
    onRequest: [authenticateJWT],
    schema: {
      params: zodToJsonSchema(getPetParamsSchema),
    },
    handler: async (request: FastifyRequest<{ Params: GetPetParams }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const result = await petService.deletePet(request.params.petId, user.userId);
        return result;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to delete pet' };
      }
    },
  });

  // Upload pet photo
  app.post<{ Params: GetPetParams }>('/pets/:petId/photo', {
    onRequest: [authenticateJWT],
    schema: {
      params: zodToJsonSchema(getPetParamsSchema),
    },
    handler: async (request: FastifyRequest<{ Params: GetPetParams }>, reply: FastifyReply) => {
      try {
        // Check if S3 is configured
        if (!isS3Configured()) {
          reply.status(503);
          return { error: 'File upload is not available. S3 is not configured.' };
        }

        const user = request.user as AuthenticatedUser;

        // Get uploaded file
        const data = await request.file();
        if (!data) {
          reply.status(400);
          return { error: 'No file uploaded' };
        }

        // Convert file stream to buffer
        const buffer = await data.toBuffer();

        // Upload to S3
        const { url } = await uploadImageToS3(
          buffer,
          data.mimetype,
          buffer.length,
          user.userId,
          'petPhoto',
          data.filename
        );

        // Update pet with new photo URL
        const pet = await petService.updatePet(request.params.petId, user.userId, { photoUrl: url });

        return {
          message: 'Pet photo uploaded successfully',
          photoUrl: pet.photoUrl,
        };
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Upload failed' };
      }
    },
  });
}
