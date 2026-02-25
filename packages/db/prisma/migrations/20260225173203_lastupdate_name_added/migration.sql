-- AlterTable
ALTER TABLE "public"."ContestSubmission" ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Leaderboard" ADD COLUMN     "lastUpdated" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "avatarColor" TEXT NOT NULL DEFAULT '#4f86f7',
ADD COLUMN     "country" TEXT,
ADD COLUMN     "displayName" TEXT;

-- CreateIndex
CREATE INDEX "ContestSubmission_status_updatedAt_idx" ON "public"."ContestSubmission"("status", "updatedAt");
