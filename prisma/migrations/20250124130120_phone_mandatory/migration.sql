/*
  Warnings:

  - Made the column `phoneNumber` on table `Member` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "phoneNumber" SET NOT NULL,
ALTER COLUMN "phoneNumber" DROP DEFAULT;
