CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(16) NOT NULL,
	"event_id" varchar(200) NOT NULL,
	"order_id" uuid,
	"result" varchar(20) NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pro_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_code" bigint NOT NULL,
	"user_id" uuid NOT NULL,
	"period" varchar(8) NOT NULL,
	"months" integer NOT NULL,
	"amount_vnd" integer NOT NULL,
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"provider" varchar(16) NOT NULL,
	"provider_ref" varchar(200),
	"checkout_url" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"subscription_id" uuid,
	"issue" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pro_orders_order_code_unique" UNIQUE("order_code"),
	CONSTRAINT "pro_orders_status_check" CHECK ("pro_orders"."status" in ('pending', 'paid', 'cancelled', 'expired')),
	CONSTRAINT "pro_orders_amount_check" CHECK ("pro_orders"."amount_vnd" > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_pro_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."pro_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_orders" ADD CONSTRAINT "pro_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pro_orders" ADD CONSTRAINT "pro_orders_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_key" ON "payment_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE INDEX "payment_events_order_idx" ON "payment_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "pro_orders_user_created_idx" ON "pro_orders" USING btree ("user_id","created_at");