WITH RECURSIVE

-- =============================================================================
-- 1. BASE CASE: INITIAL TOGGLE
-- =============================================================================
-- Injects the raw Change IDs into the recursion scope.
-- 'should_expand' defaults to TRUE to ensure the trigger event propagates fully.
INITIAL_DIRTY AS (
    SELECT
        c.id AS entity_id,
        'CHANGE'::text AS entity_type,
        NULL::text AS res_init,
        NULL::int AS res_num,
        NULL::int AS res_year,
        NULL::int AS annex_num,
        NULL::int AS chap_num,
        NULL::int AS art_num,
        NULL::int AS art_suf,
        'INITIAL_TOGGLE'::text as reason,
        0 as depth,
        TRUE as should_expand
    FROM "Change" c
    WHERE c.id = ANY($1::uuid[])
),

-- =============================================================================
-- 2. RECURSIVE PROPAGATION
-- =============================================================================
DirtyScope(entity_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, reason, depth, should_expand) AS (
    -- Anchor Step
    SELECT entity_id, entity_type, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, reason, depth, should_expand
    FROM INITIAL_DIRTY

    UNION ALL

    -- Recursive Step
    SELECT
        next_victim.entity_id,
        next_victim.entity_type,
        next_victim.res_init, next_victim.res_num, next_victim.res_year,
        next_victim.annex_num, next_victim.chap_num, next_victim.art_num, next_victim.art_suf,
        next_victim.reason,
        -- Depth Calculation Logic:
        -- 1. Initial Toggle (Entry Point) -> Cost 0.
        -- 2. Propagation within the same Resolution -> Cost 0.
        -- 3. Propagation across different Resolutions -> Cost 1 (Increment depth).
        scope.depth + CASE
                          WHEN scope.res_num IS NULL THEN 0
                          WHEN coords_match(
                                  next_victim.res_init, next_victim.res_num, next_victim.res_year, NULL, NULL, NULL, NULL,
                                  scope.res_init, scope.res_num, scope.res_year, NULL, NULL, NULL, NULL
                               ) THEN 0
                          ELSE 1
            END,
        next_victim.should_expand
    FROM DirtyScope scope
             CROSS JOIN LATERAL (

        -- A. DOWNWARD PROPAGATION (Structural Hierarchy)
        -- Traverses from Parent (Container) to Children (Contents) using physical tables.
        -- GUARD: Recursion stops if the current scope is flagged as non-expanding.
        SELECT
            h.child_id AS entity_id,
            h.child_type AS entity_type,
            scope.res_init, scope.res_num, scope.res_year,
            CASE WHEN h.child_type = 'ANNEX' THEN ax.number ELSE scope.annex_num END AS annex_num,
            CASE WHEN h.child_type = 'CHAPTER' THEN ch.number ELSE scope.chap_num END AS chap_num,
            CASE WHEN h.child_type = 'ARTICLE' THEN a.number ELSE NULL END AS art_num,
            CASE WHEN h.child_type = 'ARTICLE' THEN a.suffix ELSE NULL END AS art_suf,
            'DESCENDENTS'::text AS reason,
            TRUE AS should_expand
        FROM "v_Hierarchy" h
                 LEFT JOIN "Article" a ON h.child_id = a.id AND h.child_type = 'ARTICLE'
                 LEFT JOIN "Annex" ax ON h.child_id = ax.id AND h.child_type = 'ANNEX'
                 LEFT JOIN "AnnexChapter" ch ON h.child_id = ch.id AND h.child_type = 'CHAPTER'
        WHERE
            scope.entity_id IS NOT NULL
          AND scope.should_expand
          AND h.parent_id = scope.entity_id
          AND h.child_type IN ('ARTICLE', 'CHAPTER', 'ANNEX')

        UNION ALL

        -- B. CONTENT INSPECTION (Containment)
        -- Identifies Changes defined within the current Article scope.
        -- GUARD: Recursion stops if the current scope is flagged as non-expanding.
        SELECT
            c.id AS entity_id,
            'CHANGE'::text AS entity_type,
            scope.res_init, scope.res_num, scope.res_year, scope.annex_num, scope.chap_num, scope.art_num, scope.art_suf,
            'CONTAINED_CHANGES'::text AS reason,
            TRUE AS should_expand
        FROM "ArticleModifier" am
                 JOIN "Change" c ON am.id = c."articleModifierId"
        WHERE
            scope.entity_id IS NOT NULL
          AND scope.should_expand
          AND am.id = scope.entity_id

        UNION ALL

        -- C. REVERSE DEPENDENCY (Target -> New Content)
        -- Identifies content attached to the current scope via an Add/Replace operation.
        -- GUARD: Conservative check; prevents expansion if the parent scope is restricted.
        SELECT
            COALESCE(a.id, ax.id) AS entity_id,
            cm.entity_type,
            cm.res_init, cm.res_num, cm.res_year, cm.annex_num, cm.chap_num, cm.new_art_num, cm.new_art_suf,
            'NEW_CONTENT'::text AS reason,
            TRUE AS should_expand
        FROM "v_ImpactMap" im
                 JOIN "v_CreationMap" cm ON im.change_id = cm.change_id
                 LEFT JOIN "Article" a ON a."addedByChangeId" = cm.change_id OR a."newContentFromChangeId" = cm.change_id
                 LEFT JOIN "Annex" ax ON ax."changeReplaceAnnexId" = cm.change_id
        WHERE
            scope.should_expand
          AND scope.res_num IS NOT NULL
          AND coords_match(
                im.res_init, im.res_num, im.res_year, im.annex_num, im.chap_num, im.art_num, im.art_suf,
                scope.res_init, scope.res_num, scope.res_year, scope.annex_num, scope.chap_num, scope.art_num, scope.art_suf
              )

        UNION ALL

        -- D. CHANGE EXECUTION (Standard Impacts)
        -- Propagates instability from a Change to its targets (e.g., Repeals).
        -- Always expands to capture the full impact chain.
        SELECT
            ref.native_id AS entity_id,
            im.target_type AS entity_type,
            im.res_init, im.res_num, im.res_year, im.annex_num, im.chap_num, im.art_num, im.art_suf,
            'CHANGE_IMPACT'::text AS reason,
            TRUE AS should_expand
        FROM "v_ImpactMap" im
                 LEFT JOIN "v_ResolvedReferences" ref
                            ON (
                                coords_match(
                                      im.res_init, im.res_num, im.res_year, im.annex_num, im.chap_num, im.art_num, im.art_suf,
                                      ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
                                ) 
                                OR (
                                    im.chap_num IS NULL AND ref.chap_num IS NOT NULL AND im.target_type = 'ARTICLE'
                                    AND coords_match(
                                          im.res_init, im.res_num, im.res_year, im.annex_num, NULL, im.art_num, im.art_suf,
                                          ref.res_init, ref.res_num, ref.res_year, ref.annex_num, NULL, ref.art_num, ref.art_suf
                                    )
                                )
                            ) AND ref.target_type = im.target_type
        WHERE
            scope.entity_id IS NOT NULL
          AND im.change_id = scope.entity_id
          -- EXCLUSION: Advanced Changes are excluded here to avoid processing them
          -- as standard impacts with recursion enabled. They are handled in Section G.
          AND NOT EXISTS (SELECT 1 FROM "ChangeAdvanced" ca WHERE ca.id = scope.entity_id)
        UNION ALL

        -- E. CHANGE EXECUTION (Creations)
        -- Propagates instability from a Change to the content it creates.
        -- Always expands.
        SELECT
            COALESCE(a.id, ax.id) AS entity_id,
            cm.entity_type,
            cm.res_init, cm.res_num, cm.res_year, cm.annex_num, cm.chap_num, cm.new_art_num, cm.new_art_suf,
            'CHANGE_CREATION'::text AS reason,
            TRUE AS should_expand
        FROM "v_CreationMap" cm
                 LEFT JOIN "Article" a ON a."addedByChangeId" = cm.change_id OR a."newContentFromChangeId" = cm.change_id
                 LEFT JOIN "Annex" ax ON ax."changeReplaceAnnexId" = cm.change_id
        WHERE
            scope.entity_id IS NOT NULL
          AND cm.change_id = scope.entity_id

        UNION ALL

        -- F. LATE ID RESOLUTION (Virtual Entities)
        -- Resolves physical IDs for virtual entities (Scope ID is NULL) by tracing their Creator Change.
        -- Necessary for content inside newly created structures (e.g., Article inside new Annex).
        SELECT
            COALESCE(direct_a.id, direct_ax.id, child_a.id) AS entity_id,
            CASE WHEN direct_cm.entity_type IS NOT NULL THEN direct_cm.entity_type ELSE 'ARTICLE'::text END AS entity_type,
            scope.res_init, scope.res_num, scope.res_year, scope.annex_num, scope.chap_num, scope.art_num, scope.art_suf,
            'LATE_RESOLUTION'::text AS reason,
            scope.should_expand AS should_expand
        FROM (SELECT 1) dummy

                 -- Strategy 1: Direct Creation Match
                 LEFT JOIN "v_CreationMap" direct_cm ON
            coords_match(
                    scope.res_init, scope.res_num, scope.res_year, scope.annex_num, scope.chap_num, scope.art_num, scope.art_suf,
                    direct_cm.res_init, direct_cm.res_num, direct_cm.res_year, direct_cm.annex_num, direct_cm.chap_num, direct_cm.new_art_num, direct_cm.new_art_suf
            )
                 LEFT JOIN "Article" direct_a ON direct_a."addedByChangeId" = direct_cm.change_id OR direct_a."newContentFromChangeId" = direct_cm.change_id
                 LEFT JOIN "Annex" direct_ax ON direct_ax."changeReplaceAnnexId" = direct_cm.change_id

            -- Strategy 2: Ancestral Creation Match (Hierarchy Traversal)
                 LEFT JOIN "v_CreationMap" parent_cm ON
            scope.art_num IS NOT NULL AND scope.annex_num IS NOT NULL AND
            parent_cm.entity_type = 'ANNEX' AND parent_cm.annex_num = scope.annex_num AND
            parent_cm.res_num = scope.res_num AND parent_cm.res_year = scope.res_year
                 LEFT JOIN "Annex" parent_ax ON parent_ax."changeReplaceAnnexId" = parent_cm.change_id
                 LEFT JOIN "AnnexChapter" intermediate_ch ON intermediate_ch."annexId" = parent_ax.id AND intermediate_ch.number = scope.chap_num
                 LEFT JOIN "Article" child_a ON
            child_a.number = scope.art_num AND child_a.suffix IS NOT DISTINCT FROM scope.art_suf AND
            (
                (scope.chap_num IS NULL AND child_a."annexId" = parent_ax.id)
                    OR
                (scope.chap_num IS NOT NULL AND child_a."chapterId" = intermediate_ch.id)
                )

        WHERE
            scope.entity_id IS NULL
          AND (direct_a.id IS NOT NULL OR direct_ax.id IS NOT NULL OR child_a.id IS NOT NULL)

        UNION ALL

        -- G. ADVANCED CHANGE IMPACT (Shallow Resolution Reference)
        -- Resolves the target Resolution coordinates via the ResolvedReferences view.
        -- Sets 'should_expand' to FALSE to prevent cascading recursion from this reference.
        SELECT
            res.id AS entity_id,
            'RESOLUTION'::text AS entity_type,
            UPPER(ref.res_init) AS res_init, ref.res_num, ref.res_year,
            NULL::int, NULL::int, NULL::int, NULL::int,
            'ADVANCED_IMPACT'::text AS reason,
            FALSE AS should_expand -- <--- RECURSION HALT
        FROM "ChangeAdvanced" ca
                 JOIN "v_ResolvedReferences" ref ON ca."targetReferenceId" = ref.ref_id
                 JOIN "Resolution" res ON
            res.number = ref.res_num AND
            res.year = ref.res_year AND
            UPPER(res.initial) = UPPER(ref.res_init)
        WHERE
            scope.entity_id IS NOT NULL
          AND scope.entity_id = ca.id

        ) AS next_victim
    WHERE NOT scope.is_cycle
)
-- Cycle detection includes 'should_expand' to differentiate between deep and shallow visits.
    CYCLE entity_id, res_init, res_num, res_year, annex_num, chap_num, art_num, art_suf, should_expand SET is_cycle USING path

