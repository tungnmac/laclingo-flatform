CREATE INDEX "lesson_progress_lesson_idx" ON "lesson_progress" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "trades_account_time_id_idx" ON "trades" USING btree ("account_id","executed_at","id");--> statement-breakpoint
CREATE INDEX "trades_order_id_idx" ON "trades" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "trading_accounts_user_created_idx" ON "trading_accounts" USING btree ("user_id","created_at");--> statement-breakpoint
DROP INDEX "trades_account_time_idx";
