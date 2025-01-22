/*
  Warnings:

  - You are about to drop the column `birthProvince` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "birthProvince",
ADD COLUMN     "birthComune" TEXT;
