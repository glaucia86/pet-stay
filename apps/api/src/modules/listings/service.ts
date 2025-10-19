import { prisma } from '../../core/database.js';
import { SubscriptionStatus } from '@prisma/client';
import type {
  CreateListingInput,
  UpdateListingInput,
  SearchListingsQuery,
} from './schemas.js';

export class ListingService {
  async createListing(hostId: string, data: CreateListingInput) {
    // Get host with user and subscription
    const host = await prisma.host.findUnique({
      where: { id: hostId },
      include: {
        user: true,
        subscription: true,
      },
    });

    if (!host) {
      throw new Error('Host not found');
    }

    // Check if user is a host
    if (host.user.role !== 'host') {
      throw new Error('Only hosts can create listings');
    }

    // Check if host has active subscription
    if (!host.subscription || host.subscription.status !== SubscriptionStatus.active) {
      throw new Error('Active subscription required to create listings');
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        hostId,
        ...data,
        isActive: false, // Listings start inactive and need to be activated
      },
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
    });

    return listing;
  }

  async getListingById(listingId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        host: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        },
        reviews: {
          include: {
            author: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    return listing;
  }

  async listListingsByHost(hostId: string) {
    const listings = await prisma.listing.findMany({
      where: { hostId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return listings;
  }

  async updateListing(listingId: string, userId: string, data: UpdateListingInput) {
    // Find listing with host
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

    // Check ownership
    if (listing.host.userId !== userId) {
      throw new Error('You can only update your own listings');
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data,
    });

    return updatedListing;
  }

  async toggleListingActive(listingId: string, userId: string, isActive: boolean) {
    // Find listing with host and subscription
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        host: {
          include: {
            user: true,
            subscription: true,
          },
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    // Check ownership
    if (listing.host.userId !== userId) {
      throw new Error('You can only modify your own listings');
    }

    // If activating, check subscription
    if (isActive) {
      if (!listing.host.subscription || listing.host.subscription.status !== SubscriptionStatus.active) {
        throw new Error('Active subscription required to activate listings');
      }
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { isActive },
    });

    return updatedListing;
  }

  async deleteListing(listingId: string, userId: string) {
    // Find listing with host
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

    // Check ownership
    if (listing.host.userId !== userId) {
      throw new Error('You can only delete your own listings');
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        listingId,
        status: {
          in: ['pending', 'confirmed', 'ongoing'],
        },
      },
    });

    if (activeBookings > 0) {
      throw new Error('Cannot delete listing with active bookings');
    }

    // Delete listing
    await prisma.listing.delete({
      where: { id: listingId },
    });

    return { success: true };
  }

  async searchListings(query: SearchListingsQuery) {
    const {
      page = 1,
      limit = 20,
      city,
      state,
      minPrice,
      maxPrice,
      acceptsDogs,
      acceptsCats,
      hasYard,
      petSize,
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Location filters
    if (city || state) {
      where.host = {};
      if (city) where.host.city = city;
      if (state) where.host.state = state;
    }

    // Price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerDay = {};
      if (minPrice !== undefined) where.pricePerDay.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerDay.lte = maxPrice;
    }

    // Pet type filters
    if (acceptsDogs !== undefined) where.acceptsDogs = acceptsDogs;
    if (acceptsCats !== undefined) where.acceptsCats = acceptsCats;

    // Amenities filters
    if (hasYard !== undefined) where.hasYard = hasYard;

    // Pet size filters
    if (petSize === 'small') where.acceptsSmallPets = true;
    if (petSize === 'medium') where.acceptsMediumPets = true;
    if (petSize === 'large') where.acceptsLargePets = true;

    // Date availability filter (exclude listings with conflicting bookings)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Find listings with conflicting bookings
      const conflictingListingIds = await prisma.booking
        .findMany({
          where: {
            status: {
              in: ['confirmed', 'ongoing'],
            },
            OR: [
              {
                startDate: { lte: end },
                endDate: { gte: start },
              },
            ],
          },
          select: {
            listingId: true,
          },
        })
        .then((bookings) => bookings.map((b) => b.listingId));

      if (conflictingListingIds.length > 0) {
        where.id = {
          notIn: conflictingListingIds,
        };
      }
    }

    // Execute query
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
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
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Calculate average rating for each listing
    const listingsWithRating = await Promise.all(
      listings.map(async (listing) => {
        const avgRating = await prisma.review.aggregate({
          where: { listingId: listing.id },
          _avg: { rating: true },
        });

        return {
          ...listing,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: listing._count.reviews,
        };
      })
    );

    return {
      listings: listingsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
