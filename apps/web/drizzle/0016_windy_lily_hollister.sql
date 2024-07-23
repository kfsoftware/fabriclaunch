ALTER TABLE "channel_proposal" DROP CONSTRAINT "channel_proposal_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "channel_proposal" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "channel_proposal" DROP COLUMN IF EXISTS "organization_id";--> statement-breakpoint
ALTER TABLE "channel_proposal" ADD CONSTRAINT "channel_proposal_slug_unique" UNIQUE("slug");