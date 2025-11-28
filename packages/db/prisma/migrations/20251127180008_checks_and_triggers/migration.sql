ALTER TABLE "Article"
    ADD CONSTRAINT "chk_article_parent_exclusive" CHECK (
        ("resolutionId" IS NOT NULL)::int +
        ("annexId" IS NOT NULL)::int +
        ("chapterId" IS NOT NULL)::int +
        ("addedByChangeId" IS NOT NULL)::int +
        ("newContentFromChangeId" IS NOT NULL)::int = 1
        );

ALTER TABLE "Table"
    ADD CONSTRAINT "chk_table_owner_exclusive" CHECK (
        ("recitalId" IS NOT NULL)::int +
        ("considerationId" IS NOT NULL)::int +
        ("articleId" IS NOT NULL)::int +
        ("annexTextId" IS NOT NULL)::int = 1
        );

ALTER TABLE "TextReference"
    ADD CONSTRAINT "chk_text_reference_owner_exclusive" CHECK (
        ("recitalId" IS NOT NULL)::int +
        ("considerationId" IS NOT NULL)::int +
        ("articleId" IS NOT NULL)::int +
        ("annexTextId" IS NOT NULL)::int = 1
        );

ALTER TABLE "ChangeAddArticle"
    ADD CONSTRAINT "chk_change_add_article_target_exclusive" CHECK (
        ("targetResolutionReferenceId" IS NOT NULL)::int +
        ("targetAnnexReferenceId" IS NOT NULL)::int +
        ("targetChapterReferenceId" IS NOT NULL)::int = 1
        );

ALTER TABLE "ChangeAddArticle"
    ADD CONSTRAINT "chk_change_add_article_number_suffix_strict" CHECK (
        ("newArticleNumber" IS NULL) = ("newArticleSuffix" IS NULL)
        );

ALTER TABLE "ChangeAddAnnex"
    ADD CONSTRAINT "chk_change_add_annex_target_exclusive" CHECK (
        ("targetResolutionReferenceId" IS NOT NULL)::int +
        ("targetAnnexReferenceId" IS NOT NULL)::int = 1
        );

ALTER TABLE "Annex"
    ADD CONSTRAINT "chk_annex_origin_exclusive" CHECK (
        ("resolutionId" IS NOT NULL)::int +
        ("changeReplaceAnnexId" IS NOT NULL)::int = 1
        );

ALTER TABLE "Resolution"
    ADD CONSTRAINT "chk_resolution_year_valid" CHECK (
        ("year" BETWEEN 1000 AND 9999) AND
        ("year" = EXTRACT(YEAR FROM "date"))
        );

ALTER TABLE "Resolution"
    ADD CONSTRAINT "chk_resolution_number_positive" CHECK ("number" > 0);

ALTER TABLE "Article"
    ADD CONSTRAINT "chk_article_number_positive" CHECK ("number" > 0);
ALTER TABLE "Annex"
    ADD CONSTRAINT "chk_annex_number_positive" CHECK ("number" > 0);
ALTER TABLE "AnnexChapter"
    ADD CONSTRAINT "chk_chapter_number_positive" CHECK ("number" > 0);

ALTER TABLE "Asset"
    ADD CONSTRAINT "chk_asset_size_positive" CHECK ("size" > 0);

ALTER TABLE "ChangeReplaceAnnex"
    ADD CONSTRAINT "chk_change_replace_annex_consistency" CHECK (
        ("newContentType" = 'INLINE' AND "newAnnexReferenceId" IS NULL) OR
        ("newContentType" = 'REFERENCE' AND "newAnnexReferenceId" IS NOT NULL)
        );

ALTER TABLE "ReferenceArticle"
    ADD CONSTRAINT "chk_ref_art_chapter_needs_annex" CHECK (
        "chapterNumber" IS NULL OR "annexNumber" IS NOT NULL
        );

-- Check polymorphic references integrity

CREATE OR REPLACE FUNCTION trg_check_type_consistency_generic()
    RETURNS TRIGGER AS $$
DECLARE
    parent_table text;
    discriminator_col text;
    expected_value text;
    actual_value text;
