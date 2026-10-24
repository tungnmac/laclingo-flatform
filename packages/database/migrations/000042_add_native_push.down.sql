DELETE FROM push_subscriptions WHERE kind = 'fcm';
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS kind;
