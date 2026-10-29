CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"author" varchar(200) NOT NULL,
	"year" integer,
	"level" varchar(12) DEFAULT 'basic' NOT NULL,
	"topic" varchar(20) NOT NULL,
	"url" text,
	"summary_vi" text DEFAULT '' NOT NULL,
	"summary_en" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" varchar(2) NOT NULL,
	"term" varchar(120) NOT NULL,
	"definition_md" text NOT NULL,
	"lesson_slug" varchar(80),
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"risk_profile" varchar(16) NOT NULL,
	"allocation" jsonb NOT NULL,
	"initial_amount" numeric(20, 2) NOT NULL,
	"monthly_contribution" numeric(20, 2) NOT NULL,
	"years" integer NOT NULL,
	"expected_return_pct" numeric(5, 2) NOT NULL,
	"goal_amount" numeric(20, 2),
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_books" (
	"user_id" uuid NOT NULL,
	"book_id" uuid NOT NULL,
	"status" varchar(10) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_books_user_id_book_id_pk" PRIMARY KEY("user_id","book_id")
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "level" varchar(12) DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "investment_plans" ADD CONSTRAINT "investment_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_books" ADD CONSTRAINT "user_books_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "glossary_terms_locale_term_uq" ON "glossary_terms" USING btree ("locale",lower("term"));--> statement-breakpoint
CREATE INDEX "investment_plans_user_updated_idx" ON "investment_plans" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "user_books_book_idx" ON "user_books" USING btree ("book_id");--> statement-breakpoint
-- Cấp độ cho các chương đã có (chương mới do admin / seed tự đặt)
UPDATE "chapters" SET "level" = 'intermediate' WHERE "slug" IN ('quan-ly-rui-ro', 'doc-bao-cao-tai-chinh', 'chi-so-tai-chinh-co-ban', 'risk-and-psychology', 'reading-financial-statements', 'key-financial-ratios');
