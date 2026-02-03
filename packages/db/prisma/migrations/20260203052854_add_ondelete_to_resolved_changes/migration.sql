-- DropForeignKey
ALTER TABLE "Change" DROP CONSTRAINT "Change_resolvedForChangeAdvancedId_fkey";

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_resolvedForChangeAdvancedId_fkey" FOREIGN KEY ("resolvedForChangeAdvancedId") REFERENCES "ChangeAdvanced"("id") ON DELETE CASCADE ON UPDATE CASCADE;
