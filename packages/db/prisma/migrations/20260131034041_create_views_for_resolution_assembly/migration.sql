-- =============================================================================
-- 1. VIEW: RESOLVED REFERENCES
-- =============================================================================
-- Purpose: Normalizes all polymorphic references (Resolution, Article, Annex, etc.)
-- into a single, unified coordinate system.
-- PERFORMANCE: Uses only UPPER() to utilize DB indexes (No TRIM).
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

-- =============================================================================
-- 2. VIEW: HIERARCHY
-- =============================================================================
-- Purpose: Maps Child IDs to Parent IDs, establishing the graph edges.
-- It unifies two types of relationships:
-- A. Physical Structure: Standard containment (Article -> Chapter -> Annex -> Resolution).
-- B. Traceability: Links entities to the Changes that created them, and Changes to their Author entities.
CREATE OR REPLACE VIEW "v_Hierarchy" AS
    -- A. PHYSICAL STRUCTURE (Upward Navigation)
SELECT a.id AS child_id, 'ARTICLE'::text AS child_type, a."chapterId" AS parent_id, 'CHAPTER'::text AS parent_type FROM "Article" a WHERE a."chapterId" IS NOT NULL
UNION ALL
SELECT a.id, 'ARTICLE', a."annexId", 'ANNEX' FROM "Article" a WHERE a."annexId" IS NOT NULL
UNION ALL
SELECT a.id, 'ARTICLE', a."resolutionId", 'RESOLUTION' FROM "Article" a WHERE a."resolutionId" IS NOT NULL
UNION ALL
SELECT c.id, 'CHAPTER', awa."id", 'ANNEX' FROM "AnnexChapter" c JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
UNION ALL
SELECT a.id, 'ANNEX', a."resolutionId", 'RESOLUTION' FROM "Annex" a WHERE a."resolutionId" IS NOT NULL

-- B. ORIGIN TRACEABILITY (Entity -> Creating Change)
UNION ALL
SELECT a.id, 'ARTICLE', a."addedByChangeId", 'CHANGE' FROM "Article" a WHERE a."addedByChangeId" IS NOT NULL
UNION ALL
SELECT a.id, 'ARTICLE', a."newContentFromChangeId", 'CHANGE' FROM "Article" a WHERE a."newContentFromChangeId" IS NOT NULL
UNION ALL
SELECT a.id, 'ANNEX', a."changeReplaceAnnexId", 'CHANGE' FROM "Annex" a WHERE a."changeReplaceAnnexId" IS NOT NULL

-- C. AUTHOR TRACEABILITY (Change -> Author Entity)
UNION ALL
SELECT c.id, 'CHANGE', a.id, 'ARTICLE' FROM "Change" c JOIN "ArticleModifier" am ON c."articleModifierId" = am.id JOIN "Article" a ON am.id = a.id;

-- =============================================================================
-- 3. VIEW: IMPACT MAP
-- =============================================================================
-- Purpose: Maps Change IDs to the specific Coordinates they affect.
-- This acts as the lookup table for collision detection.
-- Depends on: v_ResolvedReferences
CREATE OR REPLACE VIEW "v_ImpactMap" AS
    -- Structural Changes (Repeals, Additions, Replacements)
SELECT c.id AS change_id, 'STRUCTURAL'::text AS impact_type, ref.target_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
FROM "Change" c
         JOIN (
    SELECT id, "targetReferenceId" as ref_id FROM "ChangeRepeal"
    UNION ALL SELECT id, "targetArticleReferenceId" FROM "ChangeReplaceArticle"
    UNION ALL SELECT id, "targetAnnexReferenceId" FROM "ChangeReplaceAnnex"
    UNION ALL SELECT id, "annexToApplyId" FROM "ChangeApplyModificationsAnnex"
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

-- =============================================================================
-- 4. VIEW: CREATION MAP
-- =============================================================================
-- Purpose: Defines the properties of new entities created by 'ADD' changes.
-- Calculates target coordinates for the new entity based on the Change definition.
-- Depends on: v_ResolvedReferences
CREATE OR REPLACE VIEW "v_CreationMap" AS
    -- Add Article: Constructs coordinates from Target Reference + New Number columns
SELECT caa.id AS change_id, 'ARTICLE'::text AS entity_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, caa."newArticleNumber" AS new_art_num, caa."newArticleSuffix" AS new_art_suf, NULL::uuid AS physical_origin_id, NULL::text AS src_res_init, NULL::int AS src_res_num, NULL::int AS src_res_year
FROM "ChangeAddArticle" caa JOIN "v_ResolvedReferences" ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId", caa."targetChapterReferenceId") = ref.ref_id

UNION ALL

-- Add Annex: Creates a new Virtual Annex node. Also maps source for import logic.
SELECT caa.id, 'ANNEX', target_ref.res_init, target_ref.res_num, target_ref.res_year, target_ref.annex_num, NULL::int, caa."newAnnexNumber", NULL::int, source_ref.native_id, source_ref.res_init, source_ref.res_num, source_ref.res_year
FROM "ChangeAddAnnex" caa JOIN "v_ResolvedReferences" target_ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId") = target_ref.ref_id JOIN "v_ResolvedReferences" source_ref ON caa."annexToAddReferenceId" = source_ref.ref_id;