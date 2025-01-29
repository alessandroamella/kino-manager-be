-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';
