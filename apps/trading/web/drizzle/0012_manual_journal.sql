CREATE TABLE "manual_ledgers" (
	"user_id" uuid NOT NULL,
	"market" varchar(10) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"starting_capital" numeric(24, 2) DEFAULT '0' NOT NULL,
	"fee_rate_pct" numeric(6, 4) DEFAULT '0' NOT NULL,
	"sell_tax_pct" numeric(6, 4) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "manual_ledgers_user_id_market_pk" PRIMARY KEY("user_id","market")
);
--> statement-breakpoint
CREATE TABLE "manual_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"market" varchar(10) NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"side" varchar(4) NOT NULL,
	"qty" numeric(36, 18) NOT NULL,
	"price" numeric(36, 18) NOT NULL,
	"fee" numeric(36, 18) DEFAULT '0' NOT NULL,
	"tax" numeric(36, 18) DEFAULT '0' NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"reason" text,
	"lesson" text,
	"emotion" varchar(12),
	"rating" integer,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manual_ledgers" ADD CONSTRAINT "manual_ledgers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_trades" ADD CONSTRAINT "manual_trades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "manual_trades_user_market_time_idx" ON "manual_trades" USING btree ("user_id","market","executed_at","id");