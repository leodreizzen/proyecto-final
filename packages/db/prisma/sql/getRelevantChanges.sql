-- @param {String} $1:targetResolutionUUUID UUID of the target Resolution
WITH RECURSIVE

-- =============================================================================
-- 1. STRUCTURAL CHANGE MAP
-- =============================================================================
-- Purpose: Maps "Hard" changes that alter structure (Repeal, Replace).
-- These are critical because they can invalidate the existence of the target.
-- Note: 'Add' operations are excluded here; they are handled in the CreationCatalog.
StructuralChangeMap(change_id, target_ref_id, modifier_author_id) AS (
    SELECT c.id, rep."targetReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeRepeal" rep ON c.id = rep.id
    UNION ALL
    SELECT c.id, rep."targetArticleReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeReplaceArticle" rep ON c.id = rep.id
    UNION ALL
    SELECT c.id, rep."targetAnnexReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeReplaceAnnex" rep ON c.id = rep.id
    UNION ALL
    SELECT c.id, app."annexToApplyId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeApplyModificationsAnnex" app ON c.id = app.id
),

-- =============================================================================
-- 2. CONTENT CHANGE MAP
-- =============================================================================
-- Purpose: Maps "Soft" changes (Modify, Ratify) that alter content but not structure.
-- Logic: These are only relevant when traversing the 'Main Tree' (the target resolution).
-- Changes to the content of an external parent resolution are ignored.
ContentChangeMap(change_id, target_ref_id, modifier_author_id) AS (
    SELECT c.id, mod."targetArticleReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeModifyArticle" mod ON c.id = mod.id
    UNION ALL
    SELECT c.id, mod."targetAnnexReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeModifyTextAnnex" mod ON c.id = mod.id
    UNION ALL
    SELECT c.id, rat."targetResolutionReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeRatifyAdReferendum" rat ON c.id = rat.id
    UNION ALL
    SELECT c.id, adv."targetReferenceId", c."articleModifierId"
    FROM "Change" c JOIN "ChangeAdvanced" adv ON c.id = adv.id
),

