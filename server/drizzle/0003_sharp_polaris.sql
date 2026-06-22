CREATE TABLE "conversation_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"sender_id" text NOT NULL,
	"for_user_id" text NOT NULL,
	"conversation_id" text NOT NULL,
	"role" "role_enum" DEFAULT 'member',
	"expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "conversation_invitation" ADD CONSTRAINT "conversation_invitation_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_invitation" ADD CONSTRAINT "conversation_invitation_for_user_id_user_id_fk" FOREIGN KEY ("for_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_invitation" ADD CONSTRAINT "conversation_invitation_conversation_id_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;