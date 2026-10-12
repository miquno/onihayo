CREATE TABLE "app"."learner_progress" (
	"user_id" text PRIMARY KEY NOT NULL,
	"document" text NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."learner_progress" ADD CONSTRAINT "learner_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;