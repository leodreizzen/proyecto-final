-- @param {String} $1:targetResolutionUUUID UUID of the target Resolution

WITH RECURSIVE

-- =============================================================================
-- 1. RESOLVED REFERENCES (The Compass)
-- =============================================================================
-- Normalizes polymorphic references (Resolution, Article, Annex, etc.) into
-- a single coordinate system.
-- PERFORMANCE: Uses only UPPER() to utilize DB indexes (No TRIM).
ResolvedReferences(ref_id, target_type, native_id, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf) AS (
    SELECT rr.id, 'RESOLUTION', rr."resolutionId", UPPER(rr.initial), rr.number, rr.year, NULL::int, NULL::int, NULL::int, NULL::int FROM "ReferenceResolution" rr
    UNION ALL
    SELECT ra.id, 'ANNEX', ra."annexId", UPPER(ra.initial), ra."resNumber", ra.year, ra."annexNumber", NULL::int, NULL::int, NULL::int FROM "ReferenceAnnex" ra
    UNION ALL
    SELECT rc.id, 'CHAPTER', rc."chapterId", UPPER(rc.initial), rc."resNumber", rc.year, rc."annexNumber", rc."chapterNumber", NULL::int, NULL::int FROM "ReferenceChapter" rc
    UNION ALL
    SELECT ra.id, 'ARTICLE', ra."articleId", UPPER(ra.initial), ra."resNumber", ra.year, ra."annexNumber", ra."chapterNumber", ra."articleNumber", ra."articleSuffix" FROM "ReferenceArticle" ra
),

-- =============================================================================
-- 2. HIERARCHY (The Genealogy)
-- =============================================================================
-- Maps Child IDs to Parent IDs. Connects both Physical structures (Article -> Resolution)
-- and Virtual/Author structures (Change -> ArticleModifier).
Hierarchy(child_id, child_type, parent_id, parent_type) AS (
    -- Physical Parents
    SELECT a.id, 'ARTICLE', a."chapterId", 'CHAPTER' FROM "Article" a WHERE a."chapterId" IS NOT NULL
    UNION ALL
    SELECT a.id, 'ARTICLE', a."annexId", 'ANNEX' FROM "Article" a WHERE a."annexId" IS NOT NULL
    UNION ALL
    SELECT a.id, 'ARTICLE', a."resolutionId", 'RESOLUTION' FROM "Article" a WHERE a."resolutionId" IS NOT NULL
    UNION ALL
    SELECT c.id, 'CHAPTER', awa."id", 'ANNEX' FROM "AnnexChapter" c JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
    UNION ALL
    SELECT a.id, 'ANNEX', a."resolutionId", 'RESOLUTION' FROM "Annex" a WHERE a."resolutionId" IS NOT NULL

    -- Origin Traceability (Entity -> Creating Change)
    UNION ALL
    SELECT a.id, 'ARTICLE', a."addedByChangeId", 'CHANGE' FROM "Article" a WHERE a."addedByChangeId" IS NOT NULL
    UNION ALL
    SELECT a.id, 'ARTICLE', a."newContentFromChangeId", 'CHANGE' FROM "Article" a WHERE a."newContentFromChangeId" IS NOT NULL
    UNION ALL
    SELECT a.id, 'ANNEX', a."changeReplaceAnnexId", 'CHANGE' FROM "Annex" a WHERE a."changeReplaceAnnexId" IS NOT NULL

    -- Author Traceability (Change -> Author Entity)
    UNION ALL
    SELECT c.id, 'CHANGE', a.id, 'ARTICLE' FROM "Change" c JOIN "ArticleModifier" am ON c."articleModifierId" = am.id JOIN "Article" a ON am.id = a.id
),

-- =============================================================================
-- 3. IMPACT MAP (The Attack Vectors)
-- =============================================================================
-- Maps Change IDs to the Coordinates they affect.
-- Used by the recursive engine to find "Who is modifying the current node?".
ImpactMap(change_id, impact_type, target_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf) AS (
    -- Structural Changes (Repeals, Additions, Replacements)
    SELECT c.id, 'STRUCTURAL', ref.target_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
    FROM "Change" c
             JOIN (
        SELECT id, "targetReferenceId" as ref_id FROM "ChangeRepeal"
        UNION ALL SELECT id, "targetArticleReferenceId" FROM "ChangeReplaceArticle"
        UNION ALL SELECT id, "targetAnnexReferenceId" FROM "ChangeReplaceAnnex"
        UNION ALL SELECT id, "annexToApplyId" FROM "ChangeApplyModificationsAnnex"
        UNION ALL SELECT id, COALESCE("targetResolutionReferenceId", "targetAnnexReferenceId", "targetChapterReferenceId") FROM "ChangeAddArticle"
        UNION ALL SELECT id, COALESCE("targetResolutionReferenceId", "targetAnnexReferenceId") FROM "ChangeAddAnnex"
    ) maps ON c.id = maps.id
             JOIN ResolvedReferences ref ON maps.ref_id = ref.ref_id

    UNION ALL

    -- Content Changes (Modifications)
    SELECT c.id, 'CONTENT', ref.target_type, ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
    FROM "Change" c
             JOIN (
        SELECT id, "targetArticleReferenceId" as ref_id FROM "ChangeModifyArticle"
        UNION ALL SELECT id, "targetAnnexReferenceId" FROM "ChangeModifyTextAnnex"
        UNION ALL SELECT id, "targetResolutionReferenceId" FROM "ChangeRatifyAdReferendum"
        UNION ALL SELECT id, "targetReferenceId" FROM "ChangeAdvanced"
    ) maps ON c.id = maps.id
             JOIN ResolvedReferences ref ON maps.ref_id = ref.ref_id
),

-- =============================================================================
-- 4. CREATION MAP (The Factory)
-- =============================================================================
-- Defines the properties of new entities created by changes.
-- Calculates target coordinates for the new entity based on the Change definition.
CreationMap(change_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, new_art_num, new_art_suf, physical_origin_id, src_res_init, src_res_num, src_res_year) AS (
    -- Add Article: Constructs coordinates from Target Reference + New Number columns
    SELECT caa.id, 'ARTICLE', ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, caa."newArticleNumber", caa."newArticleSuffix", NULL::uuid, NULL::text, NULL::int, NULL::int
    FROM "ChangeAddArticle" caa JOIN ResolvedReferences ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId", caa."targetChapterReferenceId") = ref.ref_id
    UNION ALL
    -- Add Annex: Creates a new Virtual Annex node. Also maps source for import logic.
    SELECT caa.id, 'ANNEX', target_ref.res_init, target_ref.res_num, target_ref.res_year, target_ref.annex_num, NULL::int, caa."newAnnexNumber", NULL::int, source_ref.native_id, source_ref.res_init, source_ref.res_num, source_ref.res_year
    FROM "ChangeAddAnnex" caa JOIN ResolvedReferences target_ref ON COALESCE(caa."targetResolutionReferenceId", caa."targetAnnexReferenceId") = target_ref.ref_id JOIN ResolvedReferences source_ref ON caa."annexToAddReferenceId" = source_ref.ref_id
),

-- =============================================================================
-- 5. TARGET RESOLUTION SCOPE (The Anchor)
-- =============================================================================
-- Selects the initial set of entities to monitor (The "Victim" Resolution and its children).
TargetResolutionScope(entity_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, is_main_tree, causing_change_id) AS (
    SELECT r.id, 'RESOLUTION', UPPER(r.initial), r.number, r.year, NULL::int, NULL::int, NULL::int, NULL::int, TRUE, NULL::uuid FROM "Resolution" r WHERE r.id = $1::uuid
UNION ALL
SELECT a.id, 'ANNEX', UPPER(r.initial), r.number, r.year, a.number, NULL::int, NULL::int, NULL::int, TRUE, NULL::uuid FROM "Annex" a JOIN "Resolution" r ON a."resolutionId" = r.id WHERE r.id = $1::uuid
UNION ALL
SELECT c.id, 'CHAPTER', UPPER(r.initial), r.number, r.year, a.number, c.number, NULL::int, NULL::int, TRUE, NULL::uuid FROM "AnnexChapter" c JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id JOIN "Annex" a ON awa.id = a.id JOIN "Resolution" r ON a."resolutionId" = r.id WHERE r.id = $1::uuid
UNION ALL
SELECT a.id, 'ARTICLE', UPPER(r.initial), r.number, r.year, NULL::int, NULL::int, a.number, a.suffix, TRUE, NULL::uuid FROM "Article" a JOIN "Resolution" r ON a."resolutionId" = r.id WHERE r.id = $1::uuid
),

