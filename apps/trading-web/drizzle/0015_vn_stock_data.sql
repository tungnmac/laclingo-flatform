CREATE TABLE "vn_fin_fields" (
	"statement" varchar(20) NOT NULL,
	"field" varchar(12) NOT NULL,
	"title_vi" varchar(300) NOT NULL,
	"title_en" varchar(300) NOT NULL,
	"level" integer NOT NULL,
	"parent" text,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "vn_fin_fields_statement_field_pk" PRIMARY KEY("statement","field")
);
--> statement-breakpoint
CREATE TABLE "vn_financials" (
	"symbol" varchar(20) NOT NULL,
	"statement" varchar(20) NOT NULL,
	"period" varchar(10) NOT NULL,
	"year" integer NOT NULL,
	"quarter" integer,
	"values" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vn_financials_symbol_statement_period_pk" PRIMARY KEY("symbol","statement","period")
);
--> statement-breakpoint
CREATE TABLE "vn_prices" (
	"symbol" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"open" numeric(20, 4) NOT NULL,
	"high" numeric(20, 4) NOT NULL,
	"low" numeric(20, 4) NOT NULL,
	"close" numeric(20, 4) NOT NULL,
	"volume" numeric(24, 0) NOT NULL,
	"value" numeric(28, 0),
	CONSTRAINT "vn_prices_symbol_date_pk" PRIMARY KEY("symbol","date")
);
--> statement-breakpoint
CREATE TABLE "vn_profiles" (
	"symbol" varchar(20) PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vn_stocks" (
	"symbol" varchar(20) PRIMARY KEY NOT NULL,
	"exchange" varchar(10) NOT NULL,
	"name_vi" varchar(300) NOT NULL,
	"name_en" varchar(300) NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vn_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job" varchar(20) NOT NULL,
	"status" varchar(10) NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "vn_stocks_exchange_idx" ON "vn_stocks" USING btree ("exchange","symbol");--> statement-breakpoint
CREATE INDEX "vn_sync_runs_job_started_idx" ON "vn_sync_runs" USING btree ("job","started_at");