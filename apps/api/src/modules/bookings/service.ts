import { prisma } from '../../core/database.js';
import { BookingStatus } from '@prisma/client';
import type {
  CreateBookingInput,
  ListBookingsQuery,
  UpdateBookingStatusInput,
} from './schemas.js';

export class BookingService {
  async createBooking(tutorId: string, data: CreateBookingInput) {
    const { listingId, startDate, endDate, totalPrice, notes } = data;

    // Get tutor
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: true,
      },
    });

    if (!tutor) {
      throw new Error('Tutor not found');
    }

    // Get listing
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

    if (!listing.isActive) {
      throw new Error('This listing is not available for bookings');
    }

    // Check if listing is available for the requested dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    const conflictingBookings = await prisma.booking.count({
      where: {
        listingId,
        status: {
          in: [BookingStatus.confirmed, BookingStatus.ongoing],
        },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (conflictingBookings > 0) {
      throw new Error('This listing is not available for the selected dates');
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        tutorId,
        listingId,
        startDate: start,
        endDate: end,
        totalPrice,
        notes,
        status: BookingStatus.pending,
      },
      include: {
        listing: {
          include: {
            host: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return booking;
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            host: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
            pets: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user is involved in this booking
    if (booking.tutor.userId !== userId && booking.listing.host.userId !== userId) {
      throw new Error('You do not have permission to view this booking');
    }

    return booking;
  }

  async listBookings(userId: string, query: ListBookingsQuery) {
    const { page = 1, limit = 20, status, role } = query;
    const skip = (page - 1) * limit;

    // Get user's tutor and host profiles
    const [tutor, host] = await Promise.all([
      prisma.tutor.findUnique({ where: { userId } }),
      prisma.host.findUnique({ where: { userId } }),
    ]);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase() as BookingStatus;
    }

    // Filter by role
    if (role === 'tutor' && tutor) {
      where.tutorId = tutor.id;
    } else if (role === 'host' && host) {
      where.listing = {
        hostId: host.id,
      };
    } else if (!role) {
      // Show all bookings where user is involved
      const orConditions = [];
      if (tutor) orConditions.push({ tutorId: tutor.id });
      if (host) {
        orConditions.push({
          listing: {
            hostId: host.id,
          },
        });
      }
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    // Execute query
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        include: {
          listing: {
            include: {
              host: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
          tutor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBookingStatus(
    bookingId: string,
    userId: string,
    data: UpdateBookingStatusInput
  ) {
    const { status, cancellationReason } = data;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            host: {
              include: {
                user: true,
              },
            },
          },
        },
        tutor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check permissions
    const isTutor = booking.tutor.userId === userId;
    const isHost = booking.listing.host.userId === userId;

    if (!isTutor && !isHost) {
      throw new Error('You do not have permission to update this booking');
    }

    // Validate status transitions
    if (status === 'confirmed') {
      // Only host can confirm
      if (!isHost) {
        throw new Error('Only the host can confirm bookings');
      }

      if (booking.status !== BookingStatus.pending) {
        throw new Error('Only pending bookings can be confirmed');
      }
    } else if (status === 'canceled') {
      // Both can cancel, but with restrictions
      if (
        booking.status !== BookingStatus.pending &&
        booking.status !== BookingStatus.confirmed
      ) {
        throw new Error('Only pending or confirmed bookings can be canceled');
      }
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status.toUpperCase() as BookingStatus,
        ...(cancellationReason && { notes: cancellationReason }),
      },
    });

    return updatedBooking;
  }

  async deleteBooking(bookingId: string, userId: string) {
    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Only tutor can delete their own bookings
    if (booking.tutor.userId !== userId) {
      throw new Error('You can only delete your own bookings');
    }

    // Can only delete pending or canceled bookings
    if (
      booking.status !== BookingStatus.pending &&
      booking.status !== BookingStatus.canceled
    ) {
      throw new Error('Only pending or canceled bookings can be deleted');
    }

    // Delete booking
    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return { success: true };
  }
}
