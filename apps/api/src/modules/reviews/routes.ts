import type { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ReviewService } from './service.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewParamsSchema,
  listReviewsQuerySchema,
} from './schemas.js';

export async function registerReviewRoutes(app: FastifyInstance) {
  const reviewService = new ReviewService();

  // Create a review for a completed booking
  app.post(
    '/api/reviews',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(createReviewSchema),
        response: {
          201: {
            type: 'object',
            properties: {
              review: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = request.body as any;
        const review = await reviewService.createReview(user.userId, data);

        return reply.status(201).send({ review });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // List reviews with filters
  app.get(
    '/api/reviews',
    {
      schema: {
        querystring: zodToJsonSchema(listReviewsQuerySchema),
        response: {
          200: {
            type: 'object',
            properties: {
              reviews: { type: 'array' },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const result = await reviewService.listReviews(query);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get reviews received by the authenticated user
  app.get(
    '/api/reviews/me/received',
    {
      onRequest: [authenticateJWT],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              reviews: { type: 'array' },
              averageRating: { type: 'number' },
              totalReviews: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const result = await reviewService.getReceivedReviews(user.userId);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get reviews given by the authenticated user
  app.get(
    '/api/reviews/me/given',
    {
      onRequest: [authenticateJWT],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              reviews: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const reviews = await reviewService.getGivenReviews(user.userId);

        return reply.status(200).send({ reviews });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get bookings that can be reviewed
  app.get(
    '/api/reviews/reviewable-bookings',
    {
      onRequest: [authenticateJWT],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              bookings: { type: 'array' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const bookings = await reviewService.getReviewableBookings(user.userId);

        return reply.status(200).send({ bookings });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get review by ID
  app.get(
    '/api/reviews/:reviewId',
    {
      schema: {
        params: zodToJsonSchema(getReviewParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              review: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { reviewId } = request.params as any;
        const review = await reviewService.getReviewById(reviewId);

        return reply.status(200).send({ review });
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  // Update a review
  app.patch(
    '/api/reviews/:reviewId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getReviewParamsSchema),
        body: zodToJsonSchema(updateReviewSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              review: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { reviewId } = request.params as any;
        const data = request.body as any;
        const review = await reviewService.updateReview(reviewId, user.userId, data);

        return reply.status(200).send({ review });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Delete a review
  app.delete(
    '/api/reviews/:reviewId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getReviewParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { reviewId } = request.params as any;
        const result = await reviewService.deleteReview(reviewId, user.userId);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
