ALTER TABLE missions DROP COLUMN IF EXISTS reward_gems;
DROP TABLE IF EXISTS gem_transactions;
DROP INDEX IF EXISTS idx_subscriptions_order;
DROP INDEX IF EXISTS uq_subscriptions_provider_sub;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS order_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS auto_renew;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS provider_customer_id;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS provider_subscription_id;
DROP TABLE IF EXISTS payment_orders;
