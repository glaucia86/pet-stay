import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ListingService } from './service.js';
import { prisma } from '../../core/database.js';
import { authenticateJWT, type AuthenticatedUser } from '../../core/middleware.js';
import { uploadImageToS3, isS3Configured } from '../../core/s3.js';
import {
  createListingSchema,
  updateListingSchema,
  getListingParamsSchema,
  searchListingsQuerySchema,
  toggleActiveSchema,
} from './schemas.js';

const listingService = new ListingService();

export async function registerListingRoutes(app: FastifyInstance) {
  // Create listing
  app.post(
    '/api/listings',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(createListingSchema),
        response: {
          201: {
            type: 'object',
            properties: {
              listing: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;

        // Get user's host profile
        const host = await prisma.host.findUnique({
          where: { userId: user.userId },
        });

        if (!host) {
          return reply.status(400).send({ error: 'You need to complete your host profile first' });
        }

        const data = request.body as any;
        const listing = await listingService.createListing(host.id, data);

        return reply.status(201).send({ listing });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Search listings
  app.get(
    '/api/listings',
    {
      schema: {
        querystring: zodToJsonSchema(searchListingsQuerySchema),
        response: {
          200: {
            type: 'object',
            properties: {
              listings: { type: 'array' },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = request.query as any;
        const result = await listingService.searchListings(query);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get my listings (host)
  app.get(
    '/api/listings/me',
    { onRequest: [authenticateJWT] },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;

        // Get user's host profile
        const host = await prisma.host.findUnique({
          where: { userId: user.userId },
        });

        if (!host) {
          return reply.status(400).send({ error: 'Host profile not found' });
        }

        const listings = await listingService.listListingsByHost(host.id);

        return reply.status(200).send({ listings });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Get listing by ID
  app.get(
    '/api/listings/:listingId',
    {
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              listing: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { listingId } = request.params as any;
        const listing = await listingService.getListingById(listingId);

        return reply.status(200).send({ listing });
      } catch (error: any) {
        return reply.status(404).send({ error: error.message });
      }
    }
  );

  // Update listing
  app.patch(
    '/api/listings/:listingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
        body: zodToJsonSchema(updateListingSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              listing: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { listingId } = request.params as any;
        const data = request.body as any;
        const listing = await listingService.updateListing(listingId, user.userId, data);

        return reply.status(200).send({ listing });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Toggle listing active status
  app.patch(
    '/api/listings/:listingId/toggle-active',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
        body: zodToJsonSchema(toggleActiveSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              listing: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { listingId } = request.params as any;
        const { isActive } = request.body as any;
        const listing = await listingService.toggleListingActive(listingId, user.userId, isActive);

        return reply.status(200).send({ listing });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Delete listing
  app.delete(
    '/api/listings/:listingId',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
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
        const { listingId } = request.params as any;
        const result = await listingService.deleteListing(listingId, user.userId);

        return reply.status(200).send(result);
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Upload listing photos
  app.post(
    '/api/listings/:listingId/photos',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
      },
    },
    async (request, reply) => {
      try {
        // Check if S3 is configured
        if (!isS3Configured()) {
          return reply.status(503).send({ error: 'File upload is not available. S3 is not configured.' });
        }

        const user = request.user as AuthenticatedUser;
        const { listingId } = request.params as any;

        // Check ownership
        const listing = await listingService.getListingById(listingId);
        const host = await prisma.host.findUnique({
          where: { userId: user.userId },
        });

        if (!host || listing.hostId !== host.id) {
          return reply.status(403).send({ error: 'You do not have permission to upload photos for this listing' });
        }

        // Check current photo count
        if (listing.photos.length >= 10) {
          return reply.status(400).send({ error: 'Maximum of 10 photos per listing' });
        }

        // Get uploaded file
        const data = await request.file();
        if (!data) {
          return reply.status(400).send({ error: 'No file uploaded' });
        }

        // Convert file stream to buffer
        const buffer = await data.toBuffer();

        // Upload to S3
        const { url } = await uploadImageToS3(
          buffer,
          data.mimetype,
          buffer.length,
          user.userId,
          'listingPhoto',
          data.filename
        );

        // Add photo URL to listing
        const updatedListing = await prisma.listing.update({
          where: { id: listingId },
          data: {
            photos: {
              push: url,
            },
          },
        });

        return reply.status(200).send({
          message: 'Photo uploaded successfully',
          photoUrl: url,
          totalPhotos: updatedListing.photos.length,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );

  // Delete listing photo
  app.delete(
    '/api/listings/:listingId/photos',
    {
      onRequest: [authenticateJWT],
      schema: {
        params: zodToJsonSchema(getListingParamsSchema),
        body: {
          type: 'object',
          required: ['photoUrl'],
          properties: {
            photoUrl: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { listingId } = request.params as any;
        const { photoUrl } = request.body as any;

        // Check ownership
        const listing = await listingService.getListingById(listingId);
        const host = await prisma.host.findUnique({
          where: { userId: user.userId },
        });

        if (!host || listing.hostId !== host.id) {
          return reply.status(403).send({ error: 'You do not have permission to delete photos for this listing' });
        }

        // Remove photo URL from listing
        const updatedListing = await prisma.listing.update({
          where: { id: listingId },
          data: {
            photos: {
              set: listing.photos.filter((photo) => photo !== photoUrl),
            },
          },
        });

        return reply.status(200).send({
          message: 'Photo deleted successfully',
          totalPhotos: updatedListing.photos.length,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    }
  );
}
