/*
  Warnings:

  - You are about to drop the column `accesses` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `siteUrl` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "accesses",
DROP COLUMN "siteUrl",
ADD COLUMN     "access" TEXT,
ADD COLUMN     "website" TEXT;
