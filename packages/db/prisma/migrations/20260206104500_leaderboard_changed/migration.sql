/*
  Warnings:

  - You are about to drop the column `rank` on the `Leaderboard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contestId,userId]` on the table `Leaderboard` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Leaderboard_contestId_rank_key";

-- AlterTable
ALTER TABLE "public"."Leaderboard" DROP COLUMN "rank",
ALTER COLUMN "score" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_contestId_userId_key" ON "public"."Leaderboard"("contestId", "userId");
