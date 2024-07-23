ALTER TYPE "audit_log_type" ADD VALUE 'CHANNEL_APPROVED';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "org_id" SET NOT NULL;