-- DropIndex
DROP INDEX "Project_userId_idx";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "accesses" TEXT,
ADD COLUMN     "clientContact" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "price" DECIMAL(12,2),
ADD COLUMN     "siteUrl" TEXT,
ADD COLUMN     "source" TEXT;
