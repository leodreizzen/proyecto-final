-- @param {String} $1:targetResolutionUUUID UUID of the target Resolution
WITH RECURSIVE

-- =============================================================================
-- 1. STRUCTURAL CHANGE MAP
-- =============================================================================
-- Purpose: Maps "Hard" changes that alter structure (Repeal, Replace).
-- These are critical because they can invalidate the existence of the target.
-- Note: 'Add' operations are excluded here; they are handled in the CreationCatalog.
StructuralChangeMap(change_id, target_ref_id, modifier_author_id, physical_origin_id) AS (
    SELECT change.id, repeal."targetReferenceId", change."articleModifierId", NULL::uuid
    FROM "Change" change JOIN "ChangeRepeal" repeal ON change.id = repeal.id
    UNION ALL
    SELECT change.id, replace_art."targetArticleReferenceId", change."articleModifierId", NULL::uuid
    FROM "Change" change JOIN "ChangeReplaceArticle" replace_art ON change.id = replace_art.id
    UNION ALL
    SELECT
        change.id,
        replace_annex."targetAnnexReferenceId",
        change."articleModifierId",
        COALESCE(ref_source."annexId", inline_annex.id)
    FROM "Change" change
    JOIN "ChangeReplaceAnnex" replace_annex ON change.id = replace_annex.id
    LEFT JOIN "ReferenceAnnex" ref_source ON replace_annex."newAnnexReferenceId" = ref_source.id
    LEFT JOIN "Annex" inline_annex ON inline_annex."changeReplaceAnnexId" = change.id
    UNION ALL
    SELECT change.id, apply_mod."annexToApplyId", change."articleModifierId", ref_source."annexId"
    FROM "Change" change
    JOIN "ChangeApplyModificationsAnnex" apply_mod ON change.id = apply_mod.id
    LEFT JOIN "ReferenceAnnex" ref_source ON apply_mod."annexToApplyId" = ref_source.id
),

-- =============================================================================
-- 2. CONTENT CHANGE MAP
-- =============================================================================
-- Purpose: Maps "Soft" changes (Modify, Ratify) that alter content but not structure.
-- Logic: These are only relevant when traversing the 'Main Tree' (the target resolution).
-- Changes to the content of an external parent resolution are ignored.
ContentChangeMap(change_id, target_ref_id, modifier_author_id) AS (
    SELECT change.id, mod_art."targetArticleReferenceId", change."articleModifierId"
    FROM "Change" change JOIN "ChangeModifyArticle" mod_art ON change.id = mod_art.id
    UNION ALL
    SELECT change.id, mod_annex."targetAnnexReferenceId", change."articleModifierId"
    FROM "Change" change JOIN "ChangeModifyTextAnnex" mod_annex ON change.id = mod_annex.id
    UNION ALL
    SELECT change.id, ratify."targetResolutionReferenceId", change."articleModifierId"
    FROM "Change" change JOIN "ChangeRatifyAdReferendum" ratify ON change.id = ratify.id
    UNION ALL
    SELECT change.id, advanced."targetReferenceId", change."articleModifierId"
    FROM "Change" change JOIN "ChangeAdvanced" advanced ON change.id = advanced.id
),

