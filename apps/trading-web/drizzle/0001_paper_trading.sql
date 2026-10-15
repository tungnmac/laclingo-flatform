CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"market" varchar(10) NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"side" varchar(4) NOT NULL,
	"type" varchar(12) NOT NULL,
	"qty" numeric(36, 18),
	"price" numeric(36, 18),
	"status" varchar(10) DEFAULT 'pending' NOT NULL,
	"reserved" numeric(36, 18) DEFAULT '0' NOT NULL,
	"oco_group" uuid,
	"checked_until" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"filled_at" timestamp with time zone,
	"fill_price" numeric(36, 18),
	"fee" numeric(36, 18) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"market" varchar(10) NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"qty" numeric(36, 18) DEFAULT '0' NOT NULL,
	"avg_price" numeric(36, 18) DEFAULT '0' NOT NULL,
	"margin" numeric(36, 18) DEFAULT '0' NOT NULL,
	"realized_pnl" numeric(36, 18) DEFAULT '0' NOT NULL,
	"liq_checked_until" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"order_id" uuid,
	"market" varchar(10) NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"side" varchar(4) NOT NULL,
	"qty" numeric(36, 18) NOT NULL,
	"price" numeric(36, 18) NOT NULL,
	"fee" numeric(36, 18) NOT NULL,
	"realized_pnl" numeric(36, 18) NOT NULL,
	"kind" varchar(12) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"starting_balance" numeric(36, 18) NOT NULL,
	"cash" numeric(36, 18) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_account_id_trading_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_account_id_trading_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_account_id_trading_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."trading_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trading_accounts" ADD CONSTRAINT "trading_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_account_status_idx" ON "orders" USING btree ("account_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "positions_account_symbol_key" ON "positions" USING btree ("account_id","market","symbol");--> statement-breakpoint
CREATE INDEX "trades_account_time_idx" ON "trades" USING btree ("account_id","executed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "trading_accounts_active_user_key" ON "trading_accounts" USING btree ("user_id") WHERE "trading_accounts"."is_active";