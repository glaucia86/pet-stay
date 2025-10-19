import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { BookingService } from './service.js';
import { prisma } from '../../core/database.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';
import {
  createBookingSchema,
  getBookingParamsSchema,
  listBookingsQuerySchema,
  updateBookingStatusSchema,
} from './schemas.js';

const bookingService = new BookingService();

export async function registerBookingRoutes(app: FastifyInstance) {
  // Create booking
  app.post(
    '/api/bookings',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(createBookingSchema),
        response: {
          201: {
            type: 'object',
            properties: {
              booking: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;

        // Get user's tutor profile
        const tutor = await prisma.tutor.findUnique({
          where: { userId: user.userId },
        });

        if (!tutor) {
          return reply.status(400).send({ error: 'You need to complete your tutor profile first' });
        }

        const data = request.body as any;
        const booking = await bookingService.createBooking(tutor.id, data);

        return reply.status(201).send({ booking });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // List bookings
  app.get(
    '/api/bookings',
    {
      onRequest: [authenticateJWT],
      schema: {
        querystring: zodToJsonSchema(listBookingsQuerySchema),
        response: {
          200: {
            type: 'object',
            properties: {
              bookings: { type: 'array' },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const query = request.query as any;
        const result = await bookingService.listBookings(user.userId, query);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get booking by ID
  app.get(
    '/api/bookings/:bookingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getBookingParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              booking: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { bookingId } = request.params as any;
        const booking = await bookingService.getBookingById(bookingId, user.userId);

        return reply.status(200).send({ booking });
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  // Update booking status (confirm/cancel)
  app.patch(
    '/api/bookings/:bookingId/status',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getBookingParamsSchema),
        body: zodToJsonSchema(updateBookingStatusSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              booking: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { bookingId } = request.params as any;
        const data = request.body as any;
        const booking = await bookingService.updateBookingStatus(bookingId, user.userId, data);

        return reply.status(200).send({ booking });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Delete booking
  app.delete(
    '/api/bookings/:bookingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getBookingParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { bookingId } = request.params as any;
        const result = await bookingService.deleteBooking(bookingId, user.userId);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
