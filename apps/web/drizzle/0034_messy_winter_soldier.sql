ALTER TYPE "status" ADD VALUE 'COMMITTED';--> statement-breakpoint
ALTER TABLE "chaincode_proposal" ALTER COLUMN "status" SET DATA TYPE status;