import { prisma } from '../../core/database.js';
import type { SendMessageInput } from './schemas.js';

export class MessageService {
  /**
   * Send a message from one user to another in the context of a listing
   */
  async sendMessage(senderId: string, data: SendMessageInput) {
    const { listingId, receiverId, content } = data;

    // Validate that sender and receiver are different
    if (senderId === receiverId) {
      throw new Error('Cannot send message to yourself');
    }

    // Validate that listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        host: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Validate that sender and receiver have a valid relationship with the listing
    // Either sender is host and receiver is a tutor, or sender is tutor and receiver is host
    const senderUser = await prisma.user.findUnique({
      where: { id: senderId },
      include: {
        tutor: true,
        host: true,
      },
    });

    const receiverUser = await prisma.user.findUnique({
      where: { id: receiverId },
      include: {
        tutor: true,
        host: true,
      },
    });

    if (!senderUser || !receiverUser) {
      throw new Error('Sender or receiver not found');
    }

    // Validate that one is the host of the listing and the other is a tutor
    const isHostConversation =
      (listing.host.userId === senderId && receiverUser.tutor) ||
      (listing.host.userId === receiverId && senderUser.tutor);

    if (!isHostConversation) {
      throw new Error('Invalid conversation participants for this listing');
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        listingId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Get all conversations for a user grouped by listing and other participant
   */
  async listConversations(userId: string, page: number = 1, limit: number = 20) {
    // Get all messages where user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            photos: true,
            pricePerDay: true,
            host: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group messages by conversation (listingId + otherUserId)
    const conversationsMap = new Map<string, any>();

    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const conversationKey = `${message.listingId}-${otherUserId}`;

      if (!conversationsMap.has(conversationKey)) {
        // Count unread messages in this conversation
        const unreadCount = await prisma.message.count({
          where: {
            listingId: message.listingId,
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
        });

        conversationsMap.set(conversationKey, {
          listingId: message.listingId,
          listing: message.listing,
          otherUser: message.senderId === userId ? message.receiver : message.sender,
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            isRead: message.isRead,
            isSentByMe: message.senderId === userId,
          },
          unreadCount,
        });
      }
    }

    // Convert map to array and paginate
    const conversations = Array.from(conversationsMap.values());
    const skip = (page - 1) * limit;
    const paginatedConversations = conversations.slice(skip, skip + limit);

    return {
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total: conversations.length,
        totalPages: Math.ceil(conversations.length / limit),
      },
    };
  }

  /**
   * Get all messages in a specific conversation
   */
  async getConversationMessages(
    userId: string,
    listingId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 50
  ) {
    // Validate that the conversation exists and user is part of it
    const messageCount = await prisma.message.count({
      where: {
        listingId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
    });

    if (messageCount === 0) {
      throw new Error('Conversation not found');
    }

    const skip = (page - 1) * limit;

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      skip,
      take: limit,
    });

    return {
      messages,
      pagination: {
        page,
        limit,
        total: messageCount,
        totalPages: Math.ceil(messageCount / limit),
      },
    };
  }

  /**
   * Mark all messages from a specific sender in a conversation as read
   */
  async markMessagesAsRead(userId: string, listingId: string, otherUserId: string) {
    const result = await prisma.message.updateMany({
      where: {
        listingId,
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      markedAsRead: result.count,
    };
  }

  /**
   * Get a specific message by ID
   */
  async getMessageById(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            photos: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Validate that user is part of this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new Error('You do not have permission to view this message');
    }

    return message;
  }

  /**
   * Delete a message (only if sender)
   */
  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('You can only delete your own messages');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return { success: true };
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }
}
