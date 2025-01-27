/*
  Warnings:

  - You are about to drop the column `documentExpiry` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `documentNumber` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `verificationDate` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `verificationMethod` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "documentExpiry",
DROP COLUMN "documentNumber",
DROP COLUMN "documentType",
DROP COLUMN "verificationDate",
DROP COLUMN "verificationMethod";

-- DropEnum
DROP TYPE "VerificationMethod";
