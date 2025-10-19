import { z } from 'zod';

// Schema for adding/removing favorite (listingId from params)
export const addFavoriteParamsSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID format'),
});

export const removeFavoriteParamsSchema = z.object({
  listingId: z.string().uuid('Invalid listing ID format'),
});

// Response schemas
export const favoriteResponseSchema = z.object({
  message: z.string(),
  isFavorite: z.boolean(),
});

export const listFavoritesResponseSchema = z.object({
  favorites: z.array(
    z.object({
      id: z.string(),
      listingId: z.string(),
      createdAt: z.date(),
      listing: z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        pricePerDay: z.number(),
        photos: z.array(z.string()),
        city: z.string().nullable(),
        state: z.string().nullable(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        isActive: z.boolean(),
        acceptedPetSizes: z.array(z.string()),
        maxPets: z.number(),
        host: z.object({
          id: z.string(),
          user: z.object({
            id: z.string(),
            name: z.string(),
            avatarUrl: z.string().nullable(),
          }),
        }),
        _count: z.object({
          reviews: z.number(),
        }),
      }),
    })
  ),
  total: z.number(),
});

export const checkFavoriteResponseSchema = z.object({
  isFavorite: z.boolean(),
});

// TypeScript types
export type AddFavoriteParams = z.infer<typeof addFavoriteParamsSchema>;
export type RemoveFavoriteParams = z.infer<typeof removeFavoriteParamsSchema>;
export type FavoriteResponse = z.infer<typeof favoriteResponseSchema>;
export type ListFavoritesResponse = z.infer<typeof listFavoritesResponseSchema>;
export type CheckFavoriteResponse = z.infer<typeof checkFavoriteResponseSchema>;
