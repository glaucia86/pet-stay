import { prisma } from '../../core/database';
import { Favorite, Listing } from '@prisma/client';

export class FavoriteService {
  /**
   * Add a listing to user's favorites
   * Uses unique constraint (userId + listingId) to prevent duplicates
   */
  async addFavorite(userId: string, listingId: string): Promise<Favorite> {
    // Check if listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, isActive: true },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (!listing.isActive) {
      throw new Error('Cannot favorite an inactive listing');
    }

    // Create favorite (will throw if already exists due to unique constraint)
    try {
      const favorite = await prisma.favorite.create({
        data: {
          userId,
          listingId,
        },
      });

      return favorite;
    } catch (error: any) {
      // Check for unique constraint violation
      if (error.code === 'P2002') {
        throw new Error('Listing is already in favorites');
      }
      throw error;
    }
  }

  /**
   * Remove a listing from user's favorites
   */
  async removeFavorite(userId: string, listingId: string): Promise<void> {
    try {
      await prisma.favorite.delete({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });
    } catch (error: any) {
      // If favorite doesn't exist, treat as success (idempotent)
      if (error.code === 'P2025') {
        return;
      }
      throw error;
    }
  }

  /**
   * List all favorites for a user with complete listing data
   */
  async listFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
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
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      favorites,
      total: favorites.length,
    };
  }

  /**
   * Check if a listing is favorited by user
   */
  async checkIsFavorite(userId: string, listingId: string): Promise<boolean> {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    return favorite !== null;
  }

  /**
   * Get favorite count for a listing
   */
  async getFavoriteCount(listingId: string): Promise<number> {
    const count = await prisma.favorite.count({
      where: { listingId },
    });

    return count;
  }

  /**
   * Get favorite counts for multiple listings
   */
  async getFavoriteCounts(listingIds: string[]): Promise<Map<string, number>> {
    const counts = await prisma.favorite.groupBy({
      by: ['listingId'],
      where: {
        listingId: {
          in: listingIds,
        },
      },
      _count: {
        listingId: true,
      },
    });

    const countsMap = new Map<string, number>();
    counts.forEach((item) => {
      countsMap.set(item.listingId, item._count.listingId);
    });

    return countsMap;
  }

  /**
   * Check multiple listings for favorite status (batch operation)
   */
  async checkMultipleFavorites(
    userId: string,
    listingIds: string[]
  ): Promise<Map<string, boolean>> {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        listingId: {
          in: listingIds,
        },
      },
      select: {
        listingId: true,
      },
    });

    const favoritesMap = new Map<string, boolean>();
    listingIds.forEach((id) => {
      favoritesMap.set(id, false);
    });
    favorites.forEach((fav) => {
      favoritesMap.set(fav.listingId, true);
    });

    return favoritesMap;
  }
}
