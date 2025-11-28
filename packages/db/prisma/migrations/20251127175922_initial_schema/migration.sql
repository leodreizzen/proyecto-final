-- CreateEnum
CREATE TYPE "ArticleType" AS ENUM ('NORMATIVE', 'MODIFIER', 'CREATE_DOCUMENT', 'FORMALITY');

-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('MODIFY_ARTICLE', 'REPLACE_ARTICLE', 'ADVANCED', 'REPEAL', 'RATIFY_AD_REFERENDUM', 'REPLACE_ANNEX', 'MODIFY_TEXT_ANNEX', 'ADD_ARTICLE', 'ADD_ANNEX', 'APPLY_MODIFICATIONS_ANNEX');

-- CreateEnum
CREATE TYPE "AnnexType" AS ENUM ('TEXT', 'WITH_ARTICLES');

-- CreateEnum
CREATE TYPE "ReplaceAnnexContentType" AS ENUM ('INLINE', 'REFERENCE');

-- CreateEnum
CREATE TYPE "ReferenceTargetType" AS ENUM ('RESOLUTION', 'ANNEX', 'ARTICLE', 'CHAPTER');

-- CreateEnum
CREATE TYPE "ReferenceSourceType" AS ENUM ('TEXT_REFERENCE', 'CHANGE_ADVANCED', 'CHANGE_REPEAL', 'CHANGE_RATIFY', 'CHANGE_ADD_ANNEX', 'CHANGE_REPLACE_ANNEX', 'CHANGE_MODIFY_TEXT_ANNEX', 'CHANGE_ADD_ARTICLE', 'CHANGE_MODIFY_ARTICLE', 'CHANGE_REPLACE_ARTICLE', 'CHANGE_RATIFY_AD_REFERENDUM', 'ARTICLE_CREATE_DOCUMENT');

-- CreateTable
CREATE TABLE "Resolution" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "initial" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "decisionBy" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "keywords" TEXT[],
    "caseFiles" TEXT[],
    "originalFileId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "lastUpdateById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recital" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resolutionId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Recital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consideration" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resolutionId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "Consideration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resolutionId" UUID,
    "annexId" UUID,
    "chapterId" UUID,
    "addedByChangeId" UUID,
    "newContentFromChangeId" UUID,
    "number" INTEGER NOT NULL,
    "suffix" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "type" "ArticleType" NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleNormative" (
    "id" UUID NOT NULL,

    CONSTRAINT "ArticleNormative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleModifier" (
    "id" UUID NOT NULL,

    CONSTRAINT "ArticleModifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCreateDocument" (
    "id" UUID NOT NULL,
    "annexToApproveReferenceId" UUID NOT NULL,

    CONSTRAINT "ArticleCreateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleFormality" (
    "id" UUID NOT NULL,

    CONSTRAINT "ArticleFormality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Change" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "articleModifierId" UUID NOT NULL,
    "type" "ChangeType" NOT NULL,

    CONSTRAINT "Change_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeModifyArticle" (
    "id" UUID NOT NULL,
    "before" TEXT NOT NULL,
    "after" TEXT NOT NULL,
    "targetArticleReferenceId" UUID NOT NULL,

    CONSTRAINT "ChangeModifyArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeReplaceArticle" (
    "id" UUID NOT NULL,
    "targetArticleReferenceId" UUID NOT NULL,

    CONSTRAINT "ChangeReplaceArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeAdvanced" (
    "id" UUID NOT NULL,
    "targetReferenceId" UUID NOT NULL,

    CONSTRAINT "ChangeAdvanced_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRatifyAdReferendum" (
    "id" UUID NOT NULL,
    "targetResolutionReferenceId" UUID NOT NULL,

    CONSTRAINT "ChangeRatifyAdReferendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeReplaceAnnex" (
    "id" UUID NOT NULL,
    "targetAnnexReferenceId" UUID NOT NULL,
    "newContentType" "ReplaceAnnexContentType" NOT NULL,
    "newAnnexReferenceId" UUID,

    CONSTRAINT "ChangeReplaceAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeAddAnnex" (
    "id" UUID NOT NULL,
    "annexToAddReferenceId" UUID NOT NULL,
    "targetResolutionReferenceId" UUID,
    "targetAnnexReferenceId" UUID,
    "newAnnexNumber" INTEGER,

    CONSTRAINT "ChangeAddAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeModifyTextAnnex" (
    "id" UUID NOT NULL,
    "targetAnnexReferenceId" UUID NOT NULL,
    "before" TEXT NOT NULL,
    "after" TEXT NOT NULL,

    CONSTRAINT "ChangeModifyTextAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeAddArticle" (
    "id" UUID NOT NULL,
    "targetResolutionReferenceId" UUID,
    "targetAnnexReferenceId" UUID,
    "targetChapterReferenceId" UUID,
    "newArticleNumber" INTEGER,
    "newArticleSuffix" INTEGER,

    CONSTRAINT "ChangeAddArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeRepeal" (
    "id" UUID NOT NULL,
    "targetReferenceId" UUID NOT NULL,

    CONSTRAINT "ChangeRepeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeApplyModificationsAnnex" (
    "id" UUID NOT NULL,
    "annexToApplyId" UUID NOT NULL,

    CONSTRAINT "ChangeApplyModificationsAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Annex" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resolutionId" UUID,
    "changeReplaceAnnexId" UUID,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "type" "AnnexType" NOT NULL,

    CONSTRAINT "Annex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnexText" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "AnnexText_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnexWithArticles" (
    "id" UUID NOT NULL,
    "initialText" TEXT,
    "finalText" TEXT,

    CONSTRAINT "AnnexWithArticles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnexChapter" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "annexId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "AnnexChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "recitalId" UUID,
    "considerationId" UUID,
    "articleId" UUID,
    "annexTextId" UUID,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextReference" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "textBefore" TEXT NOT NULL,
    "textAfter" TEXT NOT NULL,
    "referenceId" UUID NOT NULL,
    "recitalId" UUID,
    "considerationId" UUID,
    "articleId" UUID,
    "annexTextId" UUID,

    CONSTRAINT "TextReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reference" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "targetType" "ReferenceTargetType" NOT NULL,
    "sourceType" "ReferenceSourceType" NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceResolution" (
    "id" UUID NOT NULL,
    "resolutionId" UUID,
    "initial" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "ReferenceResolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceArticle" (
    "id" UUID NOT NULL,
    "articleId" UUID,
    "initial" TEXT NOT NULL,
    "resNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "articleNumber" INTEGER NOT NULL,
    "articleSuffix" INTEGER NOT NULL,
    "annexNumber" INTEGER,
    "chapterNumber" INTEGER,

    CONSTRAINT "ReferenceArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceAnnex" (
    "id" UUID NOT NULL,
    "annexId" UUID,
    "initial" TEXT NOT NULL,
    "resNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "annexNumber" INTEGER NOT NULL,

    CONSTRAINT "ReferenceAnnex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceChapter" (
    "id" UUID NOT NULL,
    "chapterId" UUID,
    "initial" TEXT NOT NULL,
    "resNumber" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "annexNumber" INTEGER NOT NULL,
    "chapterNumber" INTEGER NOT NULL,

    CONSTRAINT "ReferenceChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "userId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "path" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_originalFileId_key" ON "Resolution"("originalFileId");

-- CreateIndex
CREATE INDEX "Resolution_date_idx" ON "Resolution"("date");

-- CreateIndex
CREATE INDEX "Resolution_keywords_idx" ON "Resolution"("keywords");

-- CreateIndex
CREATE UNIQUE INDEX "Resolution_initial_number_year_key" ON "Resolution"("initial", "number", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Recital_resolutionId_number_key" ON "Recital"("resolutionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Consideration_resolutionId_number_key" ON "Consideration"("resolutionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Article_addedByChangeId_key" ON "Article"("addedByChangeId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_newContentFromChangeId_key" ON "Article"("newContentFromChangeId");

-- CreateIndex
CREATE INDEX "Article_resolutionId_idx" ON "Article"("resolutionId");

-- CreateIndex
CREATE INDEX "Article_annexId_idx" ON "Article"("annexId");

-- CreateIndex
CREATE INDEX "Article_chapterId_idx" ON "Article"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_resolutionId_number_suffix_key" ON "Article"("resolutionId", "number", "suffix");

-- CreateIndex
CREATE UNIQUE INDEX "Article_annexId_number_suffix_key" ON "Article"("annexId", "number", "suffix");

-- CreateIndex
CREATE UNIQUE INDEX "Article_chapterId_number_suffix_key" ON "Article"("chapterId", "number", "suffix");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCreateDocument_annexToApproveReferenceId_key" ON "ArticleCreateDocument"("annexToApproveReferenceId");

-- CreateIndex
CREATE INDEX "Change_articleModifierId_idx" ON "Change"("articleModifierId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeModifyArticle_targetArticleReferenceId_key" ON "ChangeModifyArticle"("targetArticleReferenceId");

-- CreateIndex
CREATE INDEX "ChangeModifyArticle_targetArticleReferenceId_idx" ON "ChangeModifyArticle"("targetArticleReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeReplaceArticle_targetArticleReferenceId_key" ON "ChangeReplaceArticle"("targetArticleReferenceId");

-- CreateIndex
CREATE INDEX "ChangeReplaceArticle_targetArticleReferenceId_idx" ON "ChangeReplaceArticle"("targetArticleReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAdvanced_targetReferenceId_key" ON "ChangeAdvanced"("targetReferenceId");

-- CreateIndex
CREATE INDEX "ChangeAdvanced_targetReferenceId_idx" ON "ChangeAdvanced"("targetReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeRatifyAdReferendum_targetResolutionReferenceId_key" ON "ChangeRatifyAdReferendum"("targetResolutionReferenceId");

-- CreateIndex
CREATE INDEX "ChangeRatifyAdReferendum_targetResolutionReferenceId_idx" ON "ChangeRatifyAdReferendum"("targetResolutionReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeReplaceAnnex_targetAnnexReferenceId_key" ON "ChangeReplaceAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeReplaceAnnex_newAnnexReferenceId_key" ON "ChangeReplaceAnnex"("newAnnexReferenceId");

-- CreateIndex
CREATE INDEX "ChangeReplaceAnnex_targetAnnexReferenceId_idx" ON "ChangeReplaceAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddAnnex_annexToAddReferenceId_key" ON "ChangeAddAnnex"("annexToAddReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddAnnex_targetResolutionReferenceId_key" ON "ChangeAddAnnex"("targetResolutionReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddAnnex_targetAnnexReferenceId_key" ON "ChangeAddAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE INDEX "ChangeAddAnnex_targetResolutionReferenceId_idx" ON "ChangeAddAnnex"("targetResolutionReferenceId");

-- CreateIndex
CREATE INDEX "ChangeAddAnnex_targetAnnexReferenceId_idx" ON "ChangeAddAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeModifyTextAnnex_targetAnnexReferenceId_key" ON "ChangeModifyTextAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE INDEX "ChangeModifyTextAnnex_targetAnnexReferenceId_idx" ON "ChangeModifyTextAnnex"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddArticle_targetResolutionReferenceId_key" ON "ChangeAddArticle"("targetResolutionReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddArticle_targetAnnexReferenceId_key" ON "ChangeAddArticle"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeAddArticle_targetChapterReferenceId_key" ON "ChangeAddArticle"("targetChapterReferenceId");

-- CreateIndex
CREATE INDEX "ChangeAddArticle_targetResolutionReferenceId_idx" ON "ChangeAddArticle"("targetResolutionReferenceId");

-- CreateIndex
CREATE INDEX "ChangeAddArticle_targetAnnexReferenceId_idx" ON "ChangeAddArticle"("targetAnnexReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeRepeal_targetReferenceId_key" ON "ChangeRepeal"("targetReferenceId");

-- CreateIndex
CREATE INDEX "ChangeRepeal_targetReferenceId_idx" ON "ChangeRepeal"("targetReferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeApplyModificationsAnnex_annexToApplyId_key" ON "ChangeApplyModificationsAnnex"("annexToApplyId");

-- CreateIndex
CREATE UNIQUE INDEX "Annex_changeReplaceAnnexId_key" ON "Annex"("changeReplaceAnnexId");

-- CreateIndex
CREATE INDEX "Annex_resolutionId_idx" ON "Annex"("resolutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Annex_resolutionId_number_key" ON "Annex"("resolutionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "AnnexChapter_annexId_number_key" ON "AnnexChapter"("annexId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "TextReference_referenceId_key" ON "TextReference"("referenceId");

-- CreateIndex
CREATE INDEX "ReferenceResolution_initial_number_year_idx" ON "ReferenceResolution"("initial", "number", "year");

-- CreateIndex
CREATE INDEX "ReferenceResolution_resolutionId_idx" ON "ReferenceResolution"("resolutionId");

-- CreateIndex
CREATE INDEX "ReferenceArticle_articleId_idx" ON "ReferenceArticle"("articleId");

-- CreateIndex
CREATE INDEX "ReferenceArticle_initial_resNumber_year_articleNumber_artic_idx" ON "ReferenceArticle"("initial", "resNumber", "year", "articleNumber", "articleSuffix", "annexNumber", "chapterNumber");

-- CreateIndex
CREATE INDEX "ReferenceAnnex_annexId_idx" ON "ReferenceAnnex"("annexId");

-- CreateIndex
CREATE INDEX "ReferenceAnnex_initial_resNumber_year_annexNumber_idx" ON "ReferenceAnnex"("initial", "resNumber", "year", "annexNumber");

-- CreateIndex
CREATE INDEX "ReferenceChapter_chapterId_idx" ON "ReferenceChapter"("chapterId");

-- CreateIndex
CREATE INDEX "ReferenceChapter_initial_resNumber_year_annexNumber_chapter_idx" ON "ReferenceChapter"("initial", "resNumber", "year", "annexNumber", "chapterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_identifier_value_key" ON "Verification"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_path_key" ON "Asset"("path");

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_originalFileId_fkey" FOREIGN KEY ("originalFileId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resolution" ADD CONSTRAINT "Resolution_lastUpdateById_fkey" FOREIGN KEY ("lastUpdateById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recital" ADD CONSTRAINT "Recital_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consideration" ADD CONSTRAINT "Consideration_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_annexId_fkey" FOREIGN KEY ("annexId") REFERENCES "AnnexWithArticles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "AnnexChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_addedByChangeId_fkey" FOREIGN KEY ("addedByChangeId") REFERENCES "ChangeAddArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_newContentFromChangeId_fkey" FOREIGN KEY ("newContentFromChangeId") REFERENCES "ChangeReplaceArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleNormative" ADD CONSTRAINT "ArticleNormative_id_fkey" FOREIGN KEY ("id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleModifier" ADD CONSTRAINT "ArticleModifier_id_fkey" FOREIGN KEY ("id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCreateDocument" ADD CONSTRAINT "ArticleCreateDocument_id_fkey" FOREIGN KEY ("id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCreateDocument" ADD CONSTRAINT "ArticleCreateDocument_annexToApproveReferenceId_fkey" FOREIGN KEY ("annexToApproveReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleFormality" ADD CONSTRAINT "ArticleFormality_id_fkey" FOREIGN KEY ("id") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Change" ADD CONSTRAINT "Change_articleModifierId_fkey" FOREIGN KEY ("articleModifierId") REFERENCES "ArticleModifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeModifyArticle" ADD CONSTRAINT "ChangeModifyArticle_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeModifyArticle" ADD CONSTRAINT "ChangeModifyArticle_targetArticleReferenceId_fkey" FOREIGN KEY ("targetArticleReferenceId") REFERENCES "ReferenceArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeReplaceArticle" ADD CONSTRAINT "ChangeReplaceArticle_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeReplaceArticle" ADD CONSTRAINT "ChangeReplaceArticle_targetArticleReferenceId_fkey" FOREIGN KEY ("targetArticleReferenceId") REFERENCES "ReferenceArticle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAdvanced" ADD CONSTRAINT "ChangeAdvanced_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAdvanced" ADD CONSTRAINT "ChangeAdvanced_targetReferenceId_fkey" FOREIGN KEY ("targetReferenceId") REFERENCES "Reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRatifyAdReferendum" ADD CONSTRAINT "ChangeRatifyAdReferendum_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRatifyAdReferendum" ADD CONSTRAINT "ChangeRatifyAdReferendum_targetResolutionReferenceId_fkey" FOREIGN KEY ("targetResolutionReferenceId") REFERENCES "ReferenceResolution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeReplaceAnnex" ADD CONSTRAINT "ChangeReplaceAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeReplaceAnnex" ADD CONSTRAINT "ChangeReplaceAnnex_targetAnnexReferenceId_fkey" FOREIGN KEY ("targetAnnexReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeReplaceAnnex" ADD CONSTRAINT "ChangeReplaceAnnex_newAnnexReferenceId_fkey" FOREIGN KEY ("newAnnexReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddAnnex" ADD CONSTRAINT "ChangeAddAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddAnnex" ADD CONSTRAINT "ChangeAddAnnex_annexToAddReferenceId_fkey" FOREIGN KEY ("annexToAddReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddAnnex" ADD CONSTRAINT "ChangeAddAnnex_targetResolutionReferenceId_fkey" FOREIGN KEY ("targetResolutionReferenceId") REFERENCES "ReferenceResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddAnnex" ADD CONSTRAINT "ChangeAddAnnex_targetAnnexReferenceId_fkey" FOREIGN KEY ("targetAnnexReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeModifyTextAnnex" ADD CONSTRAINT "ChangeModifyTextAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeModifyTextAnnex" ADD CONSTRAINT "ChangeModifyTextAnnex_targetAnnexReferenceId_fkey" FOREIGN KEY ("targetAnnexReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddArticle" ADD CONSTRAINT "ChangeAddArticle_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddArticle" ADD CONSTRAINT "ChangeAddArticle_targetResolutionReferenceId_fkey" FOREIGN KEY ("targetResolutionReferenceId") REFERENCES "ReferenceResolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddArticle" ADD CONSTRAINT "ChangeAddArticle_targetAnnexReferenceId_fkey" FOREIGN KEY ("targetAnnexReferenceId") REFERENCES "ReferenceAnnex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeAddArticle" ADD CONSTRAINT "ChangeAddArticle_targetChapterReferenceId_fkey" FOREIGN KEY ("targetChapterReferenceId") REFERENCES "ReferenceChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRepeal" ADD CONSTRAINT "ChangeRepeal_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeRepeal" ADD CONSTRAINT "ChangeRepeal_targetReferenceId_fkey" FOREIGN KEY ("targetReferenceId") REFERENCES "Reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeApplyModificationsAnnex" ADD CONSTRAINT "ChangeApplyModificationsAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Change"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeApplyModificationsAnnex" ADD CONSTRAINT "ChangeApplyModificationsAnnex_annexToApplyId_fkey" FOREIGN KEY ("annexToApplyId") REFERENCES "ReferenceAnnex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annex" ADD CONSTRAINT "Annex_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annex" ADD CONSTRAINT "Annex_changeReplaceAnnexId_fkey" FOREIGN KEY ("changeReplaceAnnexId") REFERENCES "ChangeReplaceAnnex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnexText" ADD CONSTRAINT "AnnexText_id_fkey" FOREIGN KEY ("id") REFERENCES "Annex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnexWithArticles" ADD CONSTRAINT "AnnexWithArticles_id_fkey" FOREIGN KEY ("id") REFERENCES "Annex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnexChapter" ADD CONSTRAINT "AnnexChapter_annexId_fkey" FOREIGN KEY ("annexId") REFERENCES "AnnexWithArticles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_recitalId_fkey" FOREIGN KEY ("recitalId") REFERENCES "Recital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_considerationId_fkey" FOREIGN KEY ("considerationId") REFERENCES "Consideration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_annexTextId_fkey" FOREIGN KEY ("annexTextId") REFERENCES "AnnexText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Reference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_recitalId_fkey" FOREIGN KEY ("recitalId") REFERENCES "Recital"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_considerationId_fkey" FOREIGN KEY ("considerationId") REFERENCES "Consideration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextReference" ADD CONSTRAINT "TextReference_annexTextId_fkey" FOREIGN KEY ("annexTextId") REFERENCES "AnnexText"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceResolution" ADD CONSTRAINT "ReferenceResolution_id_fkey" FOREIGN KEY ("id") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceResolution" ADD CONSTRAINT "ReferenceResolution_resolutionId_fkey" FOREIGN KEY ("resolutionId") REFERENCES "Resolution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceArticle" ADD CONSTRAINT "ReferenceArticle_id_fkey" FOREIGN KEY ("id") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceArticle" ADD CONSTRAINT "ReferenceArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceAnnex" ADD CONSTRAINT "ReferenceAnnex_id_fkey" FOREIGN KEY ("id") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceAnnex" ADD CONSTRAINT "ReferenceAnnex_annexId_fkey" FOREIGN KEY ("annexId") REFERENCES "Annex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceChapter" ADD CONSTRAINT "ReferenceChapter_id_fkey" FOREIGN KEY ("id") REFERENCES "Reference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceChapter" ADD CONSTRAINT "ReferenceChapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "AnnexChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
