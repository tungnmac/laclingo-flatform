-- name: GetActiveExerciseTypes :many
SELECT id, name, description, icon, config, is_active, order_index
FROM exercise_types
WHERE is_active = TRUE
ORDER BY order_index;

-- name: GetExerciseType :one
SELECT id, name, description, icon, config, is_active, order_index
FROM exercise_types
WHERE id = $1;
