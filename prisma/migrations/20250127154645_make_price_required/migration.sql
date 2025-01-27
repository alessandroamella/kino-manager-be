-- Set all existing NULL values in the `price` column to 0
UPDATE "Item" SET "price" = 0 WHERE "price" IS NULL;

-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "price" SET NOT NULL;
