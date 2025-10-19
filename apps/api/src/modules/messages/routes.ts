import { FastifyInstance } from 'fastify';
import zodToJsonSchema from 'zod-to-json-schema';
import {
  sendMessageSchema,
  listConversationsQuerySchema,
  getConversationMessagesParamsSchema,
  getConversationMessagesQuerySchema,
  markAsReadParamsSchema,
  getMessageParamsSchema,
} from './schemas.js';
import { MessageService } from './service.js';
import { authenticateJWT } from '../../core/middleware.js';
import type { AuthenticatedUser } from '../../core/middleware.js';

const messageService = new MessageService();

export async function registerMessageRoutes(fastify: FastifyInstance) {
  // POST /api/messages - Send a message
  fastify.post(
    '/api/messages',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Send a message to another user in the context of a listing',
        body: zodToJsonSchema(sendMessageSchema),
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              listingId: { type: 'string' },
              senderId: { type: 'string' },
              receiverId: { type: 'string' },
              content: { type: 'string' },
              isRead: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = sendMessageSchema.parse(request.body);

        const message = await messageService.sendMessage(user.userId, data);

        return reply.code(201).send(message);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to send message' });
      }
    }
  );

  // GET /api/messages/conversations - List all conversations
  fastify.get(
    '/api/messages/conversations',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'List all conversations for the authenticated user',
        querystring: zodToJsonSchema(listConversationsQuerySchema),
        response: {
          200: {
            type: 'object',
            properties: {
              conversations: {
                type: 'array',
                items: {
                  type: 'object',
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const query = listConversationsQuerySchema.parse(request.query);

        const result = await messageService.listConversations(user.userId, query.page, query.limit);

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to list conversations' });
      }
    }
  );

  // GET /api/messages/conversations/:listingId/:otherUserId - Get messages in a conversation
  fastify.get(
    '/api/messages/conversations/:listingId/:otherUserId',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Get all messages in a specific conversation',
        params: zodToJsonSchema(getConversationMessagesParamsSchema),
        querystring: zodToJsonSchema(getConversationMessagesQuerySchema),
        response: {
          200: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const params = getConversationMessagesParamsSchema.parse(request.params);
        const query = getConversationMessagesQuerySchema.parse(request.query);

        const result = await messageService.getConversationMessages(
          user.userId,
          params.listingId,
          params.otherUserId,
          query.page,
          query.limit
        );

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to get conversation messages' });
      }
    }
  );

  // PATCH /api/messages/conversations/:listingId/:otherUserId/read - Mark messages as read
  fastify.patch(
    '/api/messages/conversations/:listingId/:otherUserId/read',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Mark all messages from a user in a conversation as read',
        params: zodToJsonSchema(markAsReadParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              markedAsRead: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const params = markAsReadParamsSchema.parse(request.params);

        const result = await messageService.markMessagesAsRead(
          user.userId,
          params.listingId,
          params.otherUserId
        );

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to mark messages as read' });
      }
    }
  );

  // GET /api/messages/unread-count - Get unread message count
  fastify.get(
    '/api/messages/unread-count',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Get the total count of unread messages for the authenticated user',
        response: {
          200: {
            type: 'object',
            properties: {
              unreadCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;

        const result = await messageService.getUnreadCount(user.userId);

        return reply.send(result);
      } catch (error) {
        return reply.code(500).send({ error: 'Failed to get unread count' });
      }
    }
  );

  // GET /api/messages/:messageId - Get a specific message
  fastify.get(
    '/api/messages/:messageId',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Get details of a specific message',
        params: zodToJsonSchema(getMessageParamsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              listingId: { type: 'string' },
              senderId: { type: 'string' },
              receiverId: { type: 'string' },
              content: { type: 'string' },
              isRead: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const params = getMessageParamsSchema.parse(request.params);

        const message = await messageService.getMessageById(params.messageId, user.userId);

        return reply.send(message);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Message not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(400).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to get message' });
      }
    }
  );

  // DELETE /api/messages/:messageId - Delete a message
  fastify.delete(
    '/api/messages/:messageId',
    {
      onRequest: [authenticateJWT],
      schema: {
        tags: ['Messages'],
        description: 'Delete a message (only sender can delete)',
        params: zodToJsonSchema(getMessageParamsSchema),
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
        const params = getMessageParamsSchema.parse(request.params);

        const result = await messageService.deleteMessage(params.messageId, user.userId);

        return reply.send(result);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Message not found') {
            return reply.code(404).send({ error: error.message });
          }
          return reply.code(403).send({ error: error.message });
        }
        return reply.code(500).send({ error: 'Failed to delete message' });
      }
    }
  );
}
