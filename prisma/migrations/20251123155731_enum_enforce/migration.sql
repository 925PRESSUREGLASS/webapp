-- Create enums
CREATE TYPE "AssetStatus" AS ENUM ('draft', 'active', 'deprecated');
CREATE TYPE "AssetType" AS ENUM ('snippet', 'component', 'template', 'static', 'doc', 'prompt');
CREATE TYPE "BusinessStatus" AS ENUM ('active', 'paused', 'archived');

-- Asset: migrate existing string columns to enums without losing data
ALTER TABLE "Asset" ADD COLUMN "type_new" "AssetType";
ALTER TABLE "Asset" ADD COLUMN "status_new" "AssetStatus";

UPDATE "Asset" SET "type_new" = "type"::text::"AssetType";
UPDATE "Asset" SET "status_new" = "status"::text::"AssetStatus";

ALTER TABLE "Asset" ALTER COLUMN "type_new" SET NOT NULL;
ALTER TABLE "Asset" ALTER COLUMN "status_new" SET NOT NULL;

ALTER TABLE "Asset" DROP COLUMN "type";
ALTER TABLE "Asset" DROP COLUMN "status";
ALTER TABLE "Asset" RENAME COLUMN "type_new" TO "type";
ALTER TABLE "Asset" RENAME COLUMN "status_new" TO "status";

-- Business: migrate status to enum
ALTER TABLE "Business" ADD COLUMN "status_new" "BusinessStatus";
UPDATE "Business" SET "status_new" = "status"::text::"BusinessStatus";
ALTER TABLE "Business" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Business" DROP COLUMN "status";
ALTER TABLE "Business" RENAME COLUMN "status_new" TO "status";
