/*
  Warnings:

  - You are about to drop the column `access` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "access",
DROP COLUMN "price",
DROP COLUMN "website",
ADD COLUMN     "accesses" TEXT,
ADD COLUMN     "cost" DECIMAL(12,2),
ADD COLUMN     "site" TEXT;