-- =============================================================================
-- 3. FINAL AGGREGATION
-- =============================================================================
SELECT
    CASE
        WHEN ref.target_type = 'RESOLUTION' THEN ref.native_id
        WHEN ref.target_type = 'ARTICLE' THEN ctx."rootResolutionId"
        WHEN ref.target_type = 'ANNEX' THEN an."resolutionId"
        ELSE NULL
        END AS id,
    MIN(ds.depth) as min_impact_depth
FROM DirtyScope ds
         LEFT JOIN "v_ResolvedReferences" ref
                   ON coords_match(
                           ds.res_init, ds.res_num, ds.res_year, ds.annex_num, ds.chap_num, ds.art_num, ds.art_suf,
                           ref.res_init, ref.res_num, ref.res_year, ref.annex_num, ref.chap_num, ref.art_num, ref.art_suf
                      )
         LEFT JOIN "v_ArticleContext" ctx ON ref.native_id = ctx.id AND ref.target_type = 'ARTICLE'
         LEFT JOIN "Annex" an ON ref.native_id = an.id AND ref.target_type = 'ANNEX'
WHERE
    NOT ds.is_cycle
  AND (
    (ref.target_type = 'RESOLUTION' AND ref.native_id IS NOT NULL) OR
    (ref.target_type = 'ARTICLE' AND ctx."rootResolutionId" IS NOT NULL) OR
    (ref.target_type = 'ANNEX' AND an."resolutionId" IS NOT NULL)
    )
GROUP BY 1;