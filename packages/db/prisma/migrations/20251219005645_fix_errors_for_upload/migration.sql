/*
  Warnings:

  - You are about to drop the column `createdById` on the `Resolution` table. All the data in the column will be lost.
  - Added the required column `text` to the `TextReference` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReferenceSourceType" ADD VALUE 'CHANGE_APPLY_MODIFICATIONS_ANNEX';

-- DropForeignKey
ALTER TABLE "Resolution" DROP CONSTRAINT "Resolution_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ResolutionUpload" DROP CONSTRAINT "ResolutionUpload_fileId_fkey";

-- AlterTable
ALTER TABLE "Annex" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "number" DROP NOT NULL,
ALTER COLUMN "suffix" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Resolution" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "ResolutionUpload" ALTER COLUMN "fileId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TextReference" ADD COLUMN     "text" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ResolutionUpload" ADD CONSTRAINT "ResolutionUpload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
