/*
  Warnings:

  - A unique constraint covering the columns `[bucket,path]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Asset_bucket_path_key" ON "Asset"("bucket", "path");
