package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"laclingo-backend/internal/leveling"
	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// MissionRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu. BeginTx +
// WithTx (promoted từ *db.Queries) dùng để chạy RecordAction trong 1
// transaction thật — cộng progress + reward phải atomic.
type MissionRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
	CreateMission(ctx context.Context, arg db.CreateMissionParams) (db.Mission, error)
	ListAllMissions(ctx context.Context) ([]db.Mission, error)
	GetMissionByID(ctx context.Context, id pgtype.UUID) (db.Mission, error)
	UpdateMission(ctx context.Context, arg db.UpdateMissionParams) (db.Mission, error)
	DeactivateMission(ctx context.Context, id pgtype.UUID) error
	ListActiveMissionsByAction(ctx context.Context, actionType string) ([]db.Mission, error)
	ListMissionsWithProgress(ctx context.Context, userID pgtype.UUID) ([]db.ListMissionsWithProgressRow, error)
}

var validMissionPeriods = map[string]bool{"daily": true, "weekly": true, "monthly": true, "event": true}
var validMissionActions = map[string]bool{
	"srs_review": true, "learn_word": true, "grammar_exercise": true,
	"challenge_participate": true, "challenge_win": true, "listening_practice": true,
}

// MissionRequest — body chung cho tạo/sửa nhiệm vụ (admin). StartsAt/EndsAt
// chỉ bắt buộc khi Period = "event".
type MissionRequest struct {
	Title        string     `json:"title" example:"Ôn tập 10 từ hôm nay"`
	Description  string     `json:"description,omitempty"`
	Period       string     `json:"period" example:"daily" enums:"daily,weekly,monthly,event"`
	ActionType   string     `json:"action_type" example:"srs_review" enums:"srs_review,learn_word,grammar_exercise,challenge_participate,challenge_win,listening_practice"`
	TargetCount  int32      `json:"target_count" minimum:"1" example:"10"`
	RewardExp    int32      `json:"reward_exp" minimum:"0" example:"50"`
	RewardPoints int32      `json:"reward_points" minimum:"0" example:"10"`
	StartsAt     *time.Time `json:"starts_at,omitempty"`
	EndsAt       *time.Time `json:"ends_at,omitempty"`
	IsActive     *bool      `json:"is_active,omitempty"`
}

