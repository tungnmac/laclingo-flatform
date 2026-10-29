ALTER TABLE "books" ADD COLUMN "title_vi" varchar(200);--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Giá trị tạm (chưa bỏ dấu) cho sách đã có — npm run seed:library tính lại bằng foldText
UPDATE "books" SET "search_text" = lower("title" || ' ' || "author") WHERE "search_text" = '';
