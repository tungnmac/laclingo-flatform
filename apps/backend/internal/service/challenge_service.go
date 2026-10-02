package service

import (
	"context"
	"errors"
	"math/rand"

	"laclingo-backend/internal/domain"
	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	minQuestionCount       = 1
	maxQuestionCount       = 50
	minTimePerQuestionSecs = 5
	maxTimePerQuestionSecs = 120
	defaultMaxParticipants = 50
	roomCodeLength         = 6
	roomCodeAlphabet       = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // bỏ 0/O/1/I dễ nhầm
	maxCodeGenAttempts     = 5
)

// ChallengeRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type ChallengeRepository interface {
	PickRandomQuestions(ctx context.Context, arg db.PickRandomQuestionsParams) ([]db.ChallengeQuestion, error)
	CreateGameRoom(ctx context.Context, arg db.CreateGameRoomParams) (db.GameRoom, error)
	InsertGameRoomQuestion(ctx context.Context, arg db.InsertGameRoomQuestionParams) error
	GetGameRoomByID(ctx context.Context, id pgtype.UUID) (db.GameRoom, error)
	GetGameRoomByCode(ctx context.Context, code string) (db.GameRoom, error)
	JoinGameRoom(ctx context.Context, arg db.JoinGameRoomParams) (db.GameParticipant, error)
	ListGameParticipants(ctx context.Context, roomID pgtype.UUID) ([]db.ListGameParticipantsRow, error)
	GetLeaderboard(ctx context.Context, roomID pgtype.UUID) ([]db.GetLeaderboardRow, error)
}

type ChallengeService struct {
	repo ChallengeRepository
}

func NewChallengeService(repo ChallengeRepository) *ChallengeService {
	return &ChallengeService{repo: repo}
}

// CreateRoom tạo phòng thử thách mới: chọn ngẫu nhiên đủ số câu hỏi theo bộ lọc
// (thất bại ngay ở đây nếu bank không đủ câu, không để lỗi giữa game), sinh mã
// tham gia, rồi cho host tự tham gia như participant đầu tiên.
func (s *ChallengeService) CreateRoom(ctx context.Context, hostID uuid.UUID, req domain.CreateRoomRequest) (domain.CreateRoomResponse, error) {
	if hostID == uuid.Nil ||
		req.QuestionCount < minQuestionCount || req.QuestionCount > maxQuestionCount ||
		req.TimePerQuestionSeconds < minTimePerQuestionSecs || req.TimePerQuestionSeconds > maxTimePerQuestionSecs {
		return domain.CreateRoomResponse{}, ErrInvalidInput
	}

	var languageID pgtype.Text
	if req.LanguageID != "" {
		languageID = pgtype.Text{String: req.LanguageID, Valid: true}
	}
	var difficulty pgtype.Int4
	if req.Difficulty != 0 {
		difficulty = pgtype.Int4{Int32: req.Difficulty, Valid: true}
	}

	questions, err := s.repo.PickRandomQuestions(ctx, db.PickRandomQuestionsParams{
		LanguageID: languageID,
		Difficulty: difficulty,
		Limit:      req.QuestionCount,
	})
	if err != nil {
		return domain.CreateRoomResponse{}, err
	}
	if int32(len(questions)) < req.QuestionCount {
		// Không đủ câu hỏi theo bộ lọc — thất bại ngay lúc tạo phòng.
		return domain.CreateRoomResponse{}, ErrInvalidInput
	}

	room, err := s.createRoomWithUniqueCode(ctx, hostID, req)
	if err != nil {
		return domain.CreateRoomResponse{}, err
	}

	for i, q := range questions {
		if err := s.repo.InsertGameRoomQuestion(ctx, db.InsertGameRoomQuestionParams{
			RoomID:     room.ID,
			QuestionID: q.ID,
			OrderIndex: int32(i),
		}); err != nil {
			return domain.CreateRoomResponse{}, err
		}
	}

	if _, err := s.repo.JoinGameRoom(ctx, db.JoinGameRoomParams{RoomID: room.ID, UserID: toPgUUID(hostID)}); err != nil {
		return domain.CreateRoomResponse{}, err
	}

	return domain.CreateRoomResponse{
		ID:                     uuid.UUID(room.ID.Bytes),
		Code:                   room.Code,
		Status:                 room.Status,
		QuestionCount:          room.QuestionCount,
		TimePerQuestionSeconds: room.TimePerQuestionSeconds,
		MaxParticipants:        room.MaxParticipants,
	}, nil
}

