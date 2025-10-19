import { z } from 'zod';

// Schema for sending a message
export const sendMessageSchema = z.object({
  listingId: z.string().cuid(),
  receiverId: z.string().cuid(),
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be less than 2000 characters'),
});

// Schema for listing conversations
export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// Schema for getting messages in a conversation
export const getConversationMessagesParamsSchema = z.object({
  listingId: z.string().cuid(),
  otherUserId: z.string().cuid(),
});

export const getConversationMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

// Schema for marking messages as read
export const markAsReadParamsSchema = z.object({
  listingId: z.string().cuid(),
  otherUserId: z.string().cuid(),
});

// Schema for getting message details
export const getMessageParamsSchema = z.object({
  messageId: z.string().cuid(),
});

// Types
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type GetConversationMessagesParams = z.infer<typeof getConversationMessagesParamsSchema>;
export type GetConversationMessagesQuery = z.infer<typeof getConversationMessagesQuerySchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;
export type GetMessageParams = z.infer<typeof getMessageParamsSchema>;
