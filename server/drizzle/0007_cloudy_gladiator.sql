CREATE TYPE "public"."status_enum" AS ENUM('pending', 'processing', 'failed', 'success');--> statement-breakpoint
ALTER TABLE "ai_hub_resource" RENAME COLUMN "embedding_id" TO "embedding_ids";--> statement-breakpoint
ALTER TABLE "ai_hub_resource" ADD COLUMN "status" "status_enum" DEFAULT 'pending';