BEGIN
    parent_table := TG_ARGV[0];
    discriminator_col := TG_ARGV[1];
    expected_value := TG_ARGV[2];

    EXECUTE format('SELECT %I::text FROM %I WHERE id = $1', discriminator_col, parent_table)
        USING NEW.id
        INTO actual_value;

    IF actual_value IS DISTINCT FROM expected_value THEN
        RAISE EXCEPTION 'Type Mismatch: Insert into "%" requires %."%" to be ''%'' (Found: ''%'').',
            TG_TABLE_NAME, parent_table, discriminator_col, expected_value, actual_value;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER check_type_article_normative BEFORE INSERT ON "ArticleNormative"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Article', 'type', 'NORMATIVE');

CREATE TRIGGER check_type_article_modifier BEFORE INSERT ON "ArticleModifier"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Article', 'type', 'MODIFIER');

CREATE TRIGGER check_type_article_create_doc BEFORE INSERT ON "ArticleCreateDocument"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Article', 'type', 'CREATE_DOCUMENT');

CREATE TRIGGER check_type_article_formality BEFORE INSERT ON "ArticleFormality"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Article', 'type', 'FORMALITY');

CREATE TRIGGER check_type_chg_modify_art BEFORE INSERT ON "ChangeModifyArticle"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'MODIFY_ARTICLE');

CREATE TRIGGER check_type_chg_replace_art BEFORE INSERT ON "ChangeReplaceArticle"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'REPLACE_ARTICLE');

CREATE TRIGGER check_type_chg_advanced BEFORE INSERT ON "ChangeAdvanced"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'ADVANCED');

CREATE TRIGGER check_type_chg_repeal BEFORE INSERT ON "ChangeRepeal"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'REPEAL');

CREATE TRIGGER check_type_chg_ratify BEFORE INSERT ON "ChangeRatifyAdReferendum"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'RATIFY_AD_REFERENDUM');

CREATE TRIGGER check_type_chg_rep_annex BEFORE INSERT ON "ChangeReplaceAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'REPLACE_ANNEX');

CREATE TRIGGER check_type_chg_mod_txt_ann BEFORE INSERT ON "ChangeModifyTextAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'MODIFY_TEXT_ANNEX');

CREATE TRIGGER check_type_chg_add_art BEFORE INSERT ON "ChangeAddArticle"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'ADD_ARTICLE');

CREATE TRIGGER check_type_chg_add_annex BEFORE INSERT ON "ChangeAddAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'ADD_ANNEX');

CREATE TRIGGER check_type_chg_app_mod_ann BEFORE INSERT ON "ChangeApplyModificationsAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Change', 'type', 'APPLY_MODIFICATIONS_ANNEX');

CREATE TRIGGER check_type_annex_text BEFORE INSERT ON "AnnexText"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Annex', 'type', 'TEXT');

CREATE TRIGGER check_type_annex_with_articles BEFORE INSERT ON "AnnexWithArticles"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Annex', 'type', 'WITH_ARTICLES');

CREATE TRIGGER check_type_ref_resolution BEFORE INSERT ON "ReferenceResolution"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Reference', 'targetType', 'RESOLUTION');

CREATE TRIGGER check_type_ref_annex BEFORE INSERT ON "ReferenceAnnex"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Reference', 'targetType', 'ANNEX');

CREATE TRIGGER check_type_ref_article BEFORE INSERT ON "ReferenceArticle"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Reference', 'targetType', 'ARTICLE');

CREATE TRIGGER check_type_ref_chapter BEFORE INSERT ON "ReferenceChapter"
    FOR EACH ROW EXECUTE FUNCTION trg_check_type_consistency_generic('Reference', 'targetType', 'CHAPTER');


----- Cleanup triggers for deletes -----

CREATE OR REPLACE FUNCTION delete_reference_row(ref_id uuid)
    RETURNS VOID AS
$$
BEGIN
    IF ref_id IS NOT NULL THEN
        DELETE FROM "Reference" WHERE id = ref_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION trg_cleanup_any_refs()
    RETURNS TRIGGER AS
$$
DECLARE
    i        integer;
    col_name text;
    ref_id   uuid;
BEGIN
    -- Iteramos sobre los argumentos pasados al trigger
    FOR i IN 0 .. TG_NARGS - 1
        LOOP
            col_name := TG_ARGV[i];
            -- Extraemos el UUID usando JSONB (Seguro y limpio)
            ref_id := (to_jsonb(OLD) ->> col_name)::uuid;
            PERFORM delete_reference_row(ref_id);
        END LOOP;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


-- Delete parent reference when concrete is deleted

CREATE TRIGGER cleanup_ref_res_parent
    AFTER DELETE
    ON "ReferenceResolution"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('id');

CREATE TRIGGER cleanup_ref_art_parent
    AFTER DELETE
    ON "ReferenceArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('id');

CREATE TRIGGER cleanup_ref_ann_parent
    AFTER DELETE
    ON "ReferenceAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('id');

CREATE TRIGGER cleanup_ref_chap_parent
    AFTER DELETE
    ON "ReferenceChapter"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('id');


-- Delete references when changes are deleted

CREATE TRIGGER cleanup_art_create_doc
    AFTER DELETE
    ON "ArticleCreateDocument"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('annexToApproveReferenceId');

CREATE TRIGGER cleanup_chg_mod_art
    AFTER DELETE
    ON "ChangeModifyArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetArticleReferenceId');

CREATE TRIGGER cleanup_chg_rep_art
    AFTER DELETE
    ON "ChangeReplaceArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetArticleReferenceId');

CREATE TRIGGER cleanup_chg_adv
    AFTER DELETE
    ON "ChangeAdvanced"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetReferenceId');

CREATE TRIGGER cleanup_chg_rep
    AFTER DELETE
    ON "ChangeRepeal"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetReferenceId');

CREATE TRIGGER cleanup_chg_ratify
    AFTER DELETE
    ON "ChangeRatifyAdReferendum"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetResolutionReferenceId');

CREATE TRIGGER cleanup_chg_mod_txt_ann
    AFTER DELETE
    ON "ChangeModifyTextAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('targetAnnexReferenceId');

CREATE TRIGGER cleanup_chg_apply_mod
    AFTER DELETE
    ON "ChangeApplyModificationsAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('annexToApplyId');

CREATE TRIGGER cleanup_txt_ref
    AFTER DELETE
    ON "TextReference"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs('referenceId');


CREATE TRIGGER cleanup_chg_add_annex
    AFTER DELETE
    ON "ChangeAddAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs(
        'annexToAddReferenceId',
        'targetResolutionReferenceId',
        'targetAnnexReferenceId');

CREATE TRIGGER cleanup_chg_add_art
    AFTER DELETE
    ON "ChangeAddArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs(
        'targetResolutionReferenceId',
        'targetAnnexReferenceId',
        'targetChapterReferenceId');

CREATE TRIGGER cleanup_chg_rep_annex
    AFTER DELETE
    ON "ChangeReplaceAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_cleanup_any_refs(
        'targetAnnexReferenceId',
        'newAnnexReferenceId');


-- Unified view for articles references
CREATE OR REPLACE VIEW "v_ArticleContext" AS
SELECT a.id,
       a.number,
       a.suffix,

       COALESCE(r1.id, r2.id, r3.id)                as "rootResolutionId",
       COALESCE(an2.id, an3.id)                     as "rootAnnexId",
       COALESCE(ch.id)                              as "rootChapterId",

       COALESCE(r1.initial, r2.initial, r3.initial) as "resInitial",
       COALESCE(r1.number, r2.number, r3.number)    as "resNumber",
       COALESCE(r1.year, r2.year, r3.year)          as "resYear",
       COALESCE(an2.number, an3.number)             as "annexNumber",
       ch.number                                    as "chapterNumber"
FROM "Article" a
-- Normal article
         LEFT JOIN "Resolution" r1 ON a."resolutionId" = r1.id
-- Annex article
         LEFT JOIN "AnnexWithArticles" awa2 ON a."annexId" = awa2.id
         LEFT JOIN "Annex" an2 ON awa2.id = an2.id
         LEFT JOIN "Resolution" r2 ON an2."resolutionId" = r2.id
-- Chapter article
         LEFT JOIN "AnnexChapter" ch ON a."chapterId" = ch.id
         LEFT JOIN "AnnexWithArticles" awa3 ON ch."annexId" = awa3.id
         LEFT JOIN "Annex" an3 ON awa3.id = an3.id
         LEFT JOIN "Resolution" r3 ON an3."resolutionId" = r3.id;


-- Unlink resolution and all its descendants
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

    UPDATE "ReferenceArticle" ra
    SET "articleId" = NULL
    FROM "v_ArticleContext" ctx
    WHERE ra."articleId" = ctx.id
      AND ctx."rootResolutionId" = _res_id;
END;
$$ LANGUAGE plpgsql;

-- link resolution and all its descendants
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

    UPDATE "ReferenceArticle" ra
    SET "articleId" = ctx.id
    FROM "v_ArticleContext" ctx
    WHERE ctx."rootResolutionId" = _res_id
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


-- Unlink annex and descendents
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
      AND ctx."rootAnnexId" = _annex_id;
END;
$$ LANGUAGE plpgsql;

-- Link annex and descendents
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


-- Unlink chapter and descendents
CREATE OR REPLACE FUNCTION sp_unlink_chapter_tree(_chapter_id uuid) RETURNS VOID AS
$$
BEGIN
    UPDATE "ReferenceChapter" SET "chapterId" = NULL WHERE "chapterId" = _chapter_id;

    UPDATE "ReferenceArticle" ra
    SET "articleId" = NULL
    FROM "v_ArticleContext" ctx
    WHERE ra."articleId" = ctx.id
      AND ctx."rootChapterId" = _chapter_id;
END;
$$ LANGUAGE plpgsql;

-- Link chapter and descendents
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

    UPDATE "ReferenceArticle" ra
    SET "articleId" = a.id
    FROM "Article" a
    WHERE a."chapterId" = _chapter_id
      AND ra."articleId" IS NULL
      AND ra."articleNumber" = a.number
      AND COALESCE(ra."articleSuffix", 0) = a.suffix
      AND ra."chapterNumber" = v_chap_num
      AND ra."annexNumber" = v_annex_num
      AND ra.year = v_res_year
      AND ra."resNumber" = v_res_num
      AND UPPER(ra.initial) = UPPER(v_res_ini);
END;
$$ LANGUAGE plpgsql;


-- Unlink article
CREATE OR REPLACE FUNCTION sp_unlink_article(_article_id uuid) RETURNS VOID AS
$$
BEGIN
    UPDATE "ReferenceArticle" SET "articleId" = NULL WHERE "articleId" = _article_id;
END;
$$ LANGUAGE plpgsql;

-- Link article
CREATE OR REPLACE FUNCTION sp_link_article(_article_id uuid) RETURNS VOID AS
$$
DECLARE
    ctx "v_ArticleContext"%ROWTYPE;
BEGIN
    SELECT * INTO ctx FROM "v_ArticleContext" WHERE id = _article_id;
    IF ctx.id IS NOT NULL THEN
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


--- Link maintenance triggers ---
CREATE OR REPLACE FUNCTION trg_resolution_maintenance() RETURNS TRIGGER AS $$
BEGIN
    -- Relink after identity change
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.initial IS DISTINCT FROM NEW.initial) OR
           (OLD.number IS DISTINCT FROM NEW.number) OR
           (OLD.year IS DISTINCT FROM NEW.year) THEN

            PERFORM sp_unlink_resolution_tree(OLD.id); -- Romper lo viejo
            PERFORM sp_link_resolution_tree(NEW.id);   -- Conectar lo nuevo
        END IF;
    END IF;

    -- Link on insert
    IF (TG_OP = 'INSERT') THEN
        PERFORM sp_link_resolution_tree(NEW.id);
    END IF;

    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER resolution_maintenance
    AFTER INSERT OR UPDATE ON "Resolution"
    FOR EACH ROW EXECUTE FUNCTION trg_resolution_maintenance();


CREATE OR REPLACE FUNCTION trg_annex_maintenance() RETURNS TRIGGER AS $$
BEGIN
    -- Relink after identity or parent change
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.number IS DISTINCT FROM NEW.number) OR (OLD."resolutionId" IS DISTINCT FROM NEW."resolutionId") THEN
            PERFORM sp_unlink_annex_tree(OLD.id);
            PERFORM sp_link_annex_tree(NEW.id);
        END IF;

    -- Link on insert
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM sp_link_annex_tree(NEW.id);
    END IF;

    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER annex_maintenance
    AFTER INSERT OR UPDATE ON "Annex"
    FOR EACH ROW EXECUTE FUNCTION trg_annex_maintenance();


CREATE OR REPLACE FUNCTION trg_chapter_maintenance() RETURNS TRIGGER AS $$
BEGIN
    -- Relink after identity or parent change
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.number IS DISTINCT FROM NEW.number) OR (OLD."annexId" IS DISTINCT FROM NEW."annexId") THEN
            PERFORM sp_unlink_chapter_tree(OLD.id);
            PERFORM sp_link_chapter_tree(NEW.id);
        END IF;
    -- Link on insert
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM sp_link_chapter_tree(NEW.id);
    END IF;

    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER chapter_maintenance
    AFTER INSERT OR UPDATE ON "AnnexChapter"
    FOR EACH ROW EXECUTE FUNCTION trg_chapter_maintenance();



CREATE OR REPLACE FUNCTION trg_article_maintenance() RETURNS TRIGGER AS $$
BEGIN
    -- Relink after identity or parent change
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.number IS DISTINCT FROM NEW.number) OR (OLD.suffix IS DISTINCT FROM NEW.suffix) OR
           (OLD."resolutionId" IS DISTINCT FROM NEW."resolutionId") OR
           (OLD."annexId" IS DISTINCT FROM NEW."annexId") OR
           (OLD."chapterId" IS DISTINCT FROM NEW."chapterId") THEN

            PERFORM sp_unlink_article(OLD.id); -- Romper
            PERFORM sp_link_article(NEW.id);   -- Conectar
        END IF;
    -- Link on insert
    ELSIF (TG_OP = 'INSERT') THEN
        PERFORM sp_link_article(NEW.id);
    END IF;

    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER article_maintenance
    AFTER INSERT OR UPDATE ON "Article"
    FOR EACH ROW EXECUTE FUNCTION trg_article_maintenance();


-- Link references after reference insert or update
CREATE OR REPLACE FUNCTION trg_seek_resolution_target() RETURNS TRIGGER AS
$$
BEGIN
    NEW."resolutionId" := (SELECT id
                           FROM "Resolution" r
                           WHERE UPPER(r.initial) = UPPER(NEW.initial)
                             AND r.number = NEW.number
                             AND r.year = NEW.year
                           LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER seek_resolution_target
    BEFORE INSERT OR UPDATE
    ON "ReferenceResolution"
    FOR EACH ROW
EXECUTE FUNCTION trg_seek_resolution_target();

CREATE OR REPLACE FUNCTION trg_seek_annex_target() RETURNS TRIGGER AS
$$
BEGIN
    NEW."annexId" := (SELECT a.id
                      FROM "Annex" a
                               JOIN "Resolution" r ON a."resolutionId" = r.id
                      WHERE a.number = NEW."annexNumber"
                        AND UPPER(r.initial) = UPPER(NEW.initial)
                        AND r.number = NEW."resNumber"
                        AND r.year = NEW."year"
                      LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seek_annex_target
    BEFORE INSERT OR UPDATE
    ON "ReferenceAnnex"
    FOR EACH ROW
EXECUTE FUNCTION trg_seek_annex_target();

CREATE OR REPLACE FUNCTION trg_seek_chapter_target() RETURNS TRIGGER AS
$$
BEGIN
    NEW."chapterId" := (SELECT c.id
                        FROM "AnnexChapter" c
                                 JOIN "AnnexWithArticles" awa ON c."annexId" = awa.id
                                 JOIN "Annex" a ON awa.id = a.id
                                 JOIN "Resolution" r ON a."resolutionId" = r.id
                        WHERE c.number = NEW."chapterNumber"
                          AND a.number = NEW."annexNumber"
                          AND UPPER(r.initial) = UPPER(NEW.initial)
                          AND r.number = NEW."resNumber"
                          AND r.year = NEW."year"
                        LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seek_chapter_target
    BEFORE INSERT OR UPDATE
    ON "ReferenceChapter"
    FOR EACH ROW
EXECUTE FUNCTION trg_seek_chapter_target();

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
                        LIMIT 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER seek_article_target
    BEFORE INSERT OR UPDATE
    ON "ReferenceArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_seek_article_target_optimized();


-- Prevent self-modification
CREATE OR REPLACE FUNCTION trg_check_self_modification() RETURNS TRIGGER AS
$$
BEGIN
    IF EXISTS (SELECT 1
               FROM "Change" c
                        JOIN "ArticleModifier" am ON c."articleModifierId" = am.id
                        JOIN "ReferenceArticle" ra ON NEW."targetArticleReferenceId" = ra.id
               WHERE c.id = NEW."id"
                 AND am.id = ra."articleId") THEN
        RAISE EXCEPTION 'Circular Reference: An article cannot modify itself.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_self_replace
    BEFORE INSERT OR UPDATE
    ON "ChangeModifyArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_check_self_modification();

CREATE TRIGGER check_self_replace
    BEFORE INSERT OR UPDATE
    ON "ChangeReplaceArticle"
    FOR EACH ROW
EXECUTE FUNCTION trg_check_self_modification();