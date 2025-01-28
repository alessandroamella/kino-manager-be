/*
  Warnings:

  - You are about to drop the column `number` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `street` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "number",
DROP COLUMN "street",
ADD COLUMN     "streetName" TEXT,
ADD COLUMN     "streetNumber" INTEGER;
