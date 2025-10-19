/*
  Warnings:

  - You are about to drop the column `bio` on the `hosts` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `tutors` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "hosts" DROP COLUMN "bio",
ADD COLUMN     "acceptedPetSizes" TEXT[],
ADD COLUMN     "acceptedPetTypes" TEXT[],
ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "hasYard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertySize" INTEGER,
ADD COLUMN     "propertyType" TEXT;

-- AlterTable
ALTER TABLE "tutors" DROP COLUMN "bio",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar",
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT;
