-- name: PickRandomQuestions :many
SELECT * FROM challenge_questions
WHERE (sqlc.narg('language_id')::varchar IS NULL OR language_id = sqlc.narg('language_id'))
  AND (sqlc.narg('difficulty')::int IS NULL OR difficulty = sqlc.narg('difficulty'))
ORDER BY random()
LIMIT sqlc.arg('limit');

-- name: CreateGameRoom :one
INSERT INTO game_rooms (code, host_user_id, question_count, time_per_question_seconds, max_participants)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: InsertGameRoomQuestion :exec
INSERT INTO game_room_questions (room_id, question_id, order_index)
VALUES ($1, $2, $3);

-- name: ListGameRoomQuestions :many
SELECT grq.order_index, cq.id, cq.language_id, cq.question, cq.options, cq.correct_index,
       cq.explanation, cq.difficulty, cq.created_at
FROM game_room_questions grq
JOIN challenge_questions cq ON cq.id = grq.question_id
WHERE grq.room_id = $1
ORDER BY grq.order_index;

-- name: GetGameRoomByID :one
SELECT * FROM game_rooms WHERE id = $1;

-- name: GetGameRoomByCode :one
SELECT * FROM game_rooms WHERE code = $1;

-- name: StartGameRoom :one
UPDATE game_rooms
SET status = 'in_progress', started_at = NOW()
WHERE id = $1 AND status = 'waiting'
RETURNING *;

-- name: FinishGameRoom :one
UPDATE game_rooms
SET status = 'finished', finished_at = NOW()
WHERE id = $1 AND status = 'in_progress'
RETURNING *;

-- name: JoinGameRoom :one
-- Atomic: kiểm tra phòng còn "waiting" + chưa đủ người trong CÙNG 1 statement với
-- insert, để tránh race khi 2 người join đúng slot cuối cùng cùng lúc.
INSERT INTO game_participants (room_id, user_id)
SELECT gr.id, sqlc.arg('user_id')
FROM game_rooms gr
WHERE gr.id = sqlc.arg('room_id')
  AND gr.status = 'waiting'
  AND (SELECT COUNT(*) FROM game_participants p WHERE p.room_id = gr.id) < gr.max_participants
ON CONFLICT (room_id, user_id) DO UPDATE SET room_id = EXCLUDED.room_id
RETURNING *;

-- name: ListGameParticipants :many
SELECT p.id, p.room_id, p.user_id, p.score, p.joined_at,
       u.username, u.full_name, u.avatar_url
FROM game_participants p
JOIN users u ON u.id = p.user_id
WHERE p.room_id = $1
ORDER BY p.joined_at;

-- name: GetGameParticipantByUser :one
SELECT * FROM game_participants WHERE room_id = $1 AND user_id = $2;

-- name: GetLeaderboard :many
SELECT p.id AS participant_id, p.user_id, u.username, u.full_name, u.avatar_url, p.score,
       RANK() OVER (ORDER BY p.score DESC, p.joined_at ASC) AS rank
FROM game_participants p
JOIN users u ON u.id = p.user_id
WHERE p.room_id = $1
ORDER BY p.score DESC, p.joined_at ASC;

-- name: SubmitGameAnswer :one
-- Atomic: insert câu trả lời + cộng điểm participant trong 1 statement (CTE),
-- tránh cần transaction Go riêng. Nếu đã trả lời câu này rồi (ON CONFLICT DO
-- NOTHING) thì không có row nào -> pgx.ErrNoRows ở phía Go.
WITH ins AS (
    INSERT INTO game_answers (room_id, participant_id, question_id, selected_index, is_correct, points_earned, time_taken_ms)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (participant_id, question_id) DO NOTHING
    RETURNING *
), upd AS (
    UPDATE game_participants gp
    SET score = gp.score + ins.points_earned
    FROM ins
    WHERE gp.id = ins.participant_id
    RETURNING gp.score
)
SELECT ins.id, ins.room_id, ins.participant_id, ins.question_id, ins.selected_index,
       ins.is_correct, ins.points_earned, ins.time_taken_ms, ins.answered_at,
       upd.score AS new_total_score
FROM ins JOIN upd ON true;