-- =============================================================================
-- 3. STRUCTURAL CREATION CATALOG (Virtual Targets)
-- =============================================================================
-- Purpose: Defines entities created by 'Add' operations (Virtual Entities).
-- These entities act as valid targets for subsequent changes in the recursion.
-- We normalize coordinates (Annex/Chapter/Number) to allow strict matching.
-- Coordinates are derived directly from the Reference tables (Source of Truth for Target),
-- ignoring whether the physical Resolution exists in the DB. This fixes cross-resolution additions.
StructuralCreationCatalog AS (
    -- ADD ARTICLE
    SELECT
        add_article.id AS change_id,
        change."articleModifierId" AS modifier_author_id,
        'ARTICLE'::text AS created_entity_type,
        -- Anchor Coordinates (Resolution Root) derived directly from References
        COALESCE(ref_resolution.initial, ref_annex.initial, ref_chapter.initial) AS root_res_initial,
        COALESCE(ref_resolution.number, ref_annex."resNumber", ref_chapter."resNumber") AS root_res_number,
        COALESCE(ref_resolution.year, ref_annex.year, ref_chapter.year) AS root_res_year,
        -- New Entity Specifications (Number/Suffix)
        add_article."newArticleNumber" AS new_number,
        add_article."newArticleSuffix" AS new_suffix,
        NULL::int AS new_annex_number,
        -- Context Coordinates (Where is it inserted?)
        COALESCE(ref_annex."annexNumber", ref_chapter."annexNumber") AS created_in_annex_number,
        ref_chapter."chapterNumber" AS created_in_chapter_number,
        NULL::uuid AS physical_origin_id,
        COALESCE(add_article."targetResolutionReferenceId", add_article."targetAnnexReferenceId", add_article."targetChapterReferenceId") AS target_ref_id,
        -- Target Scope Type
        CASE
            WHEN add_article."targetResolutionReferenceId" IS NOT NULL THEN 'RESOLUTION'
            WHEN add_article."targetAnnexReferenceId" IS NOT NULL THEN 'ANNEX'
            WHEN add_article."targetChapterReferenceId" IS NOT NULL THEN 'CHAPTER'
            END::text AS target_scope_type
    FROM "Change" change
    JOIN "ChangeAddArticle" add_article ON change.id = add_article.id
    LEFT JOIN "ReferenceAnnex" ref_annex ON add_article."targetAnnexReferenceId" = ref_annex.id
    LEFT JOIN "ReferenceChapter" ref_chapter ON add_article."targetChapterReferenceId" = ref_chapter.id
    LEFT JOIN "ReferenceResolution" ref_resolution ON add_article."targetResolutionReferenceId" = ref_resolution.id
    WHERE (add_article."targetResolutionReferenceId" IS NOT NULL OR add_article."targetAnnexReferenceId" IS NOT NULL OR add_article."targetChapterReferenceId" IS NOT NULL)

    UNION ALL

    -- ADD ANNEX
    SELECT
        add_annex.id, change."articleModifierId", 'ANNEX',
        -- Coordinates derived directly from References
        COALESCE(ref_resolution.initial, ref_parent_annex.initial),
        COALESCE(ref_resolution.number, ref_parent_annex."resNumber"),
        COALESCE(ref_resolution.year, ref_parent_annex.year),
        NULL, NULL,
        add_annex."newAnnexNumber",
        NULL, NULL,
        source_annex."annexId",
        COALESCE(add_annex."targetResolutionReferenceId", add_annex."targetAnnexReferenceId"),
        CASE
            WHEN add_annex."targetResolutionReferenceId" IS NOT NULL THEN 'RESOLUTION'
            WHEN add_annex."targetAnnexReferenceId" IS NOT NULL THEN 'ANNEX'
            END
    FROM "Change" change
    JOIN "ChangeAddAnnex" add_annex ON change.id = add_annex.id
    LEFT JOIN "ReferenceResolution" ref_resolution ON add_annex."targetResolutionReferenceId" = ref_resolution.id
    LEFT JOIN "ReferenceAnnex" ref_parent_annex ON add_annex."targetAnnexReferenceId" = ref_parent_annex.id
             LEFT JOIN "ReferenceAnnex" source_annex ON add_annex."annexToAddReferenceId" = source_annex.id
    WHERE (add_annex."targetResolutionReferenceId" IS NOT NULL OR add_annex."targetAnnexReferenceId" IS NOT NULL)
),

-- =============================================================================
-- 4. ENTITY SOURCE MAP
-- =============================================================================
-- Purpose: Links PHYSICAL entities (Articles/Annexes) to the Change that created or introduced them.
-- Covers two scenarios:
-- 1. Inline Creation: The entity record has a direct FK to the creating change (e.g., addedByChangeId).
-- 2. Reference Import: The entity was introduced by a change that referenced an existing object (e.g., AddAnnex via Reference).

