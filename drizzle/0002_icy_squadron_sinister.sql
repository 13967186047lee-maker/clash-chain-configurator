DROP INDEX "email_codes_email_purpose_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "email_codes_email_purpose_unique" ON "email_codes" USING btree ("email","purpose");