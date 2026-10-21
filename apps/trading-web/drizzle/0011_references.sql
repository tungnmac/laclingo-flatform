CREATE TABLE "investors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"country" varchar(2) NOT NULL,
	"birth_year" integer,
	"death_year" integer,
	"photo_url" text,
	"role_vi" varchar(200) DEFAULT '' NOT NULL,
	"role_en" varchar(200) DEFAULT '' NOT NULL,
	"style" varchar(16) NOT NULL,
	"net_worth_usd" bigint,
	"net_worth_as_of" date,
	"net_worth_source_url" text,
	"holdings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"story_vi" text DEFAULT '' NOT NULL,
	"story_en" text DEFAULT '' NOT NULL,
	"milestones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lessons_vi" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lessons_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"provider" varchar(120) DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"type" varchar(12) NOT NULL,
	"language" varchar(2) NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"level" varchar(12) DEFAULT 'basic' NOT NULL,
	"topic" varchar(20) NOT NULL,
	"description_vi" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "investors_slug_uq" ON "investors" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "investors_country_idx" ON "investors" USING btree ("country");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_resources_url_uq" ON "learning_resources" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "learning_resources_title_uq" ON "learning_resources" USING btree (lower(btrim("title")));