EntitySourceMap(entity_id, entity_type, change_id, modifier_author_id, physical_origin_id) AS (
    -- A. Article: Inline
    SELECT article.id, 'ARTICLE', article."addedByChangeId", change."articleModifierId", NULL::uuid
    FROM "Article" article JOIN "Change" change ON article."addedByChangeId" = change.id
    WHERE article."addedByChangeId" IS NOT NULL
    UNION ALL
    -- B. Article: Inline Replacement
    SELECT article.id, 'ARTICLE', article."newContentFromChangeId", change."articleModifierId", NULL::uuid
    FROM "Article" article JOIN "Change" change ON article."newContentFromChangeId" = change.id
    WHERE article."newContentFromChangeId" IS NOT NULL
    UNION ALL
    -- C. Annex: Inline Replacement
    SELECT annex.id, 'ANNEX', annex."changeReplaceAnnexId", change."articleModifierId", NULL::uuid
    FROM "Annex" annex JOIN "Change" change ON annex."changeReplaceAnnexId" = change.id
    WHERE annex."changeReplaceAnnexId" IS NOT NULL
    UNION ALL
    -- D. Annex: Reference Import (Add)
    SELECT ref_annex."annexId", 'ANNEX', add_annex.id, change."articleModifierId", ref_annex."annexId"
    FROM "ChangeAddAnnex" add_annex JOIN "Change" change ON add_annex.id = change.id JOIN "ReferenceAnnex" ref_annex ON add_annex."annexToAddReferenceId" = ref_annex.id
    WHERE ref_annex."annexId" IS NOT NULL
    UNION ALL
    -- E. Annex: Reference Import (Replace)
    SELECT ref_annex."annexId", 'ANNEX', replace_annex.id, change."articleModifierId", ref_annex."annexId"
    FROM "ChangeReplaceAnnex" replace_annex JOIN "Change" change ON replace_annex.id = change.id JOIN "ReferenceAnnex" ref_annex ON replace_annex."newAnnexReferenceId" = ref_annex.id
    WHERE ref_annex."annexId" IS NOT NULL
    UNION ALL
    -- F. Annex: Reference Usage (Apply Mod)
    SELECT ref_annex."annexId", 'ANNEX', apply_mod.id, change."articleModifierId", ref_annex."annexId"
    FROM "ChangeApplyModificationsAnnex" apply_mod JOIN "Change" change ON apply_mod.id = change.id JOIN "ReferenceAnnex" ref_annex ON apply_mod."annexToApplyId" = ref_annex.id
    WHERE ref_annex."annexId" IS NOT NULL
),

