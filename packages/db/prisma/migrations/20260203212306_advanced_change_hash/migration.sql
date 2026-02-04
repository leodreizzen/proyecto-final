-- AlterTable
ALTER TABLE "ChangeAdvanced" ADD COLUMN     "modelVersion" TEXT,
ADD COLUMN     "resolvedHash" TEXT;

ALTER TABLE "ChangeAdvanced" ADD CONSTRAINT "ChangeAdvanced_resolved_check" CHECK (
    ("resolvedAt" IS NOT NULL AND "resolveResult" IS NOT NULL AND "resolvedHash" IS NOT NULL AND "modelVersion" IS NOT NULL) OR
    ("resolvedAt" IS NULL AND "resolveResult" IS NULL AND "resolvedHash" IS NULL AND "modelVersion" IS NULL)
);
