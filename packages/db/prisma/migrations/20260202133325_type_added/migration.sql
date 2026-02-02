-- CreateEnum
CREATE TYPE "public"."Type" AS ENUM ('Easy', 'Medium', 'Hard');

-- AlterTable
ALTER TABLE "public"."Challenge" ADD COLUMN     "type" "public"."Type";
