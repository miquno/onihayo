CREATE TABLE "app"."auth_rate_limits" (
	"bucket_hash" varchar(64) PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_starts_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "auth_rate_limits_expires_at_idx" ON "app"."auth_rate_limits" USING btree ("expires_at");