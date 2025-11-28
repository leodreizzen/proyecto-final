CREATE UNIQUE INDEX "Resolution_initial_number_year_key_upper_unique"
    ON "Resolution" (UPPER("initial"), "number", "year");

CREATE INDEX "idx_article_res_lookup" ON "Article" ("resolutionId", "number", "suffix") WHERE "resolutionId" IS NOT NULL;
CREATE INDEX "idx_article_annex_lookup" ON "Article" ("annexId", "number", "suffix") WHERE "annexId" IS NOT NULL;
CREATE INDEX "idx_article_chapter_lookup" ON "Article" ("chapterId", "number", "suffix") WHERE "chapterId" IS NOT NULL;

CREATE INDEX "idx_ref_res_orphan_finder"
    ON "ReferenceResolution" (UPPER("initial"), "number", "year")
    WHERE "resolutionId" IS NULL;

CREATE INDEX "idx_ref_annex_orphan_finder"
    ON "ReferenceAnnex" (UPPER("initial"), "resNumber", "year", "annexNumber")
    WHERE "annexId" IS NULL;

CREATE INDEX "idx_ref_chapter_orphan_finder"
    ON "ReferenceChapter" (UPPER("initial"), "resNumber", "year", "annexNumber", "chapterNumber")
    WHERE "chapterId" IS NULL;

CREATE INDEX "idx_ref_article_orphan_finder"
    ON "ReferenceArticle" (
                           UPPER("initial"),
                           "resNumber",
                           "year",
                           "articleNumber",
                           "articleSuffix",
                           "annexNumber",
                           "chapterNumber"
        )
    WHERE "articleId" IS NULL;
