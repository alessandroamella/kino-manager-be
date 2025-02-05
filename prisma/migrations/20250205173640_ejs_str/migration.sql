/*
  Warnings:

  - You are about to drop the column `ejsFile` on the `Newsletter` table. All the data in the column will be lost.
  - Added the required column `ejsString` to the `Newsletter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Newsletter" DROP COLUMN "ejsFile",
ADD COLUMN     "ejsString" TEXT NOT NULL;