func (s *ChallengeService) createRoomWithUniqueCode(ctx context.Context, hostID uuid.UUID, req domain.CreateRoomRequest) (db.GameRoom, error) {
	for attempt := 0; attempt < maxCodeGenAttempts; attempt++ {
		room, err := s.repo.CreateGameRoom(ctx, db.CreateGameRoomParams{
			Code:                   generateRoomCode(),
			HostUserID:             toPgUUID(hostID),
			QuestionCount:          req.QuestionCount,
			TimePerQuestionSeconds: req.TimePerQuestionSeconds,
			MaxParticipants:        defaultMaxParticipants,
		})
		if err == nil {
			return room, nil
		}
		if !isPgError(err, pgUniqueViolation) {
			return db.GameRoom{}, err
		}
		// Trùng mã code — thử sinh mã khác
	}
	return db.GameRoom{}, errors.New("không thể sinh mã phòng duy nhất, vui lòng thử lại")
}

// JoinRoom cho user hiện tại tham gia 1 phòng bằng mã.
func (s *ChallengeService) JoinRoom(ctx context.Context, userID uuid.UUID, code string) (domain.ParticipantResponse, error) {
	if userID == uuid.Nil || code == "" {
		return domain.ParticipantResponse{}, ErrInvalidInput
	}

	room, err := s.repo.GetGameRoomByCode(ctx, code)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ParticipantResponse{}, ErrRoomNotFound
	}
	if err != nil {
		return domain.ParticipantResponse{}, err
	}

	participant, err := s.repo.JoinGameRoom(ctx, db.JoinGameRoomParams{RoomID: room.ID, UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		// Insert bị chặn bởi WHERE (status != waiting hoặc đã đủ người) — phân loại
		// lỗi theo status hiện tại của phòng để trả message chính xác cho client.
		switch room.Status {
		case "in_progress":
			return domain.ParticipantResponse{}, ErrGameAlreadyStarted
		case "finished", "cancelled":
			return domain.ParticipantResponse{}, ErrGameFinished
		default:
			return domain.ParticipantResponse{}, ErrRoomFull
		}
	}
	if err != nil {
		return domain.ParticipantResponse{}, err
	}

	return domain.ParticipantResponse{
		RoomID:   uuid.UUID(room.ID.Bytes),
		UserID:   userID,
		Score:    participant.Score,
		JoinedAt: participant.JoinedAt.Time,
	}, nil
}

// GetRoom trả về thông tin phòng + danh sách người tham gia. KHÔNG trả về nội
// dung câu hỏi — câu hỏi chỉ được gửi qua WebSocket đúng lúc broadcast, để REST
// không bị dùng để "nhìn trước" câu hỏi sắp tới.
func (s *ChallengeService) GetRoom(ctx context.Context, roomID uuid.UUID) (domain.RoomDetailResponse, error) {
	room, err := s.repo.GetGameRoomByID(ctx, toPgUUID(roomID))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.RoomDetailResponse{}, ErrRoomNotFound
	}
	if err != nil {
		return domain.RoomDetailResponse{}, err
	}

	rows, err := s.repo.ListGameParticipants(ctx, room.ID)
	if err != nil {
		return domain.RoomDetailResponse{}, err
	}

	participants := make([]domain.ParticipantResponse, 0, len(rows))
	for _, p := range rows {
		participants = append(participants, domain.ParticipantResponse{
			RoomID:    roomID,
			UserID:    uuid.UUID(p.UserID.Bytes),
			Username:  p.Username,
			FullName:  p.FullName.String,
			AvatarURL: p.AvatarUrl.String,
			Score:     p.Score,
			JoinedAt:  p.JoinedAt.Time,
		})
	}

	return domain.RoomDetailResponse{
		ID:                     uuid.UUID(room.ID.Bytes),
		Code:                   room.Code,
		Status:                 room.Status,
		HostUserID:             uuid.UUID(room.HostUserID.Bytes),
		QuestionCount:          room.QuestionCount,
		TimePerQuestionSeconds: room.TimePerQuestionSeconds,
		Participants:           participants,
	}, nil
}

// GetLeaderboard trả về bảng xếp hạng hiện tại của phòng (DB là nguồn sự thật,
// đọc được cả khi không còn ai mở WebSocket).
func (s *ChallengeService) GetLeaderboard(ctx context.Context, roomID uuid.UUID) ([]domain.LeaderboardEntryResponse, error) {
	if _, err := s.repo.GetGameRoomByID(ctx, toPgUUID(roomID)); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrRoomNotFound
		}
		return nil, err
	}

	rows, err := s.repo.GetLeaderboard(ctx, toPgUUID(roomID))
	if err != nil {
		return nil, err
	}

	results := make([]domain.LeaderboardEntryResponse, 0, len(rows))
	for _, r := range rows {
		results = append(results, domain.LeaderboardEntryResponse{
			UserID:    uuid.UUID(r.UserID.Bytes),
			Username:  r.Username,
			FullName:  r.FullName.String,
			AvatarURL: r.AvatarUrl.String,
			Score:     r.Score,
			Rank:      r.Rank,
		})
	}
	return results, nil
}

func generateRoomCode() string {
	b := make([]byte, roomCodeLength)
	for i := range b {
		b[i] = roomCodeAlphabet[rand.Intn(len(roomCodeAlphabet))]
	}
	return string(b)
}
