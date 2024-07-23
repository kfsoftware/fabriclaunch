ALTER TABLE "channel_proposal" ADD COLUMN "proposed_by_org" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_proposal" ADD CONSTRAINT "channel_proposal_proposed_by_org_organization_id_fk" FOREIGN KEY ("proposed_by_org") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
