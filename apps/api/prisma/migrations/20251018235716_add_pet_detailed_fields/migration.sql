/*
  Warnings:

  - You are about to drop the column `ageYears` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `pets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pets" DROP COLUMN "ageYears",
DROP COLUMN "photos",
ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isVaccinated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medicalInfo" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "specialNeeds" TEXT,
ADD COLUMN     "vaccinationDetails" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;
