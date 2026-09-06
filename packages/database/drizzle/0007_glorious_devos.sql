ALTER TABLE "payment_proofs" ALTER COLUMN "file_data_base64" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "storage_provider" varchar(32) DEFAULT 'DATABASE' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "storage_key" varchar(512) DEFAULT 'legacy' NOT NULL;