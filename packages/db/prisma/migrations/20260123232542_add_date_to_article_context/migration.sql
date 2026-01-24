-- =============================================================================
-- 1. RECURSIVE VIEW WITH STRUCTURAL FLAG (Updated with Root Date)
-- =============================================================================

CREATE OR REPLACE VIEW "v_ArticleContext" AS
WITH RECURSIVE ArticleHierarchy(
                                id,
                                number,
                                suffix,
                                "rootResolutionId",
                                "rootAnnexId",
                                "rootChapterId",
                                "resInitial",
                                "resNumber",
                                "resYear",
                                "annexNumber",
                                "chapterNumber",
                                is_structural,
                                "resDate"
    ) AS (
    -- -------------------------------------------------------------------------
    -- BASE CASE: Structural Articles
    -- -------------------------------------------------------------------------
    SELECT
        a.id,
        a.number,
        a.suffix,

        COALESCE(r1.id, r2.id, r3.id),
        COALESCE(an2.id, an3.id),
        COALESCE(ch.id),

        COALESCE(r1.initial, r2.initial, r3.initial),
        COALESCE(r1.number, r2.number, r3.number),
        COALESCE(r1.year, r2.year, r3.year),
        COALESCE(an2.number, an3.number),
        ch.number,

        TRUE::boolean AS is_structural,
        COALESCE(r1.date, r2.date, r3.date)
    FROM "Article" a
             LEFT JOIN "Resolution" r1 ON a."resolutionId" = r1.id
             LEFT JOIN "AnnexWithArticles" awa2 ON a."annexId" = awa2.id
             LEFT JOIN "Annex" an2 ON awa2.id = an2.id
             LEFT JOIN "Resolution" r2 ON an2."resolutionId" = r2.id
             LEFT JOIN "AnnexChapter" ch ON a."chapterId" = ch.id
             LEFT JOIN "AnnexWithArticles" awa3 ON ch."annexId" = awa3.id
             LEFT JOIN "Annex" an3 ON awa3.id = an3.id
             LEFT JOIN "Resolution" r3 ON an3."resolutionId" = r3.id

    WHERE r1.id IS NOT NULL OR r2.id IS NOT NULL OR r3.id IS NOT NULL

    UNION ALL

    -- -------------------------------------------------------------------------
    -- RECURSIVE STEP: Nested Articles
    -- -------------------------------------------------------------------------
    SELECT
        child.id,
        child.number,
        child.suffix,

        parent_ctx."rootResolutionId",
        COALESCE(an_float.id, an_chap_float.id, parent_ctx."rootAnnexId"),
        COALESCE(ch_float.id, parent_ctx."rootChapterId"),

        parent_ctx."resInitial",
        parent_ctx."resNumber",
        parent_ctx."resYear",
        COALESCE(an_float.number, an_chap_float.number, parent_ctx."annexNumber"),
        COALESCE(ch_float.number, parent_ctx."chapterNumber"),

        FALSE::boolean AS is_structural,
        parent_ctx."resDate" -- <--- Se mantiene la fecha de la raíz
    FROM "Article" child
             LEFT JOIN "AnnexWithArticles" awa_float ON child."annexId" = awa_float.id
             LEFT JOIN "Annex" an_float ON awa_float.id = an_float.id
             LEFT JOIN "AnnexChapter" ch_float ON child."chapterId" = ch_float.id
             LEFT JOIN "AnnexWithArticles" awa_chap_float ON ch_float."annexId" = awa_chap_float.id
             LEFT JOIN "Annex" an_chap_float ON awa_chap_float.id = an_chap_float.id

             CROSS JOIN LATERAL (
        SELECT COALESCE(
                       child."addedByChangeId",
                       child."newContentFromChangeId",
                       an_float."changeReplaceAnnexId",
                       an_chap_float."changeReplaceAnnexId"
               ) AS id
        ) AS structural_change

             JOIN "Change" parent_change ON parent_change.id = structural_change.id
             JOIN ArticleHierarchy parent_ctx ON parent_change."articleModifierId" = parent_ctx.id

    WHERE child."resolutionId" IS NULL
      AND (an_float."resolutionId" IS NULL OR an_float.id IS NULL)
      AND (an_chap_float."resolutionId" IS NULL OR an_chap_float.id IS NULL)
)
                   CYCLE id SET is_cycle USING path

SELECT
    id, number, suffix,
    "rootResolutionId", "rootAnnexId", "rootChapterId",
    "resInitial", "resNumber", "resYear", "annexNumber", "chapterNumber",
    is_structural,
    "resDate"
FROM ArticleHierarchy
WHERE NOT is_cycle;