-- =============================================================================
-- 3. STRUCTURAL CREATION CATALOG (Virtual Targets)
-- =============================================================================
-- Purpose: Defines entities created by 'Add' operations (Virtual Entities).
-- These entities act as valid targets for subsequent changes in the recursion.
-- We normalize coordinates (Annex/Chapter/Number) to allow strict matching.
StructuralCreationCatalog AS (
    -- ADD ARTICLE
    SELECT
        add_art.id AS change_id,
        c."articleModifierId" AS modifier_author_id,
        'ARTICLE'::text AS created_entity_type,
        -- Anchor Coordinates (Resolution Root)
        COALESCE(r_direct.initial, r_annex.initial, r_chap.initial) AS root_res_initial,
        COALESCE(r_direct.number, r_annex.number, r_chap.number)    AS root_res_number,
        COALESCE(r_direct.year, r_annex.year, r_chap.year)          AS root_res_year,
        -- New Entity Specifications (Number/Suffix)
        -- If newArticleNumber is NULL, it creates an unnumbered entity.
        add_art."newArticleNumber" AS new_number,
        add_art."newArticleSuffix" AS new_suffix,
        NULL::int AS new_annex_number,
        -- Context Coordinates (Where is it inserted?)
        COALESCE(ra."annexNumber", rc."annexNumber") AS created_in_annex_number,
        rc."chapterNumber" AS created_in_chapter_number,
        NULL::uuid AS physical_annex_source_id,
        -- Exact Reference ID for linking
        COALESCE(add_art."targetResolutionReferenceId", add_art."targetAnnexReferenceId", add_art."targetChapterReferenceId") AS target_ref_id,
        -- Target Scope Type (To ensure we insert into the correct container)
        CASE
            WHEN add_art."targetResolutionReferenceId" IS NOT NULL THEN 'RESOLUTION'
            WHEN add_art."targetAnnexReferenceId" IS NOT NULL THEN 'ANNEX'
            WHEN add_art."targetChapterReferenceId" IS NOT NULL THEN 'CHAPTER'
            END::text AS target_scope_type
    FROM "Change" c
             JOIN "ChangeAddArticle" add_art ON c.id = add_art.id
             LEFT JOIN "ReferenceAnnex" ra ON add_art."targetAnnexReferenceId" = ra.id
             LEFT JOIN "ReferenceChapter" rc ON add_art."targetChapterReferenceId" = rc.id
             LEFT JOIN "ReferenceResolution" rr ON add_art."targetResolutionReferenceId" = rr.id
             LEFT JOIN "Resolution" r_direct ON rr."resolutionId" = r_direct.id
             LEFT JOIN "Resolution" r_annex ON ra.initial = r_annex.initial AND ra."resNumber" = r_annex.number AND ra.year = r_annex.year
             LEFT JOIN "Resolution" r_chap ON rc.initial = r_chap.initial AND rc."resNumber" = r_chap.number AND rc.year = r_chap.year
    WHERE (add_art."targetResolutionReferenceId" IS NOT NULL OR add_art."targetAnnexReferenceId" IS NOT NULL OR add_art."targetChapterReferenceId" IS NOT NULL)

    UNION ALL

    -- ADD ANNEX
    SELECT
        add_annex.id, c."articleModifierId", 'ANNEX',
        COALESCE(r_direct.initial, r_parent_annex.initial),
        COALESCE(r_direct.number, r_parent_annex."resNumber"),
        COALESCE(r_direct.year, r_parent_annex.year),
        NULL, NULL,
        add_annex."newAnnexNumber",
        NULL, NULL,
        source_annex."annexId",
        COALESCE(add_annex."targetResolutionReferenceId", add_annex."targetAnnexReferenceId"),
        CASE
            WHEN add_annex."targetResolutionReferenceId" IS NOT NULL THEN 'RESOLUTION'
            WHEN add_annex."targetAnnexReferenceId" IS NOT NULL THEN 'ANNEX'
            END
    FROM "Change" c
             JOIN "ChangeAddAnnex" add_annex ON c.id = add_annex.id
             LEFT JOIN "ReferenceResolution" rr ON add_annex."targetResolutionReferenceId" = rr.id
             LEFT JOIN "Resolution" r_direct ON rr."resolutionId" = r_direct.id
             LEFT JOIN "ReferenceAnnex" r_parent_annex ON add_annex."targetAnnexReferenceId" = r_parent_annex.id
             LEFT JOIN "ReferenceAnnex" source_annex ON add_annex."annexToAddReferenceId" = source_annex.id
    WHERE (add_annex."targetResolutionReferenceId" IS NOT NULL OR add_annex."targetAnnexReferenceId" IS NOT NULL)
),

-- =============================================================================
-- 4. TARGET RESOLUTION SCOPE (Anchor)
-- =============================================================================
-- Initializes the recursion with the physical components of the target Resolution.
TargetResolutionScope AS (
    -- Resolution Root
    SELECT target_res.id AS entity_id, 'RESOLUTION'::text AS entity_type, target_res.id AS root_id,
           target_res.initial AS root_res_initial, target_res.number AS root_res_number, target_res.year AS root_res_year,
           NULL::uuid AS causing_change_id, TRUE AS is_main_tree,
           NULL::int as scope_number, NULL::int as scope_suffix, NULL::int as scope_annex_number, NULL::int as scope_chapter_number,
           NULL::text as scope_container_type
    FROM "Resolution" target_res WHERE target_res.id = $1::uuid

    UNION ALL
    -- Physical Annexes
    SELECT target_annex.id, 'ANNEX', target_res.id, target_res.initial, target_res.number, target_res.year, NULL::uuid, TRUE,
           NULL, NULL, target_annex.number, NULL, 'RESOLUTION'
    FROM "Annex" target_annex JOIN "Resolution" target_res ON target_annex."resolutionId" = target_res.id WHERE target_res.id = $1::uuid

    UNION ALL
    -- Physical Chapters
    SELECT target_chap.id, 'CHAPTER', target_res.id, target_res.initial, target_res.number, target_res.year, NULL::uuid, TRUE,
           NULL, NULL, target_annex.number, target_chap.number, 'ANNEX'
    FROM "AnnexChapter" target_chap JOIN "AnnexWithArticles" awa ON target_chap."annexId" = awa.id JOIN "Annex" target_annex ON awa.id = target_annex.id JOIN "Resolution" target_res ON target_annex."resolutionId" = target_res.id WHERE target_res.id = $1::uuid

    UNION ALL
    -- Physical Articles
    SELECT id, 'ARTICLE', "rootResolutionId", "resInitial", "resNumber", "resYear", NULL::uuid, TRUE,
           number, suffix, "annexNumber", "chapterNumber",
           CASE
               WHEN "chapterNumber" IS NOT NULL THEN 'CHAPTER'
               WHEN "annexNumber" IS NOT NULL THEN 'ANNEX'
               ELSE 'RESOLUTION'
               END
    FROM "v_ArticleContext" WHERE "rootResolutionId" = $1::uuid
),

