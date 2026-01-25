/*
  Warnings:

  - You are about to drop the column `content` on the `AnnexText` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `after` on the `ChangeModifyArticle` table. All the data in the column will be lost.
  - You are about to drop the column `before` on the `ChangeModifyArticle` table. All the data in the column will be lost.
  - You are about to drop the column `after` on the `ChangeModifyTextAnnex` table. All the data in the column will be lost.
  - You are about to drop the column `before` on the `ChangeModifyTextAnnex` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Consideration` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Recital` table. All the data in the column will be lost.
  - You are about to drop the column `annexTextId` on the `TextReference` table. All the data in the column will be lost.
  - You are about to drop the column `articleId` on the `TextReference` table. All the data in the column will be lost.
  - You are about to drop the column `considerationId` on the `TextReference` table. All the data in the column will be lost.
  - You are about to drop the column `recitalId` on the `TextReference` table. All the data in the column will be lost.
  - You are about to drop the `Table` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `contentBlockId` to the `TextReference` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentBlockType" AS ENUM ('TEXT', 'TABLE');

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_annexTextId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_articleId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_considerationId_fkey";

-- DropForeignKey
ALTER TABLE "Table" DROP CONSTRAINT "Table_recitalId_fkey";

-- DropForeignKey
ALTER TABLE "TextReference" DROP CONSTRAINT "TextReference_annexTextId_fkey";

-- DropForeignKey
ALTER TABLE "TextReference" DROP CONSTRAINT "TextReference_articleId_fkey";

-- DropForeignKey
ALTER TABLE "TextReference" DROP CONSTRAINT "TextReference_considerationId_fkey";

-- DropForeignKey
ALTER TABLE "TextReference" DROP CONSTRAINT "TextReference_recitalId_fkey";

-- AlterTable
ALTER TABLE "AnnexText" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "text";

-- AlterTable
ALTER TABLE "ChangeModifyArticle" DROP COLUMN "after",
DROP COLUMN "before";

-- AlterTable
ALTER TABLE "ChangeModifyTextAnnex" DROP COLUMN "after",
DROP COLUMN "before";

-- AlterTable
ALTER TABLE "Consideration" DROP COLUMN "text";

-- AlterTable
ALTER TABLE "Recital" DROP COLUMN "text";

-- AlterTable
ALTER TABLE "TextReference" DROP COLUMN "annexTextId",
DROP COLUMN "articleId",
DROP COLUMN "considerationId",
DROP COLUMN "recitalId",
ADD COLUMN     "contentBlockId" UUID NOT NULL;

-- DropTable
DROP TABLE "Table";

-- CreateTable
CREATE TABLE "ContentBlock" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "type" "ContentBlockType" NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT,
    "tableContent" JSONB,
    "recitalId" UUID,
    "considerationId" UUID,
    "articleId" UUID,
    "annexTextId" UUID,
    "changeModifyArticleBeforeId" UUID,
    "changeModifyArticleAfterId" UUID,
    "changeModifyTextAnnexBeforeId" UUID,
    "changeModifyTextAnnexAfterId" UUID,

    CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentBlock_recitalId_idx" ON "ContentBlock"("recitalId");

-- CreateIndex
CREATE INDEX "ContentBlock_considerationId_idx" ON "ContentBlock"("considerationId");

-- CreateIndex
CREATE INDEX "ContentBlock_articleId_idx" ON "ContentBlock"("articleId");

-- CreateIndex
CREATE INDEX "ContentBlock_annexTextId_idx" ON "ContentBlock"("annexTextId");

-- CreateIndex
CREATE INDEX "ContentBlock_changeModifyArticleBeforeId_idx" ON "ContentBlock"("changeModifyArticleBeforeId");

-- CreateIndex
CREATE INDEX "ContentBlock_changeModifyArticleAfterId_idx" ON "ContentBlock"("changeModifyArticleAfterId");

-- CreateIndex
CREATE INDEX "ContentBlock_changeModifyTextAnnexBeforeId_idx" ON "ContentBlock"("changeModifyTextAnnexBeforeId");

-- CreateIndex
CREATE INDEX "ContentBlock_changeModifyTextAnnexAfterId_idx" ON "ContentBlock"("changeModifyTextAnnexAfterId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_recitalId_order_key" ON "ContentBlock"("recitalId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_considerationId_order_key" ON "ContentBlock"("considerationId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_articleId_order_key" ON "ContentBlock"("articleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_annexTextId_order_key" ON "ContentBlock"("annexTextId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_changeModifyArticleBeforeId_order_key" ON "ContentBlock"("changeModifyArticleBeforeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_changeModifyArticleAfterId_order_key" ON "ContentBlock"("changeModifyArticleAfterId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_changeModifyTextAnnexBeforeId_order_key" ON "ContentBlock"("changeModifyTextAnnexBeforeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlock_changeModifyTextAnnexAfterId_order_key" ON "ContentBlock"("changeModifyTextAnnexAfterId", "order");

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_recitalId_fkey" FOREIGN KEY ("recitalId") REFERENCES "Recital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_considerationId_fkey" FOREIGN KEY ("considerationId") REFERENCES "Consideration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_annexTextId_fkey" FOREIGN KEY ("annexTextId") REFERENCES "AnnexText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_changeModifyArticleBeforeId_fkey" FOREIGN KEY ("changeModifyArticleBeforeId") REFERENCES "ChangeModifyArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_changeModifyArticleAfterId_fkey" FOREIGN KEY ("changeModifyArticleAfterId") REFERENCES "ChangeModifyArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_changeModifyTextAnnexBeforeId_fkey" FOREIGN KEY ("changeModifyTextAnnexBeforeId") REFERENCES "ChangeModifyTextAnnex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentBlock" ADD CONSTRAINT "ContentBlock_changeModifyTextAnnexAfterId_fkey" FOREIGN KEY ("changeModifyTextAnnexAfterId") REFERENCES "ChangeModifyTextAnnex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_contentBlockId_fkey" FOREIGN KEY ("contentBlockId") REFERENCES "ContentBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
