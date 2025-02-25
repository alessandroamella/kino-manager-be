/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Expense` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,description,amount,expenseDate]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "imageUrl",
ADD COLUMN     "imageR2Key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_userId_description_amount_expenseDate_key" ON "Expense"("userId", "description", "amount", "expenseDate");
