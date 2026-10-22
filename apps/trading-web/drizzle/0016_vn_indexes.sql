CREATE TABLE "vn_index_members" (
	"index_code" varchar(20) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vn_index_members_index_code_symbol_pk" PRIMARY KEY("index_code","symbol")
);
--> statement-breakpoint
CREATE TABLE "vn_index_prices" (
	"index_code" varchar(20) NOT NULL,
	"date" date NOT NULL,
	"value" numeric(14, 4) NOT NULL,
	"volume" numeric(24, 0),
	"turnover" numeric(28, 0),
	CONSTRAINT "vn_index_prices_index_code_date_pk" PRIMARY KEY("index_code","date")
);