-- =============================================================================
-- 6. CHANGE DISCOVERY (The Recursive Engine)
-- =============================================================================
-- The core loop. It navigates:
-- A. Laterally (Impacts by Coordinates)
-- B. Forward (Constructing Virtual Children)
-- C. Upwards (Ancestors/Authors)
-- D. Downwards (Expanding Physical Content)
ChangeDiscovery(entity_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, is_main_tree, causing_change_id) AS (
-- ANCHOR
SELECT entity_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, is_main_tree, causing_change_id FROM TargetResolutionScope

UNION ALL

-- RECURSIVE STEPS
SELECT next_step.entity_id, next_step.entity_type, next_step.res_init, next_step.res_num, next_step.res_year, next_step.annex_num, next_step.chap_num, next_step.art_num, next_step.art_suf, next_step.is_main_tree, next_step.causing_change_id
FROM ChangeDiscovery scope
    CROSS JOIN LATERAL (
    -- Step A: SEEK IMPACTS
    -- Matches Scope Coordinates against ImpactMap.
    -- Uses IS NOT DISTINCT FROM to handle NULLs safely.
    SELECT im.change_id, NULL::text AS step_kind, NULL::uuid AS phys_id_lookup
    FROM ImpactMap im
    WHERE scope.res_num IS NOT NULL -- Guard
    AND im.res_num = scope.res_num AND im.res_year = scope.res_year AND im.res_init IS NOT DISTINCT FROM scope.res_init
    AND im.annex_num IS NOT DISTINCT FROM scope.annex_num AND im.chap_num IS NOT DISTINCT FROM scope.chap_num AND im.art_num IS NOT DISTINCT FROM scope.art_num AND im.art_suf IS NOT DISTINCT FROM scope.art_suf
    AND (im.impact_type = 'STRUCTURAL' OR (im.impact_type = 'CONTENT' AND scope.is_main_tree))

    UNION ALL
    -- Step C: TRACE ANCESTORS
    SELECT NULL::uuid, 'ANCESTOR', scope.entity_id WHERE scope.entity_id IS NOT NULL

    UNION ALL
    -- Step D: EXPAND NATIVE CONTENT
    SELECT NULL::uuid, 'CONTENT_EXPANSION', scope.entity_id WHERE scope.entity_id IS NOT NULL AND scope.is_main_tree AND scope.entity_type IN ('ANNEX', 'CHAPTER')
    ) AS logic_trigger
    CROSS JOIN LATERAL (

    -- EXECUTE A -> B: CREATE CHILD
    -- Virtual entity born from an ADD change.
    SELECT cm.change_id AS entity_id, cm.entity_type, cm.res_init, cm.res_num, cm.res_year, cm.annex_num, cm.chap_num, cm.new_art_num AS art_num, cm.new_art_suf AS art_suf, scope.is_main_tree, logic_trigger.change_id AS causing_change_id FROM CreationMap cm WHERE logic_trigger.change_id IS NOT NULL AND cm.change_id = logic_trigger.change_id

    UNION ALL
    -- EXECUTE A -> B: IMPORT SOURCE (Fork)
    -- Physical source logic for Imports.
    SELECT cm.physical_origin_id AS entity_id, cm.entity_type, cm.src_res_init, cm.src_res_num, cm.src_res_year, NULL::int, NULL::int, NULL::int, NULL::int, FALSE AS is_main_tree, logic_trigger.change_id FROM CreationMap cm WHERE logic_trigger.change_id IS NOT NULL AND cm.change_id = logic_trigger.change_id AND cm.physical_origin_id IS NOT NULL

    UNION ALL
    -- EXECUTE A: PURE IMPACT
    -- Change itself is added to the path. Returning change_id avoids NULL-cycle issues.
    SELECT logic_trigger.change_id AS entity_id, 'CHANGE'::text, NULL::text, NULL::int, NULL::int, NULL::int, NULL::int, NULL::int, NULL::int, scope.is_main_tree, logic_trigger.change_id WHERE logic_trigger.change_id IS NOT NULL

    UNION ALL

    -- EXECUTE C: PARENT (HYBRID STRATEGY)
    -- 1. Jumping Change->Author (Cross-document): HYDRATE from DB (Joins).
    -- 2. Jumping Physical->Parent (Intra-document): INHERIT/DEDUCE (Optimization).
    SELECT
    h.parent_id,
    h.parent_type,
    -- Coords: Hydrate if Author jump, Inherit otherwise
    CASE WHEN h.child_type = 'CHANGE' THEN art_data.initial ELSE scope.res_init END,
    CASE WHEN h.child_type = 'CHANGE' THEN art_data.number  ELSE scope.res_num END,
    CASE WHEN h.child_type = 'CHANGE' THEN art_data.year    ELSE scope.res_year END,

    -- Context Reset Logic (Stripping lower levels as we climb)
    CASE
    WHEN h.child_type = 'CHANGE' THEN art_data.annex_num -- Use Hydrated
    WHEN h.parent_type IN ('RESOLUTION') THEN NULL::int
    ELSE scope.annex_num -- Preserve Annex when climbing Art->Annex or Chap->Annex
    END,

    CASE
    WHEN h.child_type = 'CHANGE' THEN NULL::int
    WHEN h.parent_type IN ('RESOLUTION', 'ANNEX') THEN NULL::int
    ELSE scope.chap_num
    END,

    CASE WHEN h.child_type = 'CHANGE' THEN art_data.art_num ELSE NULL::int END,
    CASE WHEN h.child_type = 'CHANGE' THEN art_data.art_suf ELSE NULL::int END,

    CASE WHEN h.child_type = 'CHANGE' THEN FALSE ELSE scope.is_main_tree END,
    NULL::uuid
    FROM Hierarchy h
    -- Hydration Join: Only active when child is a CHANGE (Jumping to Author)
    LEFT JOIN (
    SELECT
    a.id,
    UPPER(COALESCE(r1.initial, r2.initial, r3.initial)) as initial,
    COALESCE(r1.number, r2.number, r3.number) as number,
    COALESCE(r1.year, r2.year, r3.year) as year,
    a.number as art_num,
    a.suffix as art_suf,
    COALESCE(an.number, an2.number) as annex_num
    FROM "Article" a
    LEFT JOIN "Resolution" r1 ON a."resolutionId" = r1.id
    LEFT JOIN "Annex" an ON a."annexId" = an.id
    LEFT JOIN "Resolution" r2 ON an."resolutionId" = r2.id
    LEFT JOIN "AnnexChapter" ch ON a."chapterId" = ch.id
    LEFT JOIN "AnnexWithArticles" awa ON ch."annexId" = awa.id
    LEFT JOIN "Annex" an2 ON awa.id = an2.id
    LEFT JOIN "Resolution" r3 ON an2."resolutionId" = r3.id
    ) art_data ON h.child_type = 'CHANGE' AND h.parent_type = 'ARTICLE' AND h.parent_id = art_data.id

    WHERE logic_trigger.step_kind = 'ANCESTOR' AND h.child_id = logic_trigger.phys_id_lookup

    UNION ALL
    -- EXECUTE D: CHILDREN (Physical Expansion)
    -- Finds physical children (Articles/Chapters) of the current node.
    SELECT a.id, 'ARTICLE', scope.res_init, scope.res_num, scope.res_year, scope.annex_num, scope.chap_num, a.number, a.suffix, TRUE, NULL::uuid FROM "Article" a WHERE logic_trigger.step_kind = 'CONTENT_EXPANSION' AND (a."annexId" = logic_trigger.phys_id_lookup OR a."chapterId" = logic_trigger.phys_id_lookup)
    UNION ALL
    SELECT c.id, 'CHAPTER', scope.res_init, scope.res_num, scope.res_year, scope.annex_num, NULL::int, c.number, NULL::int, TRUE, NULL::uuid FROM "AnnexChapter" c WHERE logic_trigger.step_kind = 'CONTENT_EXPANSION' AND c."annexId" = logic_trigger.phys_id_lookup

    ) AS next_step
WHERE next_step.entity_id IS NOT NULL OR next_step.causing_change_id IS NOT NULL
    )
    CYCLE entity_id SET is_cycle USING path

-- =============================================================================
-- FINAL SELECTION
-- =============================================================================
-- Filters duplicates and cycles. Returns unique Change IDs.
SELECT DISTINCT cd.causing_change_id AS id
FROM ChangeDiscovery cd
WHERE cd.causing_change_id IS NOT NULL AND NOT cd.is_cycle;