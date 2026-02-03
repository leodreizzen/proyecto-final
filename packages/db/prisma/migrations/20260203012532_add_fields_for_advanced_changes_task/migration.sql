-- CreateEnum
CREATE TYPE "ChangeAdvancedResolveResult" AS ENUM ('CORRECT', 'INAPPLICABLE', 'ALREADY_APPLIED');

-- AlterEnum
ALTER TYPE "MaintenanceTaskStatus" ADD VALUE 'PARTIAL_FAILURE';

-- AlterTable
ALTER TABLE "Change" ADD COLUMN     "resolvedForChangeAdvancedId" UUID;

-- AlterTable
ALTER TABLE "ChangeAdvanced" ADD COLUMN     "resolveResult" "ChangeAdvancedResolveResult",
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_resolvedForChangeAdvancedId_fkey" FOREIGN KEY ("resolvedForChangeAdvancedId") REFERENCES "ChangeAdvanced"("id") ON DELETE SET NULL ON UPDATE CASCADE;
