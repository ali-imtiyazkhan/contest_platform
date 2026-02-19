/*
  Warnings:

  - The `type` column on the `Challenge` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Challenge" DROP COLUMN "type",
ADD COLUMN     "type" "public"."Difficulty";

-- DropEnum
DROP TYPE "public"."Type";
