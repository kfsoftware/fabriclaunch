ALTER TABLE "channel_proposal_approval" ADD CONSTRAINT "idx_proposal_id_org_id" UNIQUE("proposal_id","organization_id");