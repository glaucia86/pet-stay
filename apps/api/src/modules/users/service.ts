import { prisma } from '../../core/database.js';
import type { UpdateUserInput, UpdateTutorInput, UpdateHostInput } from './schemas.js';
import { Role, SubscriptionStatus } from '@prisma/client';

export class UserService {
  // Get user by ID with related data
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutor: true,
        host: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user profile
  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // Update tutor profile
  async updateTutorProfile(userId: string, data: UpdateTutorInput) {
    // Check if user is a tutor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tutor: true },
    });

    if (!user || user.role !== Role.tutor) {
      throw new Error('User is not a tutor');
    }

    // Update or create tutor profile
    const tutor = await prisma.tutor.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return tutor;
  }

  // Update host profile
  async updateHostProfile(userId: string, data: UpdateHostInput) {
    // Check if user is a host
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { host: true },
    });

    if (!user || user.role !== Role.host) {
      throw new Error('User is not a host');
    }

    // Update or create host profile
    const host = await prisma.host.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });

    return host;
  }

  // List users with pagination and filters
  async listUsers(page: number = 1, limit: number = 20, role?: Role, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          bio: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Delete user account
  async deleteUser(userId: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // Get user statistics
  async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutor: true,
        host: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const tutorStats = user.tutor
      ? await Promise.all([
          prisma.pet.count({ where: { tutorId: user.tutor.id } }),
          prisma.booking.count({ where: { tutorId: user.tutor.id } }),
        ])
      : null;

    const hostStats = user.host
      ? await Promise.all([
          prisma.listing.count({ where: { hostId: user.host.id } }),
          prisma.booking.count({ where: { listing: { hostId: user.host.id } } }),
          prisma.review.count({ where: { receiverId: user.id } }),
        ])
      : null;

    return {
      userId: user.id,
      role: user.role,
      tutor: tutorStats
        ? {
            totalPets: tutorStats[0],
            totalBookings: tutorStats[1],
          }
        : null,
      host: hostStats
        ? {
            totalListings: hostStats[0],
            totalBookings: hostStats[1],
            totalReviews: hostStats[2],
            hasActiveSubscription:
              user.host?.subscription?.status === SubscriptionStatus.active,
          }
        : null,
    };
  }
}
