import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Role } from '@prisma/client';
import { UserService } from './service.js';
import { authenticateJWT, requireRole, type AuthenticatedUser } from '../../core/middleware.js';
import { uploadImageToS3, isS3Configured } from '../../core/s3.js';
import {
  updateUserSchema,
  updateTutorSchema,
  updateHostSchema,
  getUserParamsSchema,
  listUsersQuerySchema,
  type UpdateUserInput,
  type UpdateTutorInput,
  type UpdateHostInput,
  type GetUserParams,
  type ListUsersQuery,
} from './schemas.js';

const roleMap: Record<'TUTOR' | 'HOST' | 'ADMIN', Role> = {
  TUTOR: Role.tutor,
  HOST: Role.host,
  ADMIN: Role.admin,
};

export async function registerUserRoutes(app: FastifyInstance) {
  const userService = new UserService();

  // Get current user profile
  app.get('/users/me', {
    onRequest: [authenticateJWT],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const userData = await userService.getUserById(user.userId);
        return userData;
      } catch (error) {
        reply.status(404);
        return { error: error instanceof Error ? error.message : 'User not found' };
      }
    },
  });

  // Get user by ID
  app.get<{ Params: GetUserParams }>('/users/:userId', {
    schema: {
      params: zodToJsonSchema(getUserParamsSchema),
    },
    handler: async (request: FastifyRequest<{ Params: GetUserParams }>, reply: FastifyReply) => {
      try {
        const user = await userService.getUserById(request.params.userId);
        return user;
      } catch (error) {
        reply.status(404);
        return { error: error instanceof Error ? error.message : 'User not found' };
      }
    },
  });

  // Update current user profile
  app.patch<{ Body: UpdateUserInput }>('/users/me', {
    onRequest: [authenticateJWT],
    schema: {
      body: zodToJsonSchema(updateUserSchema),
    },
    handler: async (request: FastifyRequest<{ Body: UpdateUserInput }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const updatedUser = await userService.updateUser(user.userId, request.body);
        return updatedUser;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Update failed' };
      }
    },
  });

  // Update tutor profile
  app.patch<{ Body: UpdateTutorInput }>('/users/me/tutor', {
    onRequest: [authenticateJWT],
    schema: {
      body: zodToJsonSchema(updateTutorSchema),
    },
    handler: async (request: FastifyRequest<{ Body: UpdateTutorInput }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const tutor = await userService.updateTutorProfile(user.userId, request.body);
        return tutor;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Update failed' };
      }
    },
  });

  // Update host profile
  app.patch<{ Body: UpdateHostInput }>('/users/me/host', {
    onRequest: [authenticateJWT],
    schema: {
      body: zodToJsonSchema(updateHostSchema),
    },
    handler: async (request: FastifyRequest<{ Body: UpdateHostInput }>, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const host = await userService.updateHostProfile(user.userId, request.body);
        return host;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Update failed' };
      }
    },
  });

  // List users (admin only)
  app.get<{ Querystring: ListUsersQuery }>('/users', {
    onRequest: [requireRole('admin')],
    schema: {
      querystring: zodToJsonSchema(listUsersQuerySchema),
    },
    handler: async (request: FastifyRequest<{ Querystring: ListUsersQuery }>, reply: FastifyReply) => {
      try {
        const roleFilter = request.query.role ? roleMap[request.query.role] : undefined;

        const result = await userService.listUsers(
          Number(request.query.page) || 1,
          Number(request.query.limit) || 20,
          roleFilter,
          request.query.search
        );
        return result;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to list users' };
      }
    },
  });

  // Get user statistics
  app.get('/users/me/stats', {
    onRequest: [authenticateJWT],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const stats = await userService.getUserStats(user.userId);
        return stats;
      } catch (error) {
        reply.status(404);
        return { error: error instanceof Error ? error.message : 'User not found' };
      }
    },
  });

  // Delete user account
  app.delete('/users/me', {
    onRequest: [authenticateJWT],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const result = await userService.deleteUser(user.userId);
        return result;
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Failed to delete user' };
      }
    },
  });

  // Upload user avatar
  app.post('/users/me/avatar', {
    onRequest: [authenticateJWT],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
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
          'avatar',
          data.filename
        );

        // Update user with new avatar URL
        const updatedUser = await userService.updateUser(user.userId, { avatarUrl: url });

        return {
          message: 'Avatar uploaded successfully',
          avatarUrl: updatedUser.avatarUrl,
        };
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Upload failed' };
      }
    },
  });
}

