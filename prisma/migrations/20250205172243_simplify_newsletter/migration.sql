/*
  Warnings:

  - You are about to drop the `NewsletterSubscription` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NewsletterSubscription" DROP CONSTRAINT "NewsletterSubscription_memberId_fkey";

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "newsletterSubscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "newsletterSubscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'SUBSCRIBED',
ADD COLUMN     "newsletterUnsubscribedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "NewsletterSubscription";
