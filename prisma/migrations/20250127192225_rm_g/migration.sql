/*
  Warnings:

  - You are about to drop the column `gender` on the `Member` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'X');

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "gender";
