import { prisma } from '../../core/database.js';
import type { SearchListingsInput } from './schemas.js';

export class SearchService {
  /**
   * Calculate distance between two points using Haversine formula
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  async searchListings(query: SearchListingsInput) {
    const {
      page = 1,
      limit = 20,
      city,
      state,
      latitude,
      longitude,
      radius = 50,
      minPrice,
      maxPrice,
      acceptsDogs,
      acceptsCats,
      hasYard,
      allowsWalks,
      providesMedication,
      petSize,
      startDate,
      endDate,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Location filters
    if (city || state) {
      where.host = {};
      if (city) where.host.city = { contains: city, mode: 'insensitive' };
      if (state) where.host.state = { contains: state, mode: 'insensitive' };
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
    if (allowsWalks !== undefined) where.allowsWalks = allowsWalks;
    if (providesMedication !== undefined) where.providesMedication = providesMedication;

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

      // Find listings with blocked dates
      const blockedListingIds = await prisma.hostAvailability
        .findMany({
          where: {
            date: {
              gte: start,
              lte: end,
            },
            isBlocked: true,
          },
          select: {
            hostId: true,
          },
        })
        .then((avails) => avails.map((a) => a.hostId));

      const excludedIds = [...new Set([...conflictingListingIds])];

      if (excludedIds.length > 0) {
        where.id = {
          notIn: excludedIds,
        };
      }

      if (blockedListingIds.length > 0) {
        where.hostId = {
          notIn: blockedListingIds,
        };
      }
    }

    // Execute query
    let listings = await prisma.listing.findMany({
      where,
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
            subscription: {
              select: {
                planName: true,
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
    });

    // Calculate average rating for each listing
    const listingsWithRating = await Promise.all(
      listings.map(async (listing) => {
        const avgRating = await prisma.review.aggregate({
          where: { listingId: listing.id, isVisible: true },
          _avg: { rating: true },
        });

        const rating = avgRating._avg.rating || 0;

        // Calculate distance if coordinates provided
        let distance: number | null = null;
        if (latitude !== undefined && longitude !== undefined) {
          if (listing.host.latitude && listing.host.longitude) {
            distance = this.calculateDistance(
              latitude,
              longitude,
              listing.host.latitude,
              listing.host.longitude
            );
          }
        }

        return {
          ...listing,
          averageRating: rating,
          reviewCount: listing._count.reviews,
          distance,
        };
      })
    );

    // Filter by radius if coordinates provided
    let filteredListings = listingsWithRating;
    if (latitude !== undefined && longitude !== undefined) {
      filteredListings = listingsWithRating.filter((listing) => {
        if (listing.distance === null) return false;
        return listing.distance <= radius;
      });
    }

    // Filter by minimum rating
    if (minRating !== undefined) {
      filteredListings = filteredListings.filter(
        (listing) => listing.averageRating >= minRating
      );
    }

    // Sort listings
    filteredListings.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.pricePerDay - b.pricePerDay;
          break;
        case 'distance':
          if (a.distance !== null && b.distance !== null) {
            comparison = a.distance - b.distance;
          }
          break;
        case 'rating':
          comparison = a.averageRating - b.averageRating;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const total = filteredListings.length;
    const paginatedListings = filteredListings.slice(skip, skip + limit);

    return {
      listings: paginatedListings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPopularListings(limit: number = 10) {
    // Get listings with highest average rating and most reviews
    const listings = await prisma.listing.findMany({
      where: {
        isActive: true,
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
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: 100, // Get top 100 to calculate ratings
    });

    const listingsWithRating = await Promise.all(
      listings.map(async (listing) => {
        const avgRating = await prisma.review.aggregate({
          where: { listingId: listing.id, isVisible: true },
          _avg: { rating: true },
        });

        return {
          ...listing,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: listing._count.reviews,
        };
      })
    );

    // Sort by rating and review count
    listingsWithRating.sort((a, b) => {
      // Weighted score: average rating * log(review count + 1)
      const scoreA = a.averageRating * Math.log(a.reviewCount + 1);
      const scoreB = b.averageRating * Math.log(b.reviewCount + 1);
      return scoreB - scoreA;
    });

    return listingsWithRating.slice(0, limit);
  }

  async getSuggestedListings(userId: string, limit: number = 10) {
    // Get user's favorite listings to understand preferences
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            host: true,
          },
        },
      },
      take: 10,
    });

    if (favorites.length === 0) {
      // If no favorites, return popular listings
      return this.getPopularListings(limit);
    }

    // Extract preferences from favorites
    const hasYardPreference = favorites.filter((f) => f.listing.hasYard).length > favorites.length / 2;
    const dogPreference = favorites.filter((f) => f.listing.acceptsDogs).length > 0;
    const catPreference = favorites.filter((f) => f.listing.acceptsCats).length > 0;

    // Get average price range
    const prices = favorites.map((f) => f.listing.pricePerDay);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.floor(avgPrice * 0.7);
    const maxPrice = Math.ceil(avgPrice * 1.3);

    // Get listing IDs to exclude (already favorited)
    const excludeIds = favorites.map((f) => f.listing.id);

    // Find similar listings
    const where: any = {
      isActive: true,
      id: {
        notIn: excludeIds,
      },
      pricePerDay: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    if (hasYardPreference) where.hasYard = true;
    if (dogPreference) where.acceptsDogs = true;
    if (catPreference) where.acceptsCats = true;

    const listings = await prisma.listing.findMany({
      where,
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
      take: limit,
    });

    const listingsWithRating = await Promise.all(
      listings.map(async (listing) => {
        const avgRating = await prisma.review.aggregate({
          where: { listingId: listing.id, isVisible: true },
          _avg: { rating: true },
        });

        return {
          ...listing,
          averageRating: avgRating._avg.rating || 0,
          reviewCount: listing._count.reviews,
        };
      })
    );

    return listingsWithRating;
  }
}
