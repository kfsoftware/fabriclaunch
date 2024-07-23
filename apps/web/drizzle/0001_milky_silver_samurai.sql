DO $$ BEGIN
 CREATE TYPE "public"."node_type" AS ENUM('PEER', 'ORDERER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "node" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid,
	"name" varchar(255) NOT NULL,
	"type" "node_type" NOT NULL,
	"url" varchar(255) NOT NULL,
	"tls_cert" text NOT NULL,
	"sign_cert" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "sign_cert" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "tls_cert" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "node" ADD CONSTRAINT "node_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
