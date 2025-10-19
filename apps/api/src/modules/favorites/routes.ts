import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { FavoriteService } from './service.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';
import {
  addFavoriteParamsSchema,
  removeFavoriteParamsSchema,
  favoriteResponseSchema,
  listFavoritesResponseSchema,
  checkFavoriteResponseSchema,
} from './schemas.js';

export async function registerFavoriteRoutes(app: FastifyInstance) {
  const favoriteService = new FavoriteService();

  // Add listing to favorites
  app.post<{ Params: { listingId: string } }>(
    '/favorites/:listingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(addFavoriteParamsSchema),
      },
    },
    async (request: FastifyRequest<{ Params: { listingId: string } }>, reply: FastifyReply) => {
      const { listingId } = request.params;
      const user = request.user as AuthenticatedUser;
      const userId = user.userId;

      try {
        await favoriteService.addFavorite(userId, listingId);

        return reply.status(201).send({
          message: 'Listing added to favorites',
          isFavorite: true,
        });
      } catch (error: any) {
        if (error.message === 'Listing not found') {
          return reply.status(404).send({ error: error.message });
        }
        if (
          error.message === 'Cannot favorite an inactive listing' ||
          error.message === 'Listing is already in favorites'
        ) {
          return reply.status(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // Remove listing from favorites
  app.delete<{ Params: { listingId: string } }>(
    '/favorites/:listingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(removeFavoriteParamsSchema),
      },
    },
    async (request: FastifyRequest<{ Params: { listingId: string } }>, reply: FastifyReply) => {
      const { listingId } = request.params;
      const user = request.user as AuthenticatedUser;
      const userId = user.userId;

      await favoriteService.removeFavorite(userId, listingId);

      return reply.send({
        message: 'Listing removed from favorites',
        isFavorite: false,
      });
    }
  );

  // List all user favorites
  app.get(
    '/favorites',
    {
      onRequest: [authenticateJWT],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as AuthenticatedUser;
      const userId = user.userId;

      const result = await favoriteService.listFavorites(userId);

      return reply.send(result);
    }
  );

  // Check if listing is favorited (utility endpoint)
  app.get<{ Params: { listingId: string } }>(
    '/favorites/:listingId/check',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(addFavoriteParamsSchema),
      },
    },
    async (request: FastifyRequest<{ Params: { listingId: string } }>, reply: FastifyReply) => {
      const { listingId } = request.params;
      const user = request.user as AuthenticatedUser;
      const userId = user.userId;

      const isFavorite = await favoriteService.checkIsFavorite(userId, listingId);

      return reply.send({ isFavorite });
    }
  );

  // Get favorite count for a listing (public endpoint)
  app.get<{ Params: { listingId: string } }>(
    '/listings/:listingId/favorites/count',
    {
      schema: {
        params: zodToJsonSchema(addFavoriteParamsSchema),
      },
    },
    async (request: FastifyRequest<{ Params: { listingId: string } }>, reply: FastifyReply) => {
      const { listingId } = request.params;

      const count = await favoriteService.getFavoriteCount(listingId);

      return reply.send({ count });
    }
  );
}