// MissionResponse — nhiệm vụ nhìn từ phía admin (không kèm tiến độ user)
type MissionResponse struct {
	ID           uuid.UUID  `json:"id" swaggertype:"string" format:"uuid"`
	Title        string     `json:"title"`
	Description  string     `json:"description,omitempty"`
	Period       string     `json:"period"`
	ActionType   string     `json:"action_type"`
	TargetCount  int32      `json:"target_count"`
	RewardExp    int32      `json:"reward_exp"`
	RewardPoints int32      `json:"reward_points"`
	StartsAt     *time.Time `json:"starts_at,omitempty"`
	EndsAt       *time.Time `json:"ends_at,omitempty"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
}

// MyMissionResponse — nhiệm vụ nhìn từ phía learner, kèm tiến độ của họ
// trong kỳ hiện tại (progress_count/completed reset tự nhiên theo period_key).
type MyMissionResponse struct {
	ID            uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title         string    `json:"title"`
	Description   string    `json:"description,omitempty"`
	Period        string    `json:"period"`
	ActionType    string    `json:"action_type"`
	TargetCount   int32     `json:"target_count"`
	RewardExp     int32     `json:"reward_exp"`
	RewardPoints  int32     `json:"reward_points"`
	ProgressCount int32     `json:"progress_count"`
	Completed     bool      `json:"completed"`
}

type MissionService struct {
	repo MissionRepository
	now  func() time.Time
}

func NewMissionService(repo MissionRepository) *MissionService {
	return &MissionService{repo: repo, now: time.Now}
}

// periodKey tính "kỳ" hiện tại của 1 mission — PHẢI khớp byte-for-byte với
// CASE trong query ListMissionsWithProgress (packages/database/queries/missions.sql):
// daily=YYYY-MM-DD, weekly=ISO year + "W" + ISO week (2 chữ số), monthly=YYYY-MM,
// event=chính UUID của mission (một mission event chỉ có đúng 1 "kỳ" duy nhất).
func periodKey(period string, missionID uuid.UUID, now time.Time) string {
	switch period {
	case "daily":
		return now.Format("2006-01-02")
	case "weekly":
		isoYear, isoWeek := now.ISOWeek()
		return fmt.Sprintf("%04d-W%02d", isoYear, isoWeek)
	case "monthly":
		return now.Format("2006-01")
	default: // event
		return missionID.String()
	}
}

func validateMissionRequest(req MissionRequest) error {
	if req.Title == "" || !validMissionPeriods[req.Period] || !validMissionActions[req.ActionType] || req.TargetCount <= 0 {
		return ErrInvalidInput
	}
	if req.Period == "event" && (req.StartsAt == nil || req.EndsAt == nil || !req.EndsAt.After(*req.StartsAt)) {
		return ErrInvalidInput
	}
	return nil
}

func toTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

func fromTimestamptz(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	return &t.Time
}

func toMissionResponse(m db.Mission) MissionResponse {
	return MissionResponse{
		ID:           uuid.UUID(m.ID.Bytes),
		Title:        m.Title,
		Description:  m.Description.String,
		Period:       m.Period,
		ActionType:   m.ActionType,
		TargetCount:  m.TargetCount,
		RewardExp:    m.RewardExp,
		RewardPoints: m.RewardPoints,
		StartsAt:     fromTimestamptz(m.StartsAt),
		EndsAt:       fromTimestamptz(m.EndsAt),
		IsActive:     m.IsActive,
		CreatedAt:    m.CreatedAt.Time,
	}
}

// CreateMission tạo nhiệm vụ mới — chỉ admin gọi được (gate ở handler).
func (s *MissionService) CreateMission(ctx context.Context, createdBy uuid.UUID, req MissionRequest) (MissionResponse, error) {
	if err := validateMissionRequest(req); err != nil {
		return MissionResponse{}, err
	}

	m, err := s.repo.CreateMission(ctx, db.CreateMissionParams{
		Title:        req.Title,
		Description:  pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Period:       req.Period,
		ActionType:   req.ActionType,
		TargetCount:  req.TargetCount,
		RewardExp:    req.RewardExp,
		RewardPoints: req.RewardPoints,
		StartsAt:     toTimestamptz(req.StartsAt),
		EndsAt:       toTimestamptz(req.EndsAt),
		CreatedBy:    toPgUUID(createdBy),
	})
	if err != nil {
		return MissionResponse{}, err
	}
	return toMissionResponse(m), nil
}

// ListAllMissions trả về mọi nhiệm vụ (kể cả đã tắt) — dành cho admin quản lý.
func (s *MissionService) ListAllMissions(ctx context.Context) ([]MissionResponse, error) {
	missions, err := s.repo.ListAllMissions(ctx)
	if err != nil {
		return nil, err
	}
	results := make([]MissionResponse, 0, len(missions))
	for _, m := range missions {
		results = append(results, toMissionResponse(m))
	}
	return results, nil
}

// UpdateMission sửa toàn bộ thông tin 1 nhiệm vụ (kể cả is_active).
func (s *MissionService) UpdateMission(ctx context.Context, id uuid.UUID, req MissionRequest) (MissionResponse, error) {
	if err := validateMissionRequest(req); err != nil {
		return MissionResponse{}, err
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	m, err := s.repo.UpdateMission(ctx, db.UpdateMissionParams{
		ID:           toPgUUID(id),
		Title:        req.Title,
		Description:  pgtype.Text{String: req.Description, Valid: req.Description != ""},
		Period:       req.Period,
		ActionType:   req.ActionType,
		TargetCount:  req.TargetCount,
		RewardExp:    req.RewardExp,
		RewardPoints: req.RewardPoints,
		StartsAt:     toTimestamptz(req.StartsAt),
		EndsAt:       toTimestamptz(req.EndsAt),
		IsActive:     isActive,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return MissionResponse{}, ErrNotFound
	}
	if err != nil {
		return MissionResponse{}, err
	}
	return toMissionResponse(m), nil
}

// DeactivateMission xoá mềm (is_active=false) — giữ lại lịch sử progress.
func (s *MissionService) DeactivateMission(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeactivateMission(ctx, toPgUUID(id))
}

// ListMyMissions trả về nhiệm vụ đang active kèm tiến độ của user hiện tại
// trong kỳ hiện tại (DB tự tính period_key khớp logic Go qua CASE trong query).
func (s *MissionService) ListMyMissions(ctx context.Context, userID uuid.UUID) ([]MyMissionResponse, error) {
	rows, err := s.repo.ListMissionsWithProgress(ctx, toPgUUID(userID))
	if err != nil {
		return nil, err
	}
	results := make([]MyMissionResponse, 0, len(rows))
	for _, r := range rows {
		results = append(results, MyMissionResponse{
			ID:            uuid.UUID(r.ID.Bytes),
			Title:         r.Title,
			Description:   r.Description.String,
			Period:        r.Period,
			ActionType:    r.ActionType,
			TargetCount:   r.TargetCount,
			RewardExp:     r.RewardExp,
			RewardPoints:  r.RewardPoints,
			ProgressCount: r.ProgressCount,
			Completed:     r.CompletedAt.Valid,
		})
	}
	return results, nil
}

// RecordAction ghi nhận 1 hành động (actionType) của user — cộng thêm
// `amount` vào progress của MỌI nhiệm vụ active khớp action này, và nếu vừa
// chạm target lần đầu trong kỳ hiện tại thì cộng thưởng EXP/point + tính lại
// level. Gọi từ SRSService (srs_review/learn_word), endpoint submit bài tập
// ngữ pháp (grammar_exercise), và internal/game.Room.finishGame (qua
// game.MissionRecorder interface, challenge_participate/challenge_win).
func (s *MissionService) RecordAction(ctx context.Context, userID uuid.UUID, actionType string, amount int32) error {
	if userID == uuid.Nil || amount <= 0 {
		return ErrInvalidInput
	}

	missions, err := s.repo.ListActiveMissionsByAction(ctx, actionType)
	if err != nil {
		return err
	}

	now := s.now().UTC()
	for _, m := range missions {
		if err := s.applyMissionProgress(ctx, userID, m, amount, now); err != nil {
			return err
		}
	}
	return nil
}

// applyMissionProgress xử lý 1 mission trong transaction riêng — lỗi/hoàn
// thành của 1 mission không ảnh hưởng tới các mission khác trong cùng RecordAction.
func (s *MissionService) applyMissionProgress(ctx context.Context, userID uuid.UUID, mission db.Mission, amount int32, now time.Time) error {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	progress, err := qtx.UpsertMissionProgress(ctx, db.UpsertMissionProgressParams{
		UserID:        toPgUUID(userID),
		MissionID:     mission.ID,
		PeriodKey:     periodKey(mission.Period, uuid.UUID(mission.ID.Bytes), now),
		ProgressCount: amount,
	})
	if err != nil {
		return err
	}

	if progress.ProgressCount < mission.TargetCount {
		return tx.Commit(ctx)
	}

	if _, err := qtx.MarkMissionProgressCompleted(ctx, progress.ID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Đã hoàn thành (và được cộng thưởng) từ trước trong kỳ này — bỏ qua.
			return tx.Commit(ctx)
		}
		return err
	}

	user, err := qtx.GetUserByID(ctx, toPgUUID(userID))
	if err != nil {
		return err
	}
	newLevel := leveling.LevelForExp(user.Exp + int64(mission.RewardExp))

	if _, err := qtx.AddUserRewards(ctx, db.AddUserRewardsParams{
		ExpDelta:    int64(mission.RewardExp),
		PointsDelta: int64(mission.RewardPoints),
		Level:       newLevel,
		ID:          toPgUUID(userID),
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
