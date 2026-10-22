ALTER TABLE "manual_trades" ADD COLUMN "status" varchar(10) DEFAULT 'filled' NOT NULL;--> statement-breakpoint
ALTER TABLE "manual_trades" ADD COLUMN "filled_qty" numeric(36, 18);--> statement-breakpoint
ALTER TABLE "manual_trades" ADD COLUMN "amended_at" timestamp with time zone;