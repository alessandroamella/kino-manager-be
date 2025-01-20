/*
  Warnings:

  - You are about to drop the column `fiscalCode` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "fiscalCode",
ADD COLUMN     "codiceFiscale" TEXT;
