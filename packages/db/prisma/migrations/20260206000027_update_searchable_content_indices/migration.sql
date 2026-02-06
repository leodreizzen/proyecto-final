-- CreateEnum
CREATE TYPE "IndexType" AS ENUM ('DEFINED', 'GENERATED');

-- AlterTable
ALTER TABLE "SearchableContent" ADD COLUMN     "annexIndexType" "IndexType",
ADD COLUMN     "articleIndexType" "IndexType";

-- Update Type Integrity Check
ALTER TABLE "SearchableContent" DROP CONSTRAINT "check_sc_type_integrity";

ALTER TABLE "SearchableContent" ADD CONSTRAINT "check_sc_type_integrity" CHECK (
    CASE
        WHEN "type" = 'RECITAL' THEN
            "recitalNumber" IS NOT NULL AND
            "considerationNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "articleIndexType" IS NULL AND "annexNumber" IS NULL AND "annexIndexType" IS NULL AND "chapterNumber" IS NULL

        WHEN "type" = 'CONSIDERATION' THEN
            "considerationNumber" IS NOT NULL AND
            "recitalNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "articleIndexType" IS NULL AND "annexNumber" IS NULL AND "annexIndexType" IS NULL AND "chapterNumber" IS NULL

        WHEN "type" = 'ARTICLE' THEN
            "articleNumber" IS NOT NULL AND
            "articleIndexType" IS NOT NULL AND
            (
                ("articleIndexType" = 'DEFINED' AND "articleSuffix" IS NOT NULL) OR
                ("articleIndexType" = 'GENERATED' AND "articleSuffix" IS NULL)
            ) AND
            "recitalNumber" IS NULL AND "considerationNumber" IS NULL
        -- Note: Annex/Chapter CAN be present for Articles

        WHEN "type" = 'TEXT_ANNEX' THEN
            "annexNumber" IS NOT NULL AND
            "annexIndexType" IS NOT NULL AND
            "recitalNumber" IS NULL AND "considerationNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "articleIndexType" IS NULL AND "chapterNumber" IS NULL
    END
);
