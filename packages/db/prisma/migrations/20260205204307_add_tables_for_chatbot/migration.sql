-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "SearchableContentType" AS ENUM ('RECITAL', 'CONSIDERATION', 'ARTICLE', 'TEXT_ANNEX');

-- CreateTable
CREATE TABLE "SearchableContent" (
                                     "id" UUID NOT NULL DEFAULT uuidv7(),
                                     "resolutionID" UUID NOT NULL,
                                     "type" "SearchableContentType" NOT NULL,
                                     "recitalNumber" INTEGER,
                                     "considerationNumber" INTEGER,
                                     "articleNumber" INTEGER,
                                     "articleSuffix" INTEGER,
                                     "annexNumber" INTEGER,
                                     "chapterNumber" INTEGER,
                                     "chunkNumber" INTEGER NOT NULL,
                                     "context" TEXT NOT NULL,
                                     "mainText" TEXT NOT NULL,
                                     "engineVersion" TEXT NOT NULL,
                                     "embedding" vector(768) NOT NULL,
                                     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                     CONSTRAINT "SearchableContent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SearchableContent" ADD CONSTRAINT "SearchableContent_resolutionID_fkey" FOREIGN KEY ("resolutionID") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manual Improvements

-- 1. Partial Unique Indexes

CREATE UNIQUE INDEX "idx_searchable_article" ON "SearchableContent"("resolutionID", "articleNumber", "articleSuffix", "annexNumber", "chapterNumber", "chunkNumber") NULLS NOT DISTINCT WHERE "type" = 'ARTICLE';
CREATE UNIQUE INDEX "idx_searchable_recital" ON "SearchableContent"("resolutionID", "recitalNumber", "chunkNumber") WHERE "type" = 'RECITAL';
CREATE UNIQUE INDEX "idx_searchable_consideration" ON "SearchableContent"("resolutionID", "considerationNumber", "chunkNumber") WHERE "type" = 'CONSIDERATION';
CREATE UNIQUE INDEX "idx_searchable_text_annex" ON "SearchableContent"("resolutionID", "annexNumber", "chunkNumber") WHERE "type" = 'TEXT_ANNEX';

-- 2. Check Constraints (Data Integrity)

-- Rule: Chapter implies Annex
ALTER TABLE "SearchableContent" ADD CONSTRAINT "check_chapter_needs_annex" CHECK (
    "chapterNumber" IS NULL OR "annexNumber" IS NOT NULL
    );

-- Rule: Strict Type Exclusivity (Forward and Reverse checks + Non-Nulls)
ALTER TABLE "SearchableContent" ADD CONSTRAINT "check_sc_type_integrity" CHECK (
    CASE
        WHEN "type" = 'RECITAL' THEN
            "recitalNumber" IS NOT NULL AND
            "considerationNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "annexNumber" IS NULL AND "chapterNumber" IS NULL

        WHEN "type" = 'CONSIDERATION' THEN
            "considerationNumber" IS NOT NULL AND
            "recitalNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "annexNumber" IS NULL AND "chapterNumber" IS NULL

        WHEN "type" = 'ARTICLE' THEN
            "articleNumber" IS NOT NULL AND
            "articleSuffix" IS NOT NULL AND
            "recitalNumber" IS NULL AND "considerationNumber" IS NULL
        -- Note: Annex/Chapter CAN be present for Articles

        WHEN "type" = 'TEXT_ANNEX' THEN
            "annexNumber" IS NOT NULL AND
            "recitalNumber" IS NULL AND "considerationNumber" IS NULL AND "articleNumber" IS NULL AND "articleSuffix" IS NULL AND "chapterNumber" IS NULL
        END
    );

-- 3. HNSW Index for Vector Search
CREATE INDEX "SearchableContent_embedding_idx" ON "SearchableContent" USING hnsw ("embedding" vector_cosine_ops);

-- 4. GIN Index for Keyword/Substring Search (Google-style)
-- Requires pg_trgm for efficient substring/fuzzy search (LIKE '%text%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "SearchableContent_mainText_idx" ON "SearchableContent" USING GIN ("mainText" gin_trgm_ops);
