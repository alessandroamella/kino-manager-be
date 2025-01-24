-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "documentExpiry" TIMESTAMP(3),
ADD COLUMN     "documentNumber" TEXT,
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "membershipNumber" TEXT,
ADD COLUMN     "phoneNumber" TEXT DEFAULT '';
