package game

import (
	"context"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

// Repository là tập hàm DB mà game engine cần — tách riêng khỏi
// service.ChallengeRepository vì đây là package khác (state runtime có
// goroutine/concurrency, không phải request/response thuần).
type Repository interface {
	ListGameRoomQuestions(ctx context.Context, roomID pgtype.UUID) ([]db.ListGameRoomQuestionsRow, error)
	StartGameRoom(ctx context.Context, id pgtype.UUID) (db.GameRoom, error)
	FinishGameRoom(ctx context.Context, id pgtype.UUID) (db.GameRoom, error)
	SubmitGameAnswer(ctx context.Context, arg db.SubmitGameAnswerParams) (db.SubmitGameAnswerRow, error)
	GetLeaderboard(ctx context.Context, roomID pgtype.UUID) ([]db.GetLeaderboardRow, error)
	ListGameParticipants(ctx context.Context, roomID pgtype.UUID) ([]db.ListGameParticipantsRow, error)
}

func toPgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}
