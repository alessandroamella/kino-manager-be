/*
  Warnings:

  - You are about to drop the column `membershipNumber` on the `Member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[membershipCardNumber]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "membershipNumber",
ADD COLUMN     "membershipCardNumber" INTEGER;

-- CreateTable
CREATE TABLE "MembershipCard" (
    "number" INTEGER NOT NULL,

    CONSTRAINT "MembershipCard_pkey" PRIMARY KEY ("number")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_membershipCardNumber_key" ON "Member"("membershipCardNumber");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_membershipCardNumber_fkey" FOREIGN KEY ("membershipCardNumber") REFERENCES "MembershipCard"("number") ON DELETE SET NULL ON UPDATE CASCADE;
