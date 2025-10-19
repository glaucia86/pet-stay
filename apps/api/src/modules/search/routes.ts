import type { FastifyInstance } from 'fastify';
import { SearchService } from './service.js';
import { searchListingsSchema } from './schemas.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';

const searchService = new SearchService();

export async function registerSearchRoutes(app: FastifyInstance) {
  // Search listings with filters
  app.get('/v1/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          state: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          radius: { type: 'number' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          acceptsDogs: { type: 'boolean' },
          acceptsCats: { type: 'boolean' },
          petSize: { type: 'string', enum: ['small', 'medium', 'large'] },
          hasYard: { type: 'boolean' },
          allowsWalks: { type: 'boolean' },
          providesMedication: { type: 'boolean' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          minRating: { type: 'number' },
          sortBy: { type: 'string', enum: ['price', 'distance', 'rating', 'createdAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Parse query parameters
        const query: any = {};
        
        if (request.query) {
          const q = request.query as any;
          
          // String parameters
          if (q.city) query.city = q.city;
          if (q.state) query.state = q.state;
          if (q.petSize) query.petSize = q.petSize;
          if (q.sortBy) query.sortBy = q.sortBy;
          if (q.sortOrder) query.sortOrder = q.sortOrder;
          if (q.startDate) query.startDate = q.startDate;
          if (q.endDate) query.endDate = q.endDate;
          
          // Number parameters
          if (q.latitude !== undefined) query.latitude = Number(q.latitude);
          if (q.longitude !== undefined) query.longitude = Number(q.longitude);
          if (q.radius !== undefined) query.radius = Number(q.radius);
          if (q.minPrice !== undefined) query.minPrice = Number(q.minPrice);
          if (q.maxPrice !== undefined) query.maxPrice = Number(q.maxPrice);
          if (q.minRating !== undefined) query.minRating = Number(q.minRating);
          if (q.page !== undefined) query.page = Number(q.page);
          if (q.limit !== undefined) query.limit = Number(q.limit);
          
          // Boolean parameters
          if (q.acceptsDogs !== undefined) query.acceptsDogs = q.acceptsDogs === 'true';
          if (q.acceptsCats !== undefined) query.acceptsCats = q.acceptsCats === 'true';
          if (q.hasYard !== undefined) query.hasYard = q.hasYard === 'true';
          if (q.allowsWalks !== undefined) query.allowsWalks = q.allowsWalks === 'true';
          if (q.providesMedication !== undefined) query.providesMedication = q.providesMedication === 'true';
        }

        // Validate with Zod
        const validatedQuery = searchListingsSchema.parse(query);
        
        const result = await searchService.searchListings(validatedQuery);
        return reply.send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.status(400).send({
          error: 'Invalid search parameters',
          message: error.message,
        });
      }
    },
  });

  // Get popular listings
  app.get('/v1/search/popular', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { limit = 10 } = request.query as { limit?: number };
        const listings = await searchService.getPopularListings(limit);
        return reply.send({ listings });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to get popular listings',
          message: error.message,
        });
      }
    },
  });

  // Get suggested listings (requires authentication)
  app.get('/v1/search/suggested', {
    preHandler: [authenticateJWT],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const { limit = 10 } = request.query as { limit?: number };
        const user = request.user as AuthenticatedUser;
        const userId = user.userId;
        
        const listings = await searchService.getSuggestedListings(userId, limit);
        return reply.send({ listings });
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          error: 'Failed to get suggested listings',
          message: error.message,
        });
      }
    },
  });
}
