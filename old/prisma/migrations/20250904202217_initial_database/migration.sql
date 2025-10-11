-- CreateTable
CREATE TABLE "public"."Resolution" (
    "uuid" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resolution_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."Article" (
    "uuid" TEXT NOT NULL,
    "resolutionUuid" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" Vector(3072),

    CONSTRAINT "Article_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "public"."_ArticleReferences" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArticleReferences_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_resolutionUuid_number_key" ON "public"."Article"("resolutionUuid", "number");

-- CreateIndex
CREATE INDEX "_ArticleReferences_B_index" ON "public"."_ArticleReferences"("B");

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_resolutionUuid_fkey" FOREIGN KEY ("resolutionUuid") REFERENCES "public"."Resolution"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ArticleReferences" ADD CONSTRAINT "_ArticleReferences_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Article"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_ArticleReferences" ADD CONSTRAINT "_ArticleReferences_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Article"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
