-- CreateEnum
CREATE TYPE "public"."SubmissionStatus" AS ENUM ('Pending', 'Judging', 'Accepted', 'Rejected');

-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Contest" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."ContestSubmission" ADD COLUMN     "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200;

-- CreateTable
CREATE TABLE "public"."RatingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contestId" TEXT NOT NULL,
    "before" INTEGER NOT NULL,
    "after" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RatingHistory_userId_idx" ON "public"."RatingHistory"("userId");

-- CreateIndex
CREATE INDEX "Leaderboard_contestId_score_idx" ON "public"."Leaderboard"("contestId", "score");

-- AddForeignKey
ALTER TABLE "public"."RatingHistory" ADD CONSTRAINT "RatingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RatingHistory" ADD CONSTRAINT "RatingHistory_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "public"."Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
