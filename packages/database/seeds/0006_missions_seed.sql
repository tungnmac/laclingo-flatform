-- Seed missions for the game
-- Idempotent: uses ON CONFLICT DO NOTHING

INSERT INTO missions (id, title, description, mission_type, period, action_type, target_count, reward_exp, reward_points, is_active)
VALUES
    -- Daily missions
    (gen_random_uuid(), 'Daily Learner', 'Complete 5 vocabulary reviews today', 'daily', 'daily', 'srs_review', 5, 20, 10, true),
    (gen_random_uuid(), 'Quick Exercise', 'Do 3 grammar exercises', 'daily', 'daily', 'grammar_exercise', 3, 15, 5, true),
    (gen_random_uuid(), 'Challenge Seeker', 'Join one challenge game', 'daily', 'daily', 'challenge_participate', 1, 25, 15, true),

    -- Weekly missions
    (gen_random_uuid(), 'Weekly Warrior', 'Complete 30 vocabulary reviews this week', 'weekly', 'weekly', 'srs_review', 30, 100, 50, true),
    (gen_random_uuid(), 'Grammar Master', 'Complete 20 grammar exercises', 'weekly', 'weekly', 'grammar_exercise', 20, 80, 40, true),
    (gen_random_uuid(), 'Champion', 'Win 5 challenge games', 'weekly', 'weekly', 'challenge_win', 5, 150, 75, true),

    -- Monthly missions
    (gen_random_uuid(), 'Monthly Master', 'Complete 100 vocabulary reviews', 'monthly', 'monthly', 'srs_review', 100, 300, 150, true),
    (gen_random_uuid(), 'Grammar Guru', 'Complete 50 grammar exercises', 'monthly', 'monthly', 'grammar_exercise', 50, 250, 125, true),
    (gen_random_uuid(), 'Legend', 'Win 20 challenge games', 'monthly', 'monthly', 'challenge_win', 20, 500, 250, true)
ON CONFLICT DO NOTHING;
