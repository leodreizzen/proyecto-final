-- Create the v_MissingResolution view with search_id using the existing immutable function
CREATE OR REPLACE VIEW "v_MissingResolution" AS
SELECT
    UPPER(T.initial) AS initial,
    T."resNumber" AS number,
    T.year,
    COUNT(*)::int AS "referencesCount",
    resolution_search_id(UPPER(T.initial), T."resNumber", T.year) AS search_id
FROM (
    -- 1. Direct references to Resolution
    SELECT initial, number as "resNumber", year
    FROM "ReferenceResolution"
    WHERE "resolutionId" IS NULL

    UNION ALL

    -- 2. References to Articles (orphans)
    SELECT initial, "resNumber", year
    FROM "ReferenceArticle"
    WHERE "articleId" IS NULL

    UNION ALL

    -- 3. References to Annexes
    SELECT initial, "resNumber", year
    FROM "ReferenceAnnex"
    WHERE "annexId" IS NULL

    UNION ALL

    -- 4. References to Chapters
    SELECT initial, "resNumber", year
    FROM "ReferenceChapter"
    WHERE "chapterId" IS NULL
) AS T
-- Final check: ensure the resolution is actually missing
WHERE NOT EXISTS (
    SELECT 1 FROM "Resolution" r
    WHERE r.number = T."resNumber"
      AND r.year = T.year
      AND UPPER(r.initial) = UPPER(T.initial)
)
GROUP BY UPPER(T.initial), T."resNumber", T.year;

CREATE INDEX IF NOT EXISTS "idx_ref_res_search_id" ON "ReferenceResolution"
USING GIN (resolution_search_id(UPPER(initial), number, year) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_ref_art_search_id" ON "ReferenceArticle"
USING GIN (resolution_search_id(UPPER(initial), "resNumber", year) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_ref_ann_search_id" ON "ReferenceAnnex"
USING GIN (resolution_search_id(UPPER(initial), "resNumber", year) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_ref_chap_search_id" ON "ReferenceChapter"
USING GIN (resolution_search_id(UPPER(initial), "resNumber", year) gin_trgm_ops);