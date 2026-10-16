ALTER TABLE "lessons" ADD COLUMN "translation_key" varchar(80);--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_locale_translation_key_uq" ON "lessons" USING btree ("locale","translation_key");