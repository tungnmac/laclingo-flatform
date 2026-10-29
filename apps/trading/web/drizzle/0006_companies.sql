CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market" varchar(2) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_analyses" (
	"company_id" uuid NOT NULL,
	"locale" varchar(2) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"business_md" text DEFAULT '' NOT NULL,
	"strategy_md" text DEFAULT '' NOT NULL,
	"strengths_md" text DEFAULT '' NOT NULL,
	"risks_md" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_analyses_company_id_locale_pk" PRIMARY KEY("company_id","locale")
);
--> statement-breakpoint
ALTER TABLE "company_analyses" ADD CONSTRAINT "company_analyses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "companies_market_symbol_uq" ON "companies" USING btree ("market","symbol");