ALTER TABLE users DROP COLUMN IF EXISTS streak_date;
CREATE TABLE IF NOT EXISTS sentence_analysis_usage (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0 CHECK (count >= 0),
    PRIMARY KEY (user_id, usage_date)
);
INSERT INTO sentence_analysis_usage (user_id, usage_date, count)
SELECT user_id, usage_date, count FROM feature_usage WHERE feature = 'sentence_analysis'
ON CONFLICT DO NOTHING;
DROP TABLE IF EXISTS feature_usage;
DROP TABLE IF EXISTS user_inventory;
DROP TABLE IF EXISTS subscriptions;
