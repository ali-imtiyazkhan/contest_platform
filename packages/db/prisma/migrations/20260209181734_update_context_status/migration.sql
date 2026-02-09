-- CreateEnum
CREATE TYPE "public"."ContextStatus" AS ENUM ('Pending', 'Generating', 'Completed', 'Failed');

-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "contextStatus" "public"."ContextStatus" NOT NULL DEFAULT 'Pending';
