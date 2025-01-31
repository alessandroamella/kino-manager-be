/*
  Warnings:

  - Made the column `discount` on table `Purchase` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Purchase" ALTER COLUMN "discount" SET NOT NULL,
ALTER COLUMN "discount" SET DEFAULT 0;