-- =============================================================================
-- 5. TARGET RESOLUTION SCOPE (Anchor)
-- =============================================================================
-- Initializes the recursion with the physical components of the target Resolution.
TargetResolutionScope AS (
    -- Resolution Root
    SELECT target_resolution.id AS entity_id, 'RESOLUTION'::text AS entity_type, target_resolution.id AS root_id,
           target_resolution.initial AS root_res_initial, target_resolution.number AS root_res_number, target_resolution.year AS root_res_year,
           NULL::uuid AS causing_change_id, TRUE AS is_main_tree,
           NULL::int as scope_number, NULL::int as scope_suffix, NULL::int as scope_annex_number, NULL::int as scope_chapter_number,
           NULL::text as scope_container_type
    FROM "Resolution" target_resolution WHERE target_resolution.id = $1::uuid
    UNION ALL
    -- Physical Annexes
    SELECT target_annex.id, 'ANNEX', target_resolution.id, target_resolution.initial, target_resolution.number, target_resolution.year, NULL::uuid, TRUE,
           NULL, NULL, target_annex.number, NULL, 'RESOLUTION'
    FROM "Annex" target_annex JOIN "Resolution" target_resolution ON target_annex."resolutionId" = target_resolution.id WHERE target_resolution.id = $1::uuid
    UNION ALL
    -- Physical Chapters
    SELECT target_chapter.id, 'CHAPTER', target_resolution.id, target_resolution.initial, target_resolution.number, target_resolution.year, NULL::uuid, TRUE,
           NULL, NULL, target_annex.number, target_chapter.number, 'ANNEX'
    FROM "AnnexChapter" target_chapter JOIN "AnnexWithArticles" awa ON target_chapter."annexId" = awa.id JOIN "Annex" target_annex ON awa.id = target_annex.id JOIN "Resolution" target_resolution ON target_annex."resolutionId" = target_resolution.id WHERE target_resolution.id = $1::uuid
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
-- 6. CHANGE DISCOVERY (Recursive Traversal)
-- =============================================================================
-- Core engine: Matches changes to the current scope via:
-- 1. References (Physical IDs or Virtual Coordinates).
-- 2. Originating change (EntitySourceMap).
-- Then expands to the Author (Up) or the Created Entity (Down).

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
        expanded_hierarchy.next_res_initial,
        expanded_hierarchy.next_res_number,
        expanded_hierarchy.next_res_year,
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
            SELECT ref_resolution.id FROM "ReferenceResolution" ref_resolution WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'RESOLUTION' AND ref_resolution."resolutionId" = scope.entity_id
        UNION ALL
            SELECT ref_article.id FROM "ReferenceArticle" ref_article WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'ARTICLE' AND ref_article."articleId" = scope.entity_id
        UNION ALL
            SELECT ref_annex.id FROM "ReferenceAnnex" ref_annex WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'ANNEX' AND ref_annex."annexId" = scope.entity_id
        UNION ALL
            SELECT ref_chapter.id FROM "ReferenceChapter" ref_chapter WHERE scope.entity_id IS NOT NULL AND scope.entity_type = 'CHAPTER' AND ref_chapter."chapterId" = scope.entity_id

        UNION ALL

        -- B. Match by Exact Coordinates (Strict Matching)
        -- For Virtual entities (Added by changes).
        SELECT ref_coord.id FROM (
                SELECT ref_article.id FROM "ReferenceArticle" ref_article
                WHERE scope.entity_type = 'ARTICLE' AND ref_article."articleId" IS NULL
                  AND ref_article."initial" = scope.root_res_initial AND ref_article."resNumber" = scope.root_res_number AND ref_article."year" = scope.root_res_year
                  AND ref_article."articleNumber" IS NOT DISTINCT FROM scope.scope_number
                  AND COALESCE(ref_article."articleSuffix",0) = COALESCE(scope.scope_suffix,0)
                                       AND (
                      (scope.scope_container_type = 'RESOLUTION' AND ref_article."annexNumber" IS NULL) OR
                      (scope.scope_container_type = 'ANNEX' AND ref_article."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number) OR
                      (scope.scope_container_type = 'CHAPTER' AND ref_article."chapterNumber" IS NOT DISTINCT FROM scope.scope_chapter_number)
                                         )
                                     UNION ALL
                SELECT ref_annex.id FROM "ReferenceAnnex" ref_annex
                WHERE scope.entity_type = 'ANNEX' AND ref_annex."annexId" IS NULL
                  AND ref_annex."initial" = scope.root_res_initial AND ref_annex."resNumber" = scope.root_res_number AND ref_annex."year" = scope.root_res_year
                  AND ref_annex."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number
                                       AND (scope.scope_annex_number IS NOT NULL OR scope.scope_container_type = 'RESOLUTION')
                                     UNION ALL
                SELECT ref_chapter.id FROM "ReferenceChapter" ref_chapter
                WHERE scope.entity_type = 'CHAPTER' AND ref_chapter."chapterId" IS NULL
                  AND ref_chapter."initial" = scope.root_res_initial AND ref_chapter."resNumber" = scope.root_res_number AND ref_chapter."year" = scope.root_res_year
                  AND ref_chapter."annexNumber" IS NOT DISTINCT FROM scope.scope_annex_number
                  AND ref_chapter."chapterNumber" IS NOT DISTINCT FROM scope.scope_chapter_number
                                     UNION ALL
                SELECT ref_resolution.id FROM "ReferenceResolution" ref_resolution
                WHERE scope.entity_type = 'RESOLUTION' AND ref_resolution."resolutionId" IS NULL
                  AND ref_resolution."initial" = scope.root_res_initial AND ref_resolution."number" = scope.root_res_number AND ref_resolution."year" = scope.root_res_year
                                 ) ref_coord
        ) AS ref_match

        -- 2. GATHER CANDIDATES
        LEFT JOIN StructuralChangeMap structural_map ON ref_match.id = structural_map.target_ref_id
        LEFT JOIN ContentChangeMap content_map ON ref_match.id = content_map.target_ref_id
        LEFT JOIN StructuralCreationCatalog struct_creator ON struct_creator.target_ref_id = ref_match.id
        LEFT JOIN EntitySourceMap entity_source ON entity_source.entity_id = scope.entity_id AND entity_source.entity_type = scope.entity_type
        -- References required for Step 3 P3.A checks
        LEFT JOIN "ReferenceArticle" ref_article_lookup ON ref_match.id = ref_article_lookup.id
        LEFT JOIN "ReferenceAnnex" ref_annex_lookup ON ref_match.id = ref_annex_lookup.id

        -- 3. RESOLVE MATCHES
             CROSS JOIN LATERAL (
            -- P1: Structural
            SELECT structural_map.change_id, structural_map.modifier_author_id, NULL::text as virt_type,
                   NULL::int as v_num, NULL::int as v_suf, NULL::int as v_annex_num, NULL::int as v_chap_num,
                   structural_map.physical_origin_id as v_origin_id,
                   NULL::text as v_res_init, NULL::int as v_res_num, NULL::int as v_res_year
        WHERE structural_map.change_id IS NOT NULL

        UNION ALL

            -- P2: Content
            SELECT content_map.change_id, content_map.modifier_author_id, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
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
                   struct_creator.physical_origin_id,
                   struct_creator.root_res_initial, struct_creator.root_res_number, struct_creator.root_res_year
        WHERE struct_creator.change_id IS NOT NULL
          AND (
                (struct_creator.new_number IS NOT NULL AND ref_article_lookup.id IS NOT NULL AND struct_creator.new_number = ref_article_lookup."articleNumber")
                OR
                (struct_creator.new_annex_number IS NOT NULL AND ref_annex_lookup.id IS NOT NULL AND struct_creator.new_annex_number = ref_annex_lookup."annexNumber")
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

            UNION ALL

            -- P4: Originating change Source (Direct Link)
            -- Matches physical entities to their creator/importer.
            SELECT entity_source.change_id, entity_source.modifier_author_id, NULL, NULL, NULL, NULL, NULL,
                   entity_source.physical_origin_id,
                   NULL, NULL, NULL
            WHERE entity_source.change_id IS NOT NULL
        ) AS match_result

        -- 4. EXPAND HIERARCHY
             LEFT JOIN "v_ArticleContext" author ON author.id = match_result.modifier_author_id
        LEFT JOIN EntitySourceMap author_originator ON author.id = author_originator.entity_id
        LEFT JOIN StructuralCreationCatalog author_creation ON author_originator.change_id = author_creation.change_id

             CROSS JOIN LATERAL (
            -- A. AUTHOR (Navigate Up)
        SELECT
                author."rootResolutionId" AS id,
                'RESOLUTION'::text AS type,
                author."rootResolutionId" AS root_id,
                COALESCE(author_creation.root_res_initial, author."resInitial") AS next_res_initial,
                COALESCE(author_creation.root_res_number, author."resNumber") AS next_res_number,
                COALESCE(author_creation.root_res_year, author."resYear") AS next_res_year,
                FALSE AS is_main_tree,
                COALESCE(author_creation.new_number, author.number) AS scope_number,
                COALESCE(author_creation.new_suffix, author.suffix) AS scope_suffix,
                COALESCE(author_creation.new_annex_number, author_creation.created_in_annex_number, author."annexNumber") AS scope_annex_number,
                COALESCE(author_creation.created_in_chapter_number, author."chapterNumber") AS scope_chapter_number,

                CASE
                    WHEN COALESCE(author_creation.created_in_chapter_number, author."chapterNumber") IS NOT NULL THEN 'CHAPTER'
                    WHEN COALESCE(author_creation.new_annex_number, author_creation.created_in_annex_number, author."annexNumber") IS NOT NULL THEN 'ANNEX'
                    ELSE 'RESOLUTION'
                END AS scope_container_type

        UNION ALL
        SELECT author."rootAnnexId", 'ANNEX', author."rootResolutionId", author."resInitial", author."resNumber", author."resYear", FALSE, NULL, NULL, NULL, NULL, 'RESOLUTION' WHERE author."rootAnnexId" IS NOT NULL
        UNION ALL
        SELECT author."rootChapterId", 'CHAPTER', author."rootResolutionId", author."resInitial", author."resNumber", author."resYear", FALSE, NULL, NULL, NULL, NULL, 'ANNEX' WHERE author."rootChapterId" IS NOT NULL
        UNION ALL
            SELECT
                author.id,
                'ARTICLE',
                author."rootResolutionId",
                COALESCE(author_creation.root_res_initial, author."resInitial"),
                COALESCE(author_creation.root_res_number, author."resNumber"),
                COALESCE(author_creation.root_res_year, author."resYear"),
                FALSE,
                COALESCE(author_creation.new_number, author.number),
                COALESCE(author_creation.new_suffix, author.suffix),
                COALESCE(author_creation.new_annex_number, author_creation.created_in_annex_number, author."annexNumber"),
                COALESCE(author_creation.created_in_chapter_number, author."chapterNumber"),
                CASE
                    WHEN COALESCE(author_creation.created_in_chapter_number, author."chapterNumber") IS NOT NULL THEN 'CHAPTER'
                    WHEN COALESCE(author_creation.new_annex_number, author_creation.created_in_annex_number, author."annexNumber") IS NOT NULL THEN 'ANNEX'
                    ELSE 'RESOLUTION'
                END

        UNION ALL

            -- B. CREATED ENTITY (Navigate Down - Virtual)
        SELECT
            NULL::uuid,
            match_result.virt_type,
                scope.root_id,
                -- Use match_result coordinates if available (from creation catalog), else inherit from scope
                COALESCE(match_result.v_res_init, scope.root_res_initial),
                COALESCE(match_result.v_res_num, scope.root_res_number),
                COALESCE(match_result.v_res_year, scope.root_res_year),
                TRUE,
            match_result.v_num, match_result.v_suf, match_result.v_annex_num, match_result.v_chap_num,
                scope.entity_type
        WHERE match_result.virt_type IS NOT NULL

        UNION ALL

            -- C. EXPLODED ANNEX CONTENT (Target-Side)
        SELECT
                exploded_article.id, 'ARTICLE',
            scope.root_id, scope.root_res_initial, scope.root_res_number, scope.root_res_year,
            TRUE,
                exploded_article.number, exploded_article.suffix,
            match_result.v_annex_num,
                exploded_chapter.number,
                CASE WHEN exploded_chapter.id IS NOT NULL THEN 'CHAPTER' ELSE 'ANNEX' END
            FROM "Article" exploded_article
            LEFT JOIN "AnnexChapter" exploded_chapter ON exploded_article."chapterId" = exploded_chapter.id
        WHERE scope.is_main_tree = TRUE
          AND match_result.virt_type = 'ANNEX'
              AND match_result.v_origin_id IS NOT NULL
              AND (exploded_article."annexId" = match_result.v_origin_id OR exploded_chapter."annexId" = match_result.v_origin_id)

        UNION ALL

        SELECT
            exploded_chapter.id, 'CHAPTER',
            scope.root_id, scope.root_res_initial, scope.root_res_number, scope.root_res_year,
            TRUE,
            NULL, NULL,
            match_result.v_annex_num,
                exploded_chapter.number,
            'ANNEX'
            FROM "AnnexChapter" exploded_chapter
        WHERE scope.is_main_tree = TRUE
          AND match_result.virt_type = 'ANNEX'
              AND match_result.v_origin_id IS NOT NULL
              AND exploded_chapter."annexId" = match_result.v_origin_id

            UNION ALL

            -- D. PHYSICAL ORIGIN SOURCE (Source-Side)
            SELECT
                origin_annex.id, 'ANNEX',
                origin_res.id, origin_res.initial, origin_res.number, origin_res.year,
                FALSE,
                NULL, NULL, origin_annex.number, NULL, 'RESOLUTION'
            FROM "Annex" origin_annex
            JOIN "Resolution" origin_res ON origin_annex."resolutionId" = origin_res.id
            WHERE match_result.v_origin_id IS NOT NULL
              AND origin_annex.id = match_result.v_origin_id

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