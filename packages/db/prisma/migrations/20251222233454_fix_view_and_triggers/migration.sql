-- This migration updates the v_ArticleContext view to include parents for non structural articules (articles added / replaced via changes)
-- and modifies the linking triggers and functions to only link structural articles.

-- =============================================================================
-- 1. RECURSIVE VIEW WITH STRUCTURAL FLAG
-- =============================================================================
-- This view handles the "Russian Doll" nesting of articles (Changes inside Articles).
-- It calculates the Root Resolution for authorship tracking.
-- It adds an 'is_structural' flag:
--   TRUE:  Article is directly attached to Resolution/Annex/Chapter (Linkable).
--   FALSE: Article is inside a Change (Nested/Virtual). NOT Linkable for References.
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
                                is_structural -- <--- SECURITY FLAG
    ) AS (
    -- -------------------------------------------------------------------------
    -- BASE CASE: Structural Articles (Visible & Linkable)
    -- -------------------------------------------------------------------------
    SELECT
        a.id,
        a.number,
        a.suffix,

        -- Structural IDs
        COALESCE(r1.id, r2.id, r3.id),
        COALESCE(an2.id, an3.id),
        COALESCE(ch.id),

        -- Legal Coordinates
        COALESCE(r1.initial, r2.initial, r3.initial),
        COALESCE(r1.number, r2.number, r3.number),
        COALESCE(r1.year, r2.year, r3.year),
        COALESCE(an2.number, an3.number),
        ch.number,

        TRUE::boolean AS is_structural -- MARKED AS LINKABLE
    FROM "Article" a
             -- Path 1: Direct Resolution
             LEFT JOIN "Resolution" r1 ON a."resolutionId" = r1.id
        -- Path 2: Via Annex
             LEFT JOIN "AnnexWithArticles" awa2 ON a."annexId" = awa2.id
             LEFT JOIN "Annex" an2 ON awa2.id = an2.id
             LEFT JOIN "Resolution" r2 ON an2."resolutionId" = r2.id
        -- Path 3: Via Chapter -> Annex
             LEFT JOIN "AnnexChapter" ch ON a."chapterId" = ch.id
             LEFT JOIN "AnnexWithArticles" awa3 ON ch."annexId" = awa3.id
             LEFT JOIN "Annex" an3 ON awa3.id = an3.id
             LEFT JOIN "Resolution" r3 ON an3."resolutionId" = r3.id

    -- ANCHOR CONDITION: Must have a structural parent
    WHERE r1.id IS NOT NULL
       OR r2.id IS NOT NULL
       OR r3.id IS NOT NULL

    UNION ALL

    -- -------------------------------------------------------------------------
    -- RECURSIVE STEP: Nested Articles (Hidden from Linking)
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

        FALSE::boolean AS is_structural -- MARKED AS NOT LINKABLE
    FROM "Article" child

             -- Intermediate Containers (Floating Annexes/Chapters logic)
             LEFT JOIN "AnnexWithArticles" awa_float ON child."annexId" = awa_float.id
             LEFT JOIN "Annex" an_float ON awa_float.id = an_float.id
             LEFT JOIN "AnnexChapter" ch_float ON child."chapterId" = ch_float.id
             LEFT JOIN "AnnexWithArticles" awa_chap_float ON ch_float."annexId" = awa_chap_float.id
             LEFT JOIN "Annex" an_chap_float ON awa_chap_float.id = an_chap_float.id

        -- Resolve Parent Change ID (From Article directly or via Floating Containers)
             CROSS JOIN LATERAL (
        SELECT COALESCE(
                       child."addedByChangeId",
                       child."newContentFromChangeId",
                       an_float."changeReplaceAnnexId",
                       an_chap_float."changeReplaceAnnexId"
               ) AS id
        ) AS structural_change

        -- Navigate to Change Author
             JOIN "Change" parent_change ON parent_change.id = structural_change.id
             JOIN ArticleHierarchy parent_ctx ON parent_change."articleModifierId" = parent_ctx.id

    -- Recursion Condition (Not matched in Anchor)
    WHERE child."resolutionId" IS NULL
      AND (an_float."resolutionId" IS NULL OR an_float.id IS NULL)
      AND (an_chap_float."resolutionId" IS NULL OR an_chap_float.id IS NULL)
)
                   CYCLE id SET is_cycle USING path

-- FINAL SELECTION
SELECT
    id, number, suffix,
    "rootResolutionId", "rootAnnexId", "rootChapterId",
    "resInitial", "resNumber", "resYear", "annexNumber", "chapterNumber",
    is_structural
FROM ArticleHierarchy
WHERE NOT is_cycle;


-- =============================================================================
-- 2. RESOLUTION TREE MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_unlink_resolution_tree(_res_id uuid) RETURNS VOID AS
$$
BEGIN
    UPDATE "ReferenceResolution" SET "resolutionId" = NULL WHERE "resolutionId" = _res_id;

    UPDATE "ReferenceAnnex" ra
    SET "annexId" = NULL
    FROM "Annex" a
    WHERE ra."annexId" = a.id AND a."resolutionId" = _res_id;

    UPDATE "ReferenceChapter" rc
    SET "chapterId" = NULL
    FROM "AnnexChapter" c
             JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
             JOIN "Annex" a ON awa.id = a.id
    WHERE rc."chapterId" = c.id
      AND a."resolutionId" = _res_id;

    -- Unlink using View with Security Check
    UPDATE "ReferenceArticle" ra
    SET "articleId" = NULL
    FROM "v_ArticleContext" ctx
    WHERE ra."articleId" = ctx.id
      AND ctx."rootResolutionId" = _res_id
      AND ctx.is_structural = TRUE; -- Security Check
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION sp_link_resolution_tree(_res_id uuid) RETURNS VOID AS
$$
DECLARE
    v_initial text; v_number int; v_year int;
BEGIN
    SELECT initial, number, year INTO v_initial, v_number, v_year FROM "Resolution" WHERE id = _res_id;

    UPDATE "ReferenceResolution"
    SET "resolutionId" = _res_id
    WHERE "resolutionId" IS NULL
      AND UPPER(initial) = UPPER(v_initial)
      AND number = v_number
      AND year = v_year;

    UPDATE "ReferenceAnnex" ra
    SET "annexId" = a.id
    FROM "Annex" a
    WHERE a."resolutionId" = _res_id
      AND ra."annexId" IS NULL
      AND ra."annexNumber" = a.number
      AND UPPER(ra.initial) = UPPER(v_initial)
      AND ra."resNumber" = v_number
      AND ra.year = v_year;

    UPDATE "ReferenceChapter" rc
    SET "chapterId" = c.id
    FROM "AnnexChapter" c
             JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
             JOIN "Annex" a ON awa.id = a.id
    WHERE a."resolutionId" = _res_id
      AND rc."chapterId" IS NULL
      AND rc."chapterNumber" = c.number
      AND rc."annexNumber" = a.number
      AND UPPER(rc.initial) = UPPER(v_initial)
      AND rc."resNumber" = v_number
      AND rc.year = v_year;

    -- Link using View with Security Check
    UPDATE "ReferenceArticle" ra
    SET "articleId" = ctx.id
    FROM "v_ArticleContext" ctx
    WHERE ctx."rootResolutionId" = _res_id
      AND ctx.is_structural = TRUE -- Security Check: Only link structural articles
      AND ra."articleId" IS NULL
      AND ra."articleNumber" = ctx.number
      AND COALESCE(ra."articleSuffix", 0) = ctx.suffix
      AND ra."annexNumber" IS NOT DISTINCT FROM ctx."annexNumber"
      AND ra."chapterNumber" IS NOT DISTINCT FROM ctx."chapterNumber"
      AND UPPER(ra.initial) = UPPER(v_initial)
      AND ra."resNumber" = v_number
      AND ra.year = v_year;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 3. ANNEX TREE MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_unlink_annex_tree(_annex_id uuid) RETURNS VOID AS
$$
BEGIN
    UPDATE "ReferenceAnnex" SET "annexId" = NULL WHERE "annexId" = _annex_id;

    UPDATE "ReferenceChapter" rc
    SET "chapterId" = NULL
    FROM "AnnexChapter" c
    WHERE rc."chapterId" = c.id
      AND c."annexId" = _annex_id;

    UPDATE "ReferenceArticle" ra
    SET "articleId" = NULL
    FROM "v_ArticleContext" ctx
    WHERE ra."articleId" = ctx.id
      AND ctx."rootAnnexId" = _annex_id
      AND ctx.is_structural = TRUE; -- Security Check
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_link_annex_tree(_annex_id uuid) RETURNS VOID AS
$$
DECLARE
    v_annex_num int; v_res_ini text; v_res_num int; v_res_year int;
BEGIN
    SELECT a.number, r.initial, r.number, r.year
    INTO v_annex_num, v_res_ini, v_res_num, v_res_year
    FROM "Annex" a
             JOIN "Resolution" r ON a."resolutionId" = r.id
    WHERE a.id = _annex_id;

    UPDATE "ReferenceAnnex" ra
    SET "annexId" = _annex_id
    WHERE "annexId" IS NULL
      AND ra."annexNumber" = v_annex_num
      AND UPPER(ra.initial) = UPPER(v_res_ini)
      AND ra."resNumber" = v_res_num
      AND ra.year = v_res_year;

    UPDATE "ReferenceChapter" rc
    SET "chapterId" = c.id
    FROM "AnnexChapter" c
    WHERE c."annexId" = _annex_id
      AND rc."chapterId" IS NULL
      AND rc."chapterNumber" = c.number
      AND rc."annexNumber" = v_annex_num
      AND rc.year = v_res_year
      AND rc."resNumber" = v_res_num
      AND UPPER(rc.initial) = UPPER(v_res_ini);

    UPDATE "ReferenceArticle" ra
    SET "articleId" = art_ctx.id
    FROM "v_ArticleContext" art_ctx
    WHERE art_ctx."rootAnnexId" = _annex_id
      AND art_ctx.is_structural = TRUE -- Security Check
      AND ra."articleId" IS NULL
      AND ra."articleNumber" = art_ctx.number
      AND COALESCE(ra."articleSuffix", 0) = art_ctx.suffix
      AND ra."annexNumber" = art_ctx."annexNumber"
      AND ra."chapterNumber" IS NOT DISTINCT FROM art_ctx."chapterNumber"
      AND ra.year = v_res_year
      AND ra."resNumber" = v_res_num
      AND UPPER(ra.initial) = UPPER(v_res_ini);
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 4. CHAPTER TREE MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_unlink_chapter_tree(_chapter_id uuid) RETURNS VOID AS
$$
BEGIN
    UPDATE "ReferenceChapter" SET "chapterId" = NULL WHERE "chapterId" = _chapter_id;

    UPDATE "ReferenceArticle" ra
    SET "articleId" = NULL
    FROM "v_ArticleContext" ctx
    WHERE ra."articleId" = ctx.id
      AND ctx."rootChapterId" = _chapter_id
      AND ctx.is_structural = TRUE; -- Security Check
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_link_chapter_tree(_chapter_id uuid) RETURNS VOID AS
$$
DECLARE
    v_chap_num int; v_annex_num int; v_res_ini text; v_res_num int; v_res_year int;
BEGIN
    SELECT c.number, a.number, r.initial, r.number, r.year
    INTO v_chap_num, v_annex_num, v_res_ini, v_res_num, v_res_year
    FROM "AnnexChapter" c
             JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
             JOIN "Annex" a ON awa.id = a.id
             JOIN "Resolution" r ON a."resolutionId" = r.id
    WHERE c.id = _chapter_id;

    UPDATE "ReferenceChapter" rc
    SET "chapterId" = _chapter_id
    WHERE "chapterId" IS NULL
      AND rc."chapterNumber" = v_chap_num
      AND rc."annexNumber" = v_annex_num
      AND UPPER(rc.initial) = UPPER(v_res_ini)
      AND rc."resNumber" = v_res_num
      AND rc.year = v_res_year;

    -- Using View with Security Check (Better than raw table for consistency)
    UPDATE "ReferenceArticle" ra
    SET "articleId" = ctx.id
    FROM "v_ArticleContext" ctx
    WHERE ctx."rootChapterId" = _chapter_id
      AND ctx.is_structural = TRUE -- Security Check
      AND ra."articleId" IS NULL
      AND ra."articleNumber" = ctx.number
      AND COALESCE(ra."articleSuffix", 0) = ctx.suffix
      AND ra."chapterNumber" = v_chap_num
      AND ra."annexNumber" = v_annex_num
      AND ra.year = v_res_year
      AND ra."resNumber" = v_res_num
      AND UPPER(ra.initial) = UPPER(v_res_ini);
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 5. INDIVIDUAL ARTICLE MAINTENANCE
-- =============================================================================

CREATE OR REPLACE FUNCTION sp_link_article(_article_id uuid) RETURNS VOID AS
$$
DECLARE
    ctx "v_ArticleContext"%ROWTYPE;
BEGIN
    SELECT * INTO ctx FROM "v_ArticleContext" WHERE id = _article_id;

    -- CRITICAL SECURITY CHECK:
    -- Only link if the article is structural (part of the official body).
    -- Ignore articles nested inside changes.
    IF ctx.id IS NOT NULL AND ctx.is_structural = TRUE THEN
        UPDATE "ReferenceArticle" ra
        SET "articleId" = _article_id
        WHERE "articleId" IS NULL
          AND ra."articleNumber" = ctx.number
          AND COALESCE(ra."articleSuffix", 0) = ctx.suffix
          AND ra."annexNumber" IS NOT DISTINCT FROM ctx."annexNumber"
          AND ra."chapterNumber" IS NOT DISTINCT FROM ctx."chapterNumber"
          AND UPPER(ra.initial) = UPPER(ctx."resInitial")
          AND ra."resNumber" = ctx."resNumber"
          AND ra.year = ctx."resYear";
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: trg_article_maintenance
-- Note: This remains simple, only watching structural columns.
-- The complexity of preventing nested links is handled inside sp_link_article.
CREATE OR REPLACE FUNCTION trg_article_maintenance() RETURNS TRIGGER AS $$
BEGIN
    -- Relink after identity or parent change
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.number IS DISTINCT FROM NEW.number) OR (OLD.suffix IS DISTINCT FROM NEW.suffix) OR
           (OLD."resolutionId" IS DISTINCT FROM NEW."resolutionId") OR
           (OLD."annexId" IS DISTINCT FROM NEW."annexId") OR
           (OLD."chapterId" IS DISTINCT FROM NEW."chapterId") THEN

            PERFORM sp_unlink_article(OLD.id);
            PERFORM sp_link_article(NEW.id); -- Calls the secured function
        END IF;
        -- Link on insert
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM sp_link_article(NEW.id);
    END IF;

    RETURN NULL;
END; $$ LANGUAGE plpgsql;


-- =============================================================================
-- 6. REFERENCE SEEKER (Insert/Update on ReferenceArticle)
-- =============================================================================

CREATE OR REPLACE FUNCTION trg_seek_article_target_optimized() RETURNS TRIGGER AS
$$
BEGIN
    NEW."articleId" := (SELECT id
                        FROM "v_ArticleContext"
                        WHERE number = NEW."articleNumber"
                          AND suffix = COALESCE(NEW."articleSuffix", 0)
                          AND "annexNumber" IS NOT DISTINCT FROM NEW."annexNumber"
                          AND "chapterNumber" IS NOT DISTINCT FROM NEW."chapterNumber"
                          AND UPPER("resInitial") = UPPER(NEW.initial)
                          AND "resNumber" = NEW."resNumber"
                          AND "resYear" = NEW.year

                          AND is_structural = TRUE -- SECURITY CHECK: Only match real articles

                        LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;