/*
  Warnings:

  - The values [CREATE_DOCUMENT] on the enum `ArticleType` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPLY_MODIFICATIONS_ANNEX] on the enum `ChangeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ARTICLE_CREATE_DOCUMENT,CHANGE_APPLY_MODIFICATIONS_ANNEX] on the enum `ReferenceSourceType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ArticleCreateDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChangeApplyModificationsAnnex` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum

DROP VIEW IF EXISTS "v_ImpactMap";
DROP VIEW IF EXISTS "v_CreationMap";
DROP VIEW IF EXISTS "v_ResolvedReferences";

BEGIN;
CREATE TYPE "ArticleType_new" AS ENUM ('NORMATIVE', 'MODIFIER', 'FORMALITY');
ALTER TABLE "Article" ALTER COLUMN "type" TYPE "ArticleType_new" USING ("type"::text::"ArticleType_new");
ALTER TYPE "ArticleType" RENAME TO "ArticleType_old";
ALTER TYPE "ArticleType_new" RENAME TO "ArticleType";
DROP TYPE "public"."ArticleType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ChangeType_new" AS ENUM ('MODIFY_ARTICLE', 'REPLACE_ARTICLE', 'ADVANCED', 'REPEAL', 'RATIFY_AD_REFERENDUM', 'REPLACE_ANNEX', 'MODIFY_TEXT_ANNEX', 'ADD_ARTICLE', 'ADD_ANNEX', 'APPROVE_ANNEX');
ALTER TABLE "Change" ALTER COLUMN "type" TYPE "ChangeType_new" USING ("type"::text::"ChangeType_new");
ALTER TYPE "ChangeType" RENAME TO "ChangeType_old";
ALTER TYPE "ChangeType_new" RENAME TO "ChangeType";
DROP TYPE "public"."ChangeType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReferenceSourceType_new" AS ENUM ('TEXT_REFERENCE', 'CHANGE_ADVANCED', 'CHANGE_REPEAL', 'CHANGE_RATIFY', 'CHANGE_ADD_ANNEX', 'CHANGE_REPLACE_ANNEX', 'CHANGE_MODIFY_TEXT_ANNEX', 'CHANGE_APPROVE_ANNEX', 'CHANGE_ADD_ARTICLE', 'CHANGE_MODIFY_ARTICLE', 'CHANGE_REPLACE_ARTICLE', 'CHANGE_RATIFY_AD_REFERENDUM');
ALTER TABLE "Reference" ALTER COLUMN "sourceType" TYPE "ReferenceSourceType_new" USING ("sourceType"::text::"ReferenceSourceType_new");
ALTER TYPE "ReferenceSourceType" RENAME TO "ReferenceSourceType_old";
ALTER TYPE "ReferenceSourceType_new" RENAME TO "ReferenceSourceType";
DROP TYPE "public"."ReferenceSourceType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ArticleCreateDocument" DROP CONSTRAINT "ArticleCreateDocument_annexToApproveReferenceId_fkey";

-- DropForeignKey
ALTER TABLE "ArticleCreateDocument" DROP CONSTRAINT "ArticleCreateDocument_id_fkey";

-- DropForeignKey
ALTER TABLE "ChangeApplyModificationsAnnex" DROP CONSTRAINT "ChangeApplyModificationsAnnex_annexToApplyId_fkey";

-- DropForeignKey
ALTER TABLE "ChangeApplyModificationsAnnex" DROP CONSTRAINT "ChangeApplyModificationsAnnex_id_fkey";

-- DropTable
DROP TABLE "ArticleCreateDocument";

-- DropTable
DROP TABLE "ChangeApplyModificationsAnnex";

-- CreateTable
CREATE TABLE "ChangeApproveAnnex" (
    "id" UUID NOT NULL,
    "annexToApproveId" UUID NOT NULL,
    "annexIsDocument" BOOLEAN NOT NULL,

    CONSTRAINT "ChangeApproveAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChangeApproveAnnex_annexToApproveId_key" ON "ChangeApproveAnnex"("annexToApproveId");

-- AddForeignKey
ALTER TABLE "ChangeApproveAnnex" ADD CONSTRAINT "ChangeApproveAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeApproveAnnex" ADD CONSTRAINT "ChangeApproveAnnex_annexToApproveId_fkey" FOREIGN KEY ("annexToApproveId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE TRIGGER cleanup_chg_approve_ann
    AFTER DELETE
    ON "ChangeApproveAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('annexToApproveId');

CREATE TRIGGER check_type_chg_approve_ann BEFORE INSERT ON "ChangeApproveAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'APPROVE_ANNEX');


CREATE OR REPLACE VIEW "v_ResolvedReferences" AS
SELECT rr.id AS ref_id, 'RESOLUTION'::text AS target_type, rr."resolutionId" AS native_id, UPPER(rr.initial) AS res_init, rr.number AS res_num, rr.year AS res_year, NULL::int AS annex_num, NULL::int AS chap_num, NULL::int AS art_num, NULL::int AS art_suf
FROM "ReferenceResolution" rr
UNION ALL
SELECT ra.id, 'ANNEX', ra."annexId", UPPER(ra.initial), ra."resNumber", ra.year, ra."annexNumber", NULL::int, NULL::int, NULL::int
FROM "ReferenceAnnex" ra
UNION ALL
SELECT rc.id, 'CHAPTER', rc."chapterId", UPPER(rc.initial), rc."resNumber", rc.year, rc."annexNumber", rc."chapterNumber", NULL::int, NULL::int
FROM "ReferenceChapter" rc
UNION ALL
SELECT ra.id, 'ARTICLE', ra."articleId", UPPER(ra.initial), ra."resNumber", ra.year, ra."annexNumber", ra."chapterNumber", ra."articleNumber", ra."articleSuffix"
FROM "ReferenceArticle" ra;


-- Recreate views
CREATE OR REPLACE VIEW "v_CreationMap" AS
    -- Add Article: Constructs coordinates from Target Reference + New Number columns
SELECT caa.id AS change_id, 'ARTICLE'::text AS entity_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, caa."newArticleNumber" AS new_art_num, caa."newArticleSuffix" AS new_art_suf, NULL::uuid AS physical_origin_id, NULL::text AS src_res_init, NULL::int AS src_res_num, NULL::int AS src_res_year
FROM "ChangeAddArticle" caa JOIN "v_ResolvedReferences" ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId", caa."targetChapterReferenceId") = ref.ref_id

UNION ALL

-- Add Annex: Creates a new Virtual Annex node. Also maps source for import logic.
SELECT caa.id, 'ANNEX', target_ref.res_init, target_ref.res_num, target_ref.res_year, target_ref.annex_num, NULL::int, caa."newAnnexNumber", NULL::int, source_ref.native_id, source_ref.res_init, source_ref.res_num, source_ref.res_year
FROM "ChangeAddAnnex" caa JOIN "v_ResolvedReferences" target_ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId") = target_ref.ref_id JOIN "v_ResolvedReferences" source_ref ON caa."annexToAddReferenceId" = source_ref.ref_id;


-- Modify view: Change applyModificationsAnnex to approveAnnex

CREATE OR REPLACE VIEW "v_ImpactMap" AS
    -- Structural Changes (Repeals, Additions, Replacements)
SELECT c.id AS change_id, 'STRUCTURAL'::text AS impact_type, ref.target_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
FROM "Change" c
         JOIN (
    SELECT id, "targetReferenceId" as ref_id FROM "ChangeRepeal"
    UNION ALL SELECT id, "targetArticleReferenceId" FROM "ChangeReplaceArticle"
    UNION ALL SELECT id, "targetAnnexReferenceId" FROM "ChangeReplaceAnnex"
    UNION ALL SELECT id, "annexToApproveId" FROM "ChangeApproveAnnex"
    UNION ALL SELECT id, COALESCE("targetResolutionReferenceId", "targetAnnexReferenceId", "targetChapterReferenceId") FROM "ChangeAddArticle"
    UNION ALL SELECT id, COALESCE("targetResolutionReferenceId", "targetAnnexReferenceId") FROM "ChangeAddAnnex"
) maps ON c.id = maps.id
         JOIN "v_ResolvedReferences" ref ON maps.ref_id = ref.ref_id

UNION ALL

-- Content Changes (Modifications, Ratifications)
SELECT c.id, 'CONTENT', ref.target_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
FROM "Change" c
         JOIN (
    SELECT id, "targetArticleReferenceId" as ref_id FROM "ChangeModifyArticle"
    UNION ALL SELECT id, "targetAnnexReferenceId" FROM "ChangeModifyTextAnnex"
    UNION ALL SELECT id, "targetResolutionReferenceId" FROM "ChangeRatifyAdReferendum"
    UNION ALL SELECT id, "targetReferenceId" FROM "ChangeAdvanced"
) maps ON c.id = maps.id
         JOIN "v_ResolvedReferences" ref ON maps.ref_id = ref.ref_id;
