-- name: GetDialoguesByLesson :many
SELECT d.*, json_agg(dl ORDER BY dl.order_index) as lines
FROM dialogues d
LEFT JOIN dialogue_lines dl ON dl.dialogue_id = d.id
WHERE d.lesson_id = $1
GROUP BY d.id
ORDER BY d.order_index;

-- name: GetDialogueById :one
SELECT d.*, json_agg(dl ORDER BY dl.order_index) as lines
FROM dialogues d
LEFT JOIN dialogue_lines dl ON dl.dialogue_id = d.id
WHERE d.id = $1
GROUP BY d.id;
