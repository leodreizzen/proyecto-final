-- ContentBlock Integrity Checks

-- 1. Exclusivity of Parent (Exactly one parent must be NOT NULL)
ALTER TABLE "ContentBlock"
    ADD CONSTRAINT "chk_content_block_parent_exclusive" CHECK (
            ("recitalId" IS NOT NULL)::int +
            ("considerationId" IS NOT NULL)::int +
            ("articleId" IS NOT NULL)::int +
            ("annexTextId" IS NOT NULL)::int +
            ("changeModifyArticleBeforeId" IS NOT NULL)::int +
            ("changeModifyArticleAfterId" IS NOT NULL)::int +
            ("changeModifyTextAnnexBeforeId" IS NOT NULL)::int +
            ("changeModifyTextAnnexAfterId" IS NOT NULL)::int
            = 1
        );

-- 2. Type Consistency (TEXT vs TABLE content)
ALTER TABLE "ContentBlock"
    ADD CONSTRAINT "chk_content_block_type_consistency" CHECK (
            ("type" = 'TEXT' AND "text" IS NOT NULL AND "tableContent" IS NULL) OR
            ("type" = 'TABLE' AND "tableContent" IS NOT NULL AND "text" IS NULL)
        );

-- 3. Article Integrity: Structural Articles must have numbers AND suffix
ALTER TABLE "Article"
    ADD CONSTRAINT "chk_article_structural_number_required" CHECK (
        (
            ("resolutionId" IS NOT NULL OR "annexId" IS NOT NULL OR "chapterId" IS NOT NULL)
            AND "number" IS NOT NULL AND "suffix" IS NOT NULL
        ) OR (
            "resolutionId" IS NULL AND "annexId" IS NULL AND "chapterId" IS NULL
        )
    );

-- 4. Annex Integrity: Structural Annexes must have numbers
ALTER TABLE "Annex"
    ADD CONSTRAINT "chk_annex_structural_number_required" CHECK (
        ("resolutionId" IS NOT NULL AND "number" IS NOT NULL) OR
        ("resolutionId" IS NULL)
    );
