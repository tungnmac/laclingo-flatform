CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"symbol" varchar(30) NOT NULL,
	"interval" varchar(4) NOT NULL,
	"context" integer NOT NULL,
	"length" integer NOT NULL,
	"cursor" integer DEFAULT 0 NOT NULL,
	"candles" jsonb NOT NULL,
	"wallet" jsonb NOT NULL,
	"orders" jsonb NOT NULL,
	"status" varchar(10) DEFAULT 'active' NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "practice_trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"candle_index" integer NOT NULL,
	"side" varchar(4) NOT NULL,
	"qty" numeric(36, 18) NOT NULL,
	"price" numeric(36, 18) NOT NULL,
	"fee" numeric(36, 18) NOT NULL,
	"realized_pnl" numeric(36, 18) NOT NULL,
	"closed_qty" numeric(36, 18) NOT NULL,
	"kind" varchar(12) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_trades" ADD CONSTRAINT "practice_trades_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "practice_sessions_one_active" ON "practice_sessions" USING btree ("user_id") WHERE "practice_sessions"."status" = 'active';--> statement-breakpoint
CREATE INDEX "practice_sessions_user_created_idx" ON "practice_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "practice_trades_session_idx" ON "practice_trades" USING btree ("session_id","candle_index");