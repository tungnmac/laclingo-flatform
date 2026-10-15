CREATE TABLE "trade_notes" (
	"trade_id" uuid PRIMARY KEY NOT NULL,
	"reason" text,
	"lesson" text,
	"emotion" varchar(12),
	"rating" integer,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "closed_qty" numeric(36, 18) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_notes" ADD CONSTRAINT "trade_notes_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Dữ liệu cũ (trước khi engine ghi closed_qty): trade có lãi/lỗ chốt ≠ 0 là lệnh chốt
UPDATE "trades" SET "closed_qty" = "qty" WHERE "realized_pnl" <> 0;
