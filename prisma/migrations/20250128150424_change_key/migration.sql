/*
  Warnings:

  - You are about to drop the column `signatureUrl` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "signatureUrl",
ADD COLUMN     "signatureR2Key" TEXT NOT NULL DEFAULT '';