-- =============================================================================
-- 5. CHANGE DISCOVERY (Recursive Traversal)
-- =============================================================================
-- Core engine: Matches references to the current scope and expands to authors or children.
-- STRICT MATCHING: Entities with NULL numbers only match references with NULL numbers.
ChangeDiscovery(
                entity_id, entity_type, root_id, root_res_initial, root_res_number, root_res_year,
                causing_change_id, is_main_tree,
                scope_number, scope_suffix, scope_annex_number, scope_chapter_number, scope_container_type
    ) AS (
    -- ANCHOR
    SELECT * FROM TargetResolutionScope

    UNION ALL

    -- RECURSIVE STEP
    SELECT
        expanded_hierarchy.id,
        expanded_hierarchy.type,
        expanded_hierarchy.root_id,
        expanded_hierarchy.root_res_initial,
        expanded_hierarchy.root_res_number,
        expanded_hierarchy.root_res_year,
        match_result.change_id,
        expanded_hierarchy.is_main_tree,
        expanded_hierarchy.scope_number,
        expanded_hierarchy.scope_suffix,
        expanded_hierarchy.scope_annex_number,
        expanded_hierarchy.scope_chapter_number,
        expanded_hierarchy.scope_container_type
    FROM ChangeDiscovery scope

             -- 1. FIND REFERENCES
             -- We look for any Reference in the DB that points to the current Scope entity.
             CROSS JOIN LATERAL (
        -- A. Match by Physical ID
        -- For entities that actually exist in the DB (original or exploded).
        SELECT rr.id FROM "ReferenceResolution" rr WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'RESOLUTION' AND rr."resolutionId" = scope.entity_id
        UNION ALL
        SELECT ra.id FROM "ReferenceArticle" ra WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'ARTICLE' AND ra."articleId" = scope.entity_id
        UNION ALL
        SELECT rann.id FROM "ReferenceAnnex" rann WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'ANNEX' AND rann."annexId" = scope.entity_id
        UNION ALL
        SELECT rc.id FROM "ReferenceChapter" rc WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'CHAPTER' AND rc."chapterId" = scope.entity_id

        UNION ALL

        -- B. Match by Exact Coordinates (Strict Matching)
        -- For Virtual entities (Added by changes).
        -- Uses 'IS NOT DISTINCT FROM' to handle NULLs strictly.
        -- If scope.scope_number is NULL, it will ONLY match references where articleNumber is also NULL.
        SELECT ref_coord.id FROM (
                                     SELECT ra.id FROM "ReferenceArticle" ra
                                     WHERE scope.entity_type = 'ARTICLE' AND ra."articleId" IS NULL
                                       AND ra."initial" = scope.root_res_initial AND ra."resNumber" = scope.root_res_number AND ra."year" = scope.root_res_year
                                       AND ra."articleNumber" IS NOT DISTINCT FROM scope.scope_number
                                       AND COALESCE(ra."articleSuffix",0) = COALESCE(scope.scope_suffix,0)
                                       AND (
                                         -- Context Disambiguation (Res vs Annex vs Chapter)
                                         (scope.scope_container_type = 'RESOLUTION' AND ra."annexNumber" IS NULL)
                                             OR
                                         (scope.scope_container_type = 'ANNEX' AND ra."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number)
                                             OR
                                         (scope.scope_container_type = 'CHAPTER' AND ra."chapterNumber" IS NOT DISTINCT FROM scope.scope_chapter_number)
                                         )
                                     UNION ALL
                                     SELECT rann.id FROM "ReferenceAnnex" rann
                                     WHERE scope.entity_type = 'ANNEX' AND rann."annexId" IS NULL
                                       AND rann."initial" = scope.root_res_initial AND rann."resNumber" = scope.root_res_number AND rann."year" = scope.root_res_year
                                       AND rann."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number
                                       -- Ensure we don't match Root resolution refs if we are in a Wildcard Annex
                                       AND (scope.scope_annex_number IS NOT NULL OR scope.scope_container_type = 'RESOLUTION')
                                     UNION ALL
                                     SELECT rc.id FROM "ReferenceChapter" rc
                                     WHERE scope.entity_type = 'CHAPTER' AND rc."chapterId" IS NULL
                                       AND rc."initial" = scope.root_res_initial AND rc."resNumber" = scope.root_res_number AND rc."year" = scope.root_res_year
                                       AND rc."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number
                                       AND rc."chapterNumber" IS NOT DISTINCT FROM scope.scope_chapter_number
                                     UNION ALL
                                     SELECT rr.id FROM "ReferenceResolution" rr
                                     WHERE scope.entity_type = 'RESOLUTION' AND rr."resolutionId" IS NULL
                                       AND rr."initial" = scope.root_res_initial AND rr."number" = scope.root_res_number AND rr."year" = scope.root_res_year
                                 ) ref_coord
        ) AS ref

        -- 2. GATHER CANDIDATES (Join with Change Definitions)
             LEFT JOIN StructuralChangeMap structural_map ON ref.id = structural_map.target_ref_id
             LEFT JOIN ContentChangeMap content_map ON ref.id = content_map.target_ref_id
             LEFT JOIN StructuralCreationCatalog struct_creator ON struct_creator.target_ref_id = ref.id

             LEFT JOIN "ReferenceArticle" ref_art ON ref.id = ref_art.id
             LEFT JOIN "ReferenceAnnex" ref_annex ON ref.id = ref_annex.id

        -- 3. RESOLVE MATCHES
             CROSS JOIN LATERAL (
        -- P1: Structural Change
        SELECT structural_map.change_id, structural_map.modifier_author_id, NULL::text as virt_type, NULL::int as v_num, NULL::int as v_suf, NULL::int as v_annex_num, NULL::int as v_chap_num, NULL::uuid as v_source_id
        WHERE structural_map.change_id IS NOT NULL

        UNION ALL

        -- P2: Content Change
        -- Only accepted if we are in the Main Tree.
        SELECT content_map.change_id, content_map.modifier_author_id, NULL, NULL, NULL, NULL, NULL, NULL
        WHERE content_map.change_id IS NOT NULL AND scope.is_main_tree = TRUE

        UNION ALL

        -- P3: Creation (Add Operation)
        -- Logic: Checks if the added entity matches the current scope (Parent -> Child).
        SELECT struct_creator.change_id, struct_creator.modifier_author_id,
               struct_creator.created_entity_type,
               struct_creator.new_number,
               struct_creator.new_suffix,
               COALESCE(struct_creator.new_annex_number, struct_creator.created_in_annex_number),
               struct_creator.created_in_chapter_number,
               struct_creator.physical_annex_source_id
        WHERE struct_creator.change_id IS NOT NULL
          AND (
            -- A: Strict Match (Numbers match against a physical reference found in Step 1)
            (struct_creator.new_number IS NOT NULL AND ref_art.id IS NOT NULL AND struct_creator.new_number = ref_art."articleNumber")
                OR
            (struct_creator.new_annex_number IS NOT NULL AND ref_annex.id IS NOT NULL AND struct_creator.new_annex_number = ref_annex."annexNumber")
                OR
                -- B: Creation Context Match
                -- Matches 'Add Article' changes to the container scope (Resolution/Annex).
                -- Allows detecting an added entity even if it has NULL number (so we can find its author).
            (
                struct_creator.target_scope_type = scope.entity_type
                    AND (
                    -- Resolution Scope accepts Add Article (Root) or Add Annex
                    (scope.entity_type = 'RESOLUTION' AND (
                        (struct_creator.created_entity_type = 'ARTICLE' AND struct_creator.created_in_annex_number IS NULL) OR
                        (struct_creator.created_entity_type = 'ANNEX')
                        ))
                        OR
                        -- Annex Scope accepts Add Article (to this Annex)
                    (scope.entity_type = 'ANNEX' AND struct_creator.created_entity_type = 'ARTICLE'
                        AND struct_creator.created_in_annex_number IS NOT DISTINCT FROM scope.scope_annex_number
                        AND struct_creator.created_in_chapter_number IS NULL)
                        OR
                        -- Chapter Scope accepts Add Article (to this Chapter)
                    (scope.entity_type = 'CHAPTER' AND struct_creator.created_entity_type = 'ARTICLE'
                        AND struct_creator.created_in_annex_number IS NOT DISTINCT FROM scope.scope_annex_number
                        AND struct_creator.created_in_chapter_number IS NOT DISTINCT FROM scope.scope_chapter_number)
                    )
                )
            )
        ) AS match_result

        -- 4. EXPAND HIERARCHY
             LEFT JOIN "v_ArticleContext" author ON author.id = match_result.modifier_author_id
             CROSS JOIN LATERAL (
        -- A. AUTHOR (Navigate Up - External)
        SELECT
            author."rootResolutionId" AS id, 'RESOLUTION'::text AS type, author."rootResolutionId" AS root_id, author."resInitial" AS root_res_initial, author."resNumber" AS root_res_number, author."resYear" AS root_res_year, FALSE AS is_main_tree,
            NULL::int AS scope_number, NULL::int AS scope_suffix, NULL::int AS scope_annex_number, NULL::int AS scope_chapter_number,
            NULL::text AS scope_container_type
        UNION ALL
        SELECT author."rootAnnexId", 'ANNEX', author."rootResolutionId", author."resInitial", author."resNumber", author."resYear", FALSE, NULL, NULL, NULL, NULL, 'RESOLUTION' WHERE author."rootAnnexId" IS NOT NULL
        UNION ALL
        SELECT author."rootChapterId", 'CHAPTER', author."rootResolutionId", author."resInitial", author."resNumber", author."resYear", FALSE, NULL, NULL, NULL, NULL, 'ANNEX' WHERE author."rootChapterId" IS NOT NULL
        UNION ALL
        SELECT author.id, 'ARTICLE', author."rootResolutionId", author."resInitial", author."resNumber", author."resYear", FALSE, NULL, NULL, NULL, NULL, 'RESOLUTION'

        UNION ALL

        -- B. CREATED ENTITY (Navigate Down - Internal)
        SELECT
            NULL::uuid,
            match_result.virt_type,
            scope.root_id, scope.root_res_initial, scope.root_res_number, scope.root_res_year,
            TRUE, -- Main Tree
            match_result.v_num, match_result.v_suf, match_result.v_annex_num, match_result.v_chap_num,
            scope.entity_type -- Inherit container type
        WHERE match_result.virt_type IS NOT NULL

        UNION ALL

        -- C. EXPLODED ANNEX CONTENT (Eager Loading)
        SELECT
            e_art.id, 'ARTICLE',
            scope.root_id, scope.root_res_initial, scope.root_res_number, scope.root_res_year,
            TRUE,
            e_art.number, e_art.suffix,
            match_result.v_annex_num,
            e_chap.number,
            CASE WHEN e_chap.id IS NOT NULL THEN 'CHAPTER' ELSE 'ANNEX' END
        FROM "Article" e_art
                 LEFT JOIN "AnnexChapter" e_chap ON e_art."chapterId" = e_chap.id
        WHERE scope.is_main_tree = TRUE
          AND match_result.virt_type = 'ANNEX'
          AND match_result.v_source_id IS NOT NULL
          AND (e_art."annexId" = match_result.v_source_id OR e_chap."annexId" = match_result.v_source_id)

        UNION ALL

        SELECT
            e_chap.id, 'CHAPTER',
            scope.root_id, scope.root_res_initial, scope.root_res_number, scope.root_res_year,
            TRUE,
            NULL, NULL,
            match_result.v_annex_num,
            e_chap.number,
            'ANNEX'
        FROM "AnnexChapter" e_chap
        WHERE scope.is_main_tree = TRUE
          AND match_result.virt_type = 'ANNEX'
          AND match_result.v_source_id IS NOT NULL
          AND e_chap."annexId" = match_result.v_source_id

        ) expanded_hierarchy
)
    CYCLE entity_id SET is_cycle USING path

-- =============================================================================
-- FINAL SELECTION
-- =============================================================================
SELECT DISTINCT
    cd.causing_change_id AS id,
    r_modifier.date AS date
FROM ChangeDiscovery cd
         JOIN "Change" c ON cd.causing_change_id = c.id
         JOIN "v_ArticleContext" author_ctx ON c."articleModifierId" = author_ctx.id
         JOIN "Resolution" r_modifier ON author_ctx."rootResolutionId" = r_modifier.id
WHERE cd.causing_change_id IS NOT NULL
  AND NOT cd.is_cycle;