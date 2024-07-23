ALTER TABLE "tenant" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant" ADD CONSTRAINT "tenant_slug_unique" UNIQUE("slug");