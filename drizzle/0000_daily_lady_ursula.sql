CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."email_sign_in_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_sign_in_tokens_hash_unique" ON "app"."email_sign_in_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_sign_in_tokens_email_created_idx" ON "app"."email_sign_in_tokens" USING btree ("email","created_at");--> statement-breakpoint
CREATE INDEX "email_sign_in_tokens_expires_at_idx" ON "app"."email_sign_in_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "app"."sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "app"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_idle_expires_at_idx" ON "app"."sessions" USING btree ("idle_expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "app"."users" USING btree (lower("email"));--> statement-breakpoint
GRANT USAGE ON SCHEMA "app" TO onihayo_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "app" TO onihayo_app;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE onihayo_migration IN SCHEMA "app" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO onihayo_app;
