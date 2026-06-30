-- AlterTable: Add soft delete fields to Store
ALTER TABLE "Store" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN "deletedBy" TEXT;

-- AlterTable: Add soft delete fields to Category
ALTER TABLE "Category" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Category" ADD COLUMN "deletedBy" TEXT;

-- AlterTable: Add soft delete fields to Product
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN "deletedBy" TEXT;

-- AlterTable: Add soft delete fields to Purchase
ALTER TABLE "Purchase" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Purchase" ADD COLUMN "deletedBy" TEXT;

-- CreateIndex: Add index on deletedAt for Store
CREATE INDEX "Store_deletedAt_idx" ON "Store"("deletedAt");

-- CreateIndex: Add index on deletedAt for Category
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex: Add index on deletedAt for Product
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex: Add index on deletedAt for Purchase
CREATE INDEX "Purchase_deletedAt_idx" ON "Purchase"("deletedAt");

-- DropIndex: Drop old unique constraint on Category
DROP INDEX "Category_userId_name_key";

-- CreateIndex: Create new unique constraint on Category including deletedAt
CREATE UNIQUE INDEX "Category_userId_name_deletedAt_key" ON "Category"("userId", "name", "deletedAt");
