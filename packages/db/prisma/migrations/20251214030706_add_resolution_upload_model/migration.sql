/*
  Warnings:

  - A unique constraint covering the columns `[resolutionUploadId]` on the table `Resolution` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `resolutionUploadId` to the `Resolution` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Resolution" ADD COLUMN     "resolutionUploadId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "ResolutionUpload" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "uploaderId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "status" "UploadStatus" NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResolutionUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResolutionUpload_fileId_key" ON "ResolutionUpload"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_resolutionUploadId_key" ON "Resolution"("resolutionUploadId");

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_resolutionUploadId_fkey" FOREIGN KEY ("resolutionUploadId") REFERENCES "ResolutionUpload"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionUpload" ADD CONSTRAINT "ResolutionUpload_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResolutionUpload" ADD CONSTRAINT "ResolutionUpload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
