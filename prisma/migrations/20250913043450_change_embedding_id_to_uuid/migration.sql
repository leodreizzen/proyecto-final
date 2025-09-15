/*
  Warnings:

  - The primary key for the `Embedding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Embedding` table. All the data in the column will be lost.
  - The required column `uuid` was added to the `Embedding` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."Embedding" DROP CONSTRAINT "Embedding_pkey",
DROP COLUMN "id",
ADD COLUMN     "uuid" TEXT NOT NULL,
ADD CONSTRAINT "Embedding_pkey" PRIMARY KEY ("uuid");
