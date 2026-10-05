-- name: ListUserDecks :many
SELECT id, user_id, name, description, color, icon, is_public, is_system, created_at, updated_at
FROM user_decks
WHERE user_id = $1
ORDER BY is_system DESC, created_at DESC;

-- name: CreateDeck :one
INSERT INTO user_decks (user_id, name, description, color, icon)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetDeck :one
SELECT * FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: UpdateDeck :one
UPDATE user_decks
SET name = $3, description = $4, color = $5, icon = $6, updated_at = NOW()
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: DeleteDeck :execrows
DELETE FROM user_decks WHERE id = $1 AND user_id = $2;

-- name: AddVocabularyToDeck :execrows
INSERT INTO deck_vocabularies (deck_id, vocabulary_id) VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: RemoveVocabularyFromDeck :execrows
DELETE FROM deck_vocabularies WHERE deck_id = $1 AND vocabulary_id = $2;

-- name: GetDeckVocabularies :many
SELECT v.* FROM vocabularies v
JOIN deck_vocabularies dv ON v.id = dv.vocabulary_id
WHERE dv.deck_id = $1
ORDER BY dv.added_at DESC;
