DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS user_reminder_settings;
DROP TABLE IF EXISTS reminder_defaults;
ALTER TABLE users DROP COLUMN IF EXISTS last_studied_at;
