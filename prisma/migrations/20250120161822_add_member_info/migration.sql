/*
  Warnings:

  - Added the required column `birthCountry` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fiscalCode` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('CIE', 'MANUAL');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "birthCountry" TEXT NOT NULL,
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "birthProvince" TEXT,
ADD COLUMN     "fiscalCode" TEXT NOT NULL,
ADD COLUMN     "verificationDate" TIMESTAMP(3),
ADD COLUMN     "verificationMethod" "VerificationMethod";
