-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "aiContext" TEXT;

-- AlterTable
ALTER TABLE "public"."ContestSubmission" ADD COLUMN     "aiReason" TEXT,
ADD COLUMN     "aiVerdict" TEXT;
