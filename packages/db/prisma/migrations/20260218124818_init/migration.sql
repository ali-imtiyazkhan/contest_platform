/*
  Warnings:

  - You are about to drop the column `notionDocId` on the `Challenge` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ContestCategory" AS ENUM ('MathLogic', 'Writing', 'GeneralKnowledge', 'TechCoding');

-- CreateEnum
CREATE TYPE "public"."Difficulty" AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Elite');

-- AlterTable
ALTER TABLE "public"."Challenge" DROP COLUMN "notionDocId",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hint" TEXT,
ADD COLUMN     "question" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "public"."Contest" ADD COLUMN     "category" "public"."ContestCategory" NOT NULL DEFAULT 'MathLogic',
ADD COLUMN     "difficulty" "public"."Difficulty" NOT NULL DEFAULT 'Beginner',
ADD COLUMN     "host" TEXT,
ADD COLUMN     "maxParticipants" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "prize" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Challenge_createdAt_idx" ON "public"."Challenge"("createdAt");

-- CreateIndex
CREATE INDEX "Contest_startTime_idx" ON "public"."Contest"("startTime");

-- CreateIndex
CREATE INDEX "Contest_endTime_idx" ON "public"."Contest"("endTime");
