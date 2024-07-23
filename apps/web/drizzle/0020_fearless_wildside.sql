CREATE TABLE IF NOT EXISTS "chaincode_proposal_approval" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"signature" text NOT NULL,
	"certificate" text NOT NULL,
	"approved_at" timestamp DEFAULT now(),
	CONSTRAINT "idx_chaincode_proposal_id_org_id" UNIQUE("proposal_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chaincode_proposal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"tenant_id" uuid NOT NULL,
	"channel_name" varchar(255) NOT NULL,
	"chaincode_name" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"endorsement_policy" varchar(255) NOT NULL,
	"version" varchar(255) NOT NULL,
	"pdc_data" jsonb NOT NULL,
	"status" "status" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "chaincode_proposal_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chaincode_proposal_approval" ADD CONSTRAINT "chaincode_proposal_approval_proposal_id_chaincode_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."chaincode_proposal"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chaincode_proposal_approval" ADD CONSTRAINT "chaincode_proposal_approval_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chaincode_proposal_approval" ADD CONSTRAINT "chaincode_proposal_approval_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chaincode_proposal" ADD CONSTRAINT "chaincode_proposal_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
