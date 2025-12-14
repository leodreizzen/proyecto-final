-- AlterTable
ALTER TABLE "ResolutionUpload"
    ADD COLUMN "errorMsg" TEXT;

ALTER TABLE "ResolutionUpload"
    ADD CONSTRAINT "chk_error_msg_only_when_failed"
        CHECK (("status" = 'FAILED') OR ("errorMsg" IS NULL));