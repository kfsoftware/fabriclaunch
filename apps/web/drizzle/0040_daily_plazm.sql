ALTER TABLE "organization_invitation" ADD COLUMN "accepted_by" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
