-- CreateEnum
CREATE TYPE "public"."DuelStatus" AS ENUM ('Pending', 'Active', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "public"."ChallengeCategory" AS ENUM ('Debugging', 'UIFix', 'APIDesign', 'Algorithms');

-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "category" "public"."ChallengeCategory" NOT NULL DEFAULT 'Algorithms';

-- CreateTable
CREATE TABLE "public"."Duel" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "public"."DuelStatus" NOT NULL DEFAULT 'Pending',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Duel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DuelSubmission" (
    "id" TEXT NOT NULL,
    "duelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submission" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "DuelSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Duel_player1Id_idx" ON "public"."Duel"("player1Id");

-- CreateIndex
CREATE INDEX "Duel_player2Id_idx" ON "public"."Duel"("player2Id");

-- CreateIndex
CREATE INDEX "Duel_status_idx" ON "public"."Duel"("status");

-- CreateIndex
CREATE INDEX "DuelSubmission_duelId_userId_idx" ON "public"."DuelSubmission"("duelId", "userId");

-- AddForeignKey
ALTER TABLE "public"."Duel" ADD CONSTRAINT "Duel_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Duel" ADD CONSTRAINT "Duel_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Duel" ADD CONSTRAINT "Duel_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "public"."Challenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DuelSubmission" ADD CONSTRAINT "DuelSubmission_duelId_fkey" FOREIGN KEY ("duelId") REFERENCES "public"."Duel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DuelSubmission" ADD CONSTRAINT "DuelSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
