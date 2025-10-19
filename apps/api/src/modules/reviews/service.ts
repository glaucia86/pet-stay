import { prisma } from '../../core/database.js';
import type { CreateReviewInput, UpdateReviewInput, ListReviewsQuery } from './schemas.js';

export class ReviewService {
  // Create a review for a completed booking
  async createReview(authorId: string, data: CreateReviewInput) {
    const { bookingId, rating, comment } = data;

    // Get booking with related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tutor: {
          include: {
            user: true,
          },
        },
        listing: {
          include: {
            host: {
              include: {
                user: true,
              },
            },
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      throw new Error('You can only review completed bookings');
    }

    // Check if review already exists
    if (booking.review) {
      throw new Error('This booking has already been reviewed');
    }

    // Determine if author is tutor or host
    const isTutor = booking.tutor.userId === authorId;
    const isHost = booking.listing.host.userId === authorId;

    if (!isTutor && !isHost) {
      throw new Error('You are not part of this booking');
    }

    // Determine receiver (the other party)
    const receiverId = isTutor ? booking.listing.host.userId : booking.tutor.userId;

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        authorId,
        receiverId,
        listingId: booking.listingId,
        rating,
        comment,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
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

    // Update average rating for the receiver
    await this.updateUserAverageRating(receiverId);

    // Update listing average rating if host is being reviewed
    if (isHost) {
      await this.updateListingAverageRating(booking.listingId);
    }

    return review;
  }

  // Get review by ID
  async getReviewById(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  // List reviews with filters
  async listReviews(query: ListReviewsQuery) {
    const { userId, listingId, minRating, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      isVisible: true,
    };

    if (userId) {
      where.receiverId = userId;
    }

    if (listingId) {
      where.listingId = listingId;
    }

    if (minRating) {
      where.rating = {
        gte: minRating,
      };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get reviews received by a user (as tutor or host)
  async getReceivedReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        receiverId: userId,
        isVisible: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      averageRating: Number(averageRating.toFixed(2)),
      totalReviews: reviews.length,
    };
  }

  // Get reviews given by a user
  async getGivenReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        authorId: userId,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  }

  // Update a review (only author can update)
  async updateReview(reviewId: string, authorId: string, data: UpdateReviewInput) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.authorId !== authorId) {
      throw new Error('You can only update your own reviews');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
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

    // Update average ratings if rating changed
    if (data.rating !== undefined) {
      await this.updateUserAverageRating(review.receiverId);
      if (review.booking?.listing) {
        await this.updateListingAverageRating(review.booking.listing.id);
      }
    }

    return updatedReview;
  }

  // Delete a review (only author can delete)
  async deleteReview(reviewId: string, authorId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: {
            listing: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.authorId !== authorId) {
      throw new Error('You can only delete your own reviews');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update average ratings
    await this.updateUserAverageRating(review.receiverId);
    if (review.booking?.listing) {
      await this.updateListingAverageRating(review.booking.listing.id);
    }

    return { message: 'Review deleted successfully' };
  }

  // Get bookings that can be reviewed by a user
  async getReviewableBookings(userId: string) {
    // Find all completed bookings where user was tutor or host and no review exists yet
    const userWithProfiles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tutor: true,
        host: true,
      },
    });

    if (!userWithProfiles) {
      throw new Error('User not found');
    }

    const bookings: any[] = [];

    // Get bookings as tutor
    if (userWithProfiles.tutor) {
      const tutorBookings = await prisma.booking.findMany({
        where: {
          tutorId: userWithProfiles.tutor.id,
          status: 'completed',
          review: null,
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
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          endDate: 'desc',
        },
      });
      bookings.push(...tutorBookings);
    }

    // Get bookings as host
    if (userWithProfiles.host) {
      const hostBookings = await prisma.booking.findMany({
        where: {
          listing: {
            hostId: userWithProfiles.host.id,
          },
          status: 'completed',
          review: null,
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
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
          endDate: 'desc',
        },
      });
      bookings.push(...hostBookings);
    }

    return bookings;
  }

  // Helper: Update user average rating
  private async updateUserAverageRating(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        receiverId: userId,
        isVisible: true,
      },
      select: {
        rating: true,
      },
    });

    // Note: In a production app, you might want to store this in the User model
    // For now, it's calculated on-the-fly when needed
    return reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  }

  // Helper: Update listing average rating
  private async updateListingAverageRating(listingId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        listingId,
        isVisible: true,
      },
      select: {
        rating: true,
      },
    });

    // Note: In a production app, you might want to store this in the Listing model
    // For now, it's calculated on-the-fly when needed
    return reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  }
}
