/*
  Warnings:

  - Added the required column `content` to the `Embedding` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Embedding" ADD COLUMN     "content" TEXT NOT NULL;
