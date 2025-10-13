/*
  Warnings:

  - You are about to drop the column `embedding` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Article" DROP COLUMN "embedding";

-- CreateTable
CREATE TABLE "public"."Appendix" (
    "uuid" TEXT NOT NULL,
    "resolutionUuid" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appendix_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."AppendixArticle" (
    "uuid" TEXT NOT NULL,
    "appendixUuid" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppendixArticle_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."Embedding" (
    "id" SERIAL NOT NULL,
    "articleUuid" TEXT,
    "appendixArticleUuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vector" Vector(3072),

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AppendixArticleReferences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AppendixArticleReferences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appendix_resolutionUuid_number_key" ON "public"."Appendix"("resolutionUuid", "number");

-- CreateIndex
CREATE UNIQUE INDEX "AppendixArticle_appendixUuid_number_key" ON "public"."AppendixArticle"("appendixUuid", "number");

-- CreateIndex
CREATE INDEX "_AppendixArticleReferences_B_index" ON "public"."_AppendixArticleReferences"("B");

-- AddForeignKey
ALTER TABLE "public"."Appendix" ADD CONSTRAINT "Appendix_resolutionUuid_fkey" FOREIGN KEY ("resolutionUuid") REFERENCES "public"."Resolution"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AppendixArticle" ADD CONSTRAINT "AppendixArticle_appendixUuid_fkey" FOREIGN KEY ("appendixUuid") REFERENCES "public"."Appendix"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Embedding" ADD CONSTRAINT "Embedding_articleUuid_fkey" FOREIGN KEY ("articleUuid") REFERENCES "public"."Article"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Embedding" ADD CONSTRAINT "Embedding_appendixArticleUuid_fkey" FOREIGN KEY ("appendixArticleUuid") REFERENCES "public"."AppendixArticle"("uuid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AppendixArticleReferences" ADD CONSTRAINT "_AppendixArticleReferences_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."AppendixArticle"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AppendixArticleReferences" ADD CONSTRAINT "_AppendixArticleReferences_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."AppendixArticle"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
