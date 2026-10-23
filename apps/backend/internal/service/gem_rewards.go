package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Quà gems chờ nhận: hoàn thành nhiệm vụ (gems admin đặt từng nhiệm vụ), thắng thử thách, lên level (mức do admin
// chỉnh ở reward_settings). Quà nằm trong "Quà chờ nhận" ở Ví — học viên bấm Nhận mới cộng vào số dư (ghi sổ gems).

const (
	GemRewardMission      = "MISSION"
	GemRewardChallengeWin = "CHALLENGE_WIN"
	GemRewardLevelUp      = "LEVEL_UP"

	maxRewardSettingGems = 1000
	// Tối đa số quà thắng thử thách mỗi ngày (giờ VN) — chặn cày gems bằng cách đánh nhiều trận liên tục
	maxChallengeWinRewardsPerDay = 10
	// Mức mặc định = DEFAULT của cột reward_settings (migration 000040) — dùng khi DB chưa có dòng cấu hình
	defaultChallengeWinGems    = 10
	defaultLevelUpGemsPerLevel = 20
)

// lý do ghi sổ gems khi nhận quà
var gemRewardReasons = map[string]string{
	GemRewardMission: "MISSION_REWARD", GemRewardChallengeWin: "CHALLENGE_WIN", GemRewardLevelUp: "LEVEL_UP",
}

// RewardSettings — mức gems thưởng (admin chỉnh)
type RewardSettings struct {
	ChallengeWinGems    int32 `json:"challenge_win_gems" minimum:"0" maximum:"1000" example:"10"`
	LevelUpGemsPerLevel int32 `json:"level_up_gems_per_level" minimum:"0" maximum:"1000" example:"20"` // lên level N nhận N × số này
}

func toRewardSettings(r db.RewardSetting) RewardSettings {
	return RewardSettings{ChallengeWinGems: r.ChallengeWinGems, LevelUpGemsPerLevel: r.LevelUpGemsPerLevel}
}

// rewardSettingsQuerier — đọc mức thưởng (repo hoặc *db.Queries trong transaction)
type rewardSettingsQuerier interface {
	GetRewardSettings(ctx context.Context) (db.RewardSetting, error)
}

// loadRewardSettings — chưa có dòng cấu hình (DB cũ) thì dùng mặc định của migration
func loadRewardSettings(ctx context.Context, q rewardSettingsQuerier) (RewardSettings, error) {
	r, err := q.GetRewardSettings(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return RewardSettings{ChallengeWinGems: defaultChallengeWinGems, LevelUpGemsPerLevel: defaultLevelUpGemsPerLevel}, nil
	}
	if err != nil {
		return RewardSettings{}, err
	}
	return toRewardSettings(r), nil
}

// levelUpGems — tổng gems khi lên từ level `from` tới `to`: mỗi level mới L đạt được nhận L × perLevel
func levelUpGems(from, to, perLevel int32) int32 {
	var total int32
	for l := from + 1; l <= to; l++ {
		total += l * perLevel
	}
	return total
}

// gemRewardCreator — tạo quà (repo hoặc *db.Queries trong transaction)
type gemRewardCreator interface {
	CreateGemReward(ctx context.Context, arg db.CreateGemRewardParams) (db.GemReward, error)
}

// createGemReward — thêm 1 quà chờ nhận; amount ≤ 0 → bỏ qua (mức thưởng = 0 là tắt)
func createGemReward(ctx context.Context, q gemRewardCreator, userID pgtype.UUID, source string, amount int32, note string) error {
	if amount <= 0 {
		return nil
	}
	_, err := q.CreateGemReward(ctx, db.CreateGemRewardParams{UserID: userID, Source: source, Amount: amount, Note: note})
	return err
}

// ===== Admin: mức thưởng =====

func (s *MissionService) GetRewardSettings(ctx context.Context) (RewardSettings, error) {
	return loadRewardSettings(ctx, s.repo)
}

// UpdateRewardSettingsRequest — phải gửi đủ cả 2 mức (thiếu 1 trường không được ngầm thành 0 = tắt thưởng)
type UpdateRewardSettingsRequest struct {
	ChallengeWinGems    *int32 `json:"challenge_win_gems" minimum:"0" maximum:"1000" example:"10"`
	LevelUpGemsPerLevel *int32 `json:"level_up_gems_per_level" minimum:"0" maximum:"1000" example:"20"`
}

func (s *MissionService) UpdateRewardSettings(ctx context.Context, req UpdateRewardSettingsRequest) (RewardSettings, error) {
	if req.ChallengeWinGems == nil || req.LevelUpGemsPerLevel == nil {
		return RewardSettings{}, fmt.Errorf("cần đủ challenge_win_gems và level_up_gems_per_level: %w", ErrInvalidInput)
	}
	win, level := *req.ChallengeWinGems, *req.LevelUpGemsPerLevel
	if win < 0 || win > maxRewardSettingGems || level < 0 || level > maxRewardSettingGems {
		return RewardSettings{}, fmt.Errorf("mức gems phải từ 0 đến %d: %w", maxRewardSettingGems, ErrInvalidInput)
	}
	r, err := s.repo.UpdateRewardSettings(ctx, db.UpdateRewardSettingsParams{ChallengeWinGems: win, LevelUpGemsPerLevel: level})
	if err != nil {
		return RewardSettings{}, err
	}
	return toRewardSettings(r), nil
}

// rewardChallengeWin — quà thắng thử thách (gọi từ RecordAction "challenge_win"); lỗi chỉ ảnh hưởng quà, không chặn
// phần nhiệm vụ
func (s *MissionService) rewardChallengeWin(ctx context.Context, userID uuid.UUID, wins int32) error {
	settings, err := loadRewardSettings(ctx, s.repo)
	if err != nil || settings.ChallengeWinGems <= 0 {
		return err
	}
	// Đầu ngày hôm nay theo giờ VN (cùng mốc ngày với lượt dùng / chuỗi ngày học)
	dayStart, _ := time.ParseInLocation(dailyDateLayout, localDate(s.now(), defaultDailyTimezone), vnpayLocation)
	got, err := s.repo.CountGemRewardsSince(ctx, db.CountGemRewardsSinceParams{
		UserID: toPgUUID(userID), Source: GemRewardChallengeWin, Since: pgtype.Timestamptz{Time: dayStart, Valid: true},
	})
	if err != nil || got >= maxChallengeWinRewardsPerDay {
		return err // đủ quà thắng của hôm nay — vẫn tính nhiệm vụ, chỉ không thêm gems
	}
	amount := settings.ChallengeWinGems * wins
	if err := createGemReward(ctx, s.repo, toPgUUID(userID), GemRewardChallengeWin, amount, "Thắng thử thách"); err != nil {
		return err
	}
	s.notifier.Notify(ctx, userID, NotificationInput{
		Type: NotificationGemReward, Icon: "🏆", URL: "/wallet",
		Title: fmt.Sprintf("Thắng thử thách: +%d gems", amount), Body: "Quà đang chờ bạn nhận ở Ví.",
	})
	return nil
}

// ===== Học viên: xem / nhận quà =====

type GemRewardInfo struct {
	ID        uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Source    string    `json:"source" enums:"MISSION,CHALLENGE_WIN,LEVEL_UP"`
	Amount    int32     `json:"amount"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}

// PendingRewardsResponse — quà chờ nhận + mức thưởng hiện tại (hiển thị "Cách kiếm gems")
type PendingRewardsResponse struct {
	Items    []GemRewardInfo `json:"items"`
	Count    int32           `json:"count"`
	Total    int32           `json:"total"` // tổng gems chờ nhận
	Settings RewardSettings  `json:"settings"`
}

func (s *PaymentService) PendingRewards(ctx context.Context, userID uuid.UUID) (PendingRewardsResponse, error) {
	rows, err := s.repo.ListPendingGemRewards(ctx, toPgUUID(userID))
	if err != nil {
		return PendingRewardsResponse{}, err
	}
	sum, err := s.repo.CountPendingGemRewards(ctx, toPgUUID(userID))
	if err != nil {
		return PendingRewardsResponse{}, err
	}
	settings, err := loadRewardSettings(ctx, s.repo)
	if err != nil {
		return PendingRewardsResponse{}, err
	}
	out := PendingRewardsResponse{Items: make([]GemRewardInfo, 0, len(rows)), Count: sum.Count, Total: sum.Total, Settings: settings}
	for _, r := range rows {
		out.Items = append(out.Items, GemRewardInfo{ID: uuid.UUID(r.ID.Bytes), Source: r.Source, Amount: r.Amount, Note: r.Note, CreatedAt: r.CreatedAt.Time})
	}
	return out, nil
}

// creditRewards — cộng các quà vừa đánh dấu đã nhận vào ví (cùng transaction): 1 lần cộng tổng, mỗi quà 1 dòng sổ
// (số dư sau từng dòng tính lần lượt). Trả tổng gems đã cộng.
func creditRewards(ctx context.Context, qtx *db.Queries, userID pgtype.UUID, rewards []db.GemReward) (int32, error) {
	var total int32
	for _, r := range rewards {
		total += r.Amount
	}
	if total == 0 {
		return 0, nil
	}
	if err := qtx.EnsureUserInventory(ctx, userID); err != nil {
		return 0, err
	}
	final, err := qtx.AddGems(ctx, db.AddGemsParams{UserID: userID, Delta: total})
	if err != nil {
		return 0, err
	}
	balance := final - total
	for _, r := range rewards {
		balance += r.Amount
		if err := qtx.InsertGemTransaction(ctx, db.InsertGemTransactionParams{
			UserID: userID, Delta: r.Amount, BalanceAfter: balance, Reason: gemRewardReasons[r.Source], Note: r.Note,
		}); err != nil {
			return 0, err
		}
	}
	return total, nil
}

// ClaimReward — nhận 1 quà (đã nhận / không phải của mình → ErrNotFound)
func (s *PaymentService) ClaimReward(ctx context.Context, userID, rewardID uuid.UUID) (WalletResponse, error) {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return WalletResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	r, err := qtx.ClaimGemReward(ctx, db.ClaimGemRewardParams{ID: toPgUUID(rewardID), UserID: toPgUUID(userID)})
	if errors.Is(err, pgx.ErrNoRows) {
		return WalletResponse{}, ErrNotFound
	}
	if err != nil {
		return WalletResponse{}, err
	}
	claimed, err := creditRewards(ctx, qtx, toPgUUID(userID), []db.GemReward{r})
	if err != nil {
		return WalletResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return WalletResponse{}, err
	}
	w, err := s.Wallet(ctx, userID)
	w.Claimed = claimed
	return w, err
}

// ClaimAllRewards — nhận mọi quà đang chờ
func (s *PaymentService) ClaimAllRewards(ctx context.Context, userID uuid.UUID) (WalletResponse, error) {
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return WalletResponse{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	rows, err := qtx.ClaimAllGemRewards(ctx, toPgUUID(userID))
	if err != nil {
		return WalletResponse{}, err
	}
	claimed, err := creditRewards(ctx, qtx, toPgUUID(userID), rows)
	if err != nil {
		return WalletResponse{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return WalletResponse{}, err
	}
	w, err := s.Wallet(ctx, userID)
	w.Claimed = claimed
	return w, err
}
