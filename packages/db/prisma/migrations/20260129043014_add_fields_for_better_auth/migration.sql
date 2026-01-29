-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_impersonatedBy_fkey" FOREIGN KEY ("impersonatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
