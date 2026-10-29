package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// LacLingo Pro (xem docs chiến lược kinh doanh): gói Free giới hạn lượt dùng mỗi ngày, Pro dùng không giới hạn
// (riêng phân tích câu bằng AI vẫn có trần vì tốn phí AI) và được tặng Streak Freeze mỗi tháng. Mọi học viên dùng được
// Streak Freeze (mua bằng gems ở ví); Pro được nạp thêm đầu mỗi tháng. Gói mua qua VNPay/Stripe (payment_service.go)
// hoặc admin cấp tay (payment_provider = ADMIN).
// Ngày tính lượt + chuỗi ngày học theo giờ Việt Nam cố định (học viên không đổi múi giờ để "sang ngày mới").

const (
	FeatureSRSReview        = "srs_review"
	FeatureSpeaking         = "speaking"
	FeatureSentenceAnalysis = "sentence_analysis"

	PlanMonthly  = "MONTHLY"
	PlanYearly   = "YEARLY"
	PlanLifetime = "LIFETIME"

	// Số Streak Freeze Pro được nạp đầu mỗi tháng (nạp lên tối thiểu số này, không cộng dồn)
	ProStreakFreezesPerMonth = 2
)

// Giới hạn lượt/ngày theo gói — 0 = không giới hạn
var (
	freeDailyLimits = map[string]int{FeatureSRSReview: 15, FeatureSpeaking: 10, FeatureSentenceAnalysis: 5}
	proDailyLimits  = map[string]int{FeatureSRSReview: 0, FeatureSpeaking: 0, FeatureSentenceAnalysis: 30}
	billingFeatures = []string{FeatureSRSReview, FeatureSpeaking, FeatureSentenceAnalysis}
)

func dailyLimit(feature string, pro bool) int {
	if pro {
		return proDailyLimits[feature]
	}
	return freeDailyLimits[feature]
}

var limitFeatureNames = map[string]string{
	FeatureSRSReview: "lượt ôn từ vựng", FeatureSpeaking: "lượt luyện nói", FeatureSentenceAnalysis: "lượt phân tích câu",
}

// LimitError — hết lượt dùng hôm nay. Free → handler trả 402 + code "pro_required" (FE hiện màn nâng cấp Pro);
// Pro (vd phân tích câu) → 429.
type LimitError struct {
	Feature string
	Limit   int
	Pro     bool
}

func (e *LimitError) Error() string {
	name := limitFeatureNames[e.Feature]
	if e.Pro {
		return fmt.Sprintf("bạn đã dùng hết %d %s hôm nay, quay lại vào ngày mai nhé", e.Limit, name)
	}
	return fmt.Sprintf("gói Free có %d %s mỗi ngày — nâng cấp LacLingo Pro để dùng không giới hạn", e.Limit, name)
}

type BillingRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetActiveSubscription(ctx context.Context, userID pgtype.UUID) (db.Subscription, error)
	UseFeatureQuota(ctx context.Context, arg db.UseFeatureQuotaParams) (int32, error)
	RefundFeatureQuota(ctx context.Context, arg db.RefundFeatureQuotaParams) error
	GetFeatureUsage(ctx context.Context, arg db.GetFeatureUsageParams) (int32, error)
	EnsureUserInventory(ctx context.Context, userID pgtype.UUID) error
	GetUserInventory(ctx context.Context, userID pgtype.UUID) (db.UserInventory, error)
	RefillStreakFreezes(ctx context.Context, arg db.RefillStreakFreezesParams) error
	GetUserStreak(ctx context.Context, id pgtype.UUID) (db.GetUserStreakRow, error)
	GetUserPlanFlags(ctx context.Context, id pgtype.UUID) (db.GetUserPlanFlagsRow, error)
}

type PlanService struct {
	repo BillingRepository
	now  func() time.Time
}

func NewPlanService(repo BillingRepository) *PlanService {
	return &PlanService{repo: repo, now: time.Now}
}

func (s *PlanService) today() pgtype.Date {
	d, _ := pgDate(localDate(s.now(), defaultDailyTimezone))
	return d
}

// SubscriptionInfo — gói đang hiệu lực
type SubscriptionInfo struct {
	ID        uuid.UUID  `json:"id" swaggertype:"string" format:"uuid"`
	Plan      string     `json:"plan" enums:"MONTHLY,YEARLY,LIFETIME"`
	StartsAt  time.Time  `json:"starts_at"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"` // nil = trọn đời
	Provider  string     `json:"payment_provider" example:"ADMIN"`
	Note      string     `json:"note,omitempty"`
	AutoRenew bool       `json:"auto_renew"` // Stripe tự gia hạn mỗi kỳ (huỷ → hết kỳ mới về Free)
}

func toSubscriptionInfo(sub db.Subscription) *SubscriptionInfo {
	out := &SubscriptionInfo{
		ID: uuid.UUID(sub.ID.Bytes), Plan: sub.Plan, StartsAt: sub.StartsAt.Time, Provider: sub.PaymentProvider, Note: sub.Note,
		AutoRenew: sub.AutoRenew,
	}
	if sub.ExpiresAt.Valid {
		t := sub.ExpiresAt.Time
		out.ExpiresAt = &t
	}
	return out
}

// activeSubscription — gói đang hiệu lực (nil = Free)
func (s *PlanService) activeSubscription(ctx context.Context, userID uuid.UUID) (*SubscriptionInfo, error) {
	sub, err := s.repo.GetActiveSubscription(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return toSubscriptionInfo(sub), nil
}

// isPro — có gói đang hiệu lực, hoặc là admin/owner (nhân viên dùng không giới hạn để vận hành/kiểm thử)
func (s *PlanService) isPro(ctx context.Context, userID uuid.UUID) (pro, staff bool, sub *SubscriptionInfo, err error) {
	u, err := s.repo.GetUserByID(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return false, false, nil, ErrNotFound
	}
	if err != nil {
		return false, false, nil, err
	}
	sub, err = s.activeSubscription(ctx, userID)
	if err != nil {
		return false, false, nil, err
	}
	staff = u.Role == "admin" || u.Role == "owner"
	return sub != nil || staff, staff, sub, nil
}

// IsPro — có gói đang hiệu lực hoặc là admin/owner. 1 câu SQL (gọi mỗi lượt ôn / luyện nói).
func (s *PlanService) IsPro(ctx context.Context, userID uuid.UUID) (bool, error) {
	f, err := s.repo.GetUserPlanFlags(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return false, ErrNotFound
	}
	if err != nil {
		return false, err
	}
	return f.HasSubscription || f.Role == "admin" || f.Role == "owner", nil
}

// Reserve trừ 1 lượt dùng tính năng hôm nay (hết lượt → *LimitError). refund trả lại lượt khi thao tác sau đó lỗi
// (gọi được cả khi ctx của request đã huỷ). Tính năng không giới hạn với gói hiện tại → không ghi gì.
func (s *PlanService) Reserve(ctx context.Context, userID uuid.UUID, feature string) (refund func(), err error) {
	noop := func() {}
	pro, err := s.IsPro(ctx, userID)
	if err != nil {
		return noop, err
	}
	limit := dailyLimit(feature, pro)
	if limit <= 0 {
		return noop, nil
	}
	date := s.today()
	_, err = s.repo.UseFeatureQuota(ctx, db.UseFeatureQuotaParams{UserID: toPgUUID(userID), Feature: feature, UsageDate: date, DailyLimit: int32(limit)})
	if errors.Is(err, pgx.ErrNoRows) {
		return noop, &LimitError{Feature: feature, Limit: limit, Pro: pro}
	}
	if err != nil {
		return noop, err
	}
	return func() {
		rctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		defer cancel()
		if err := s.repo.RefundFeatureQuota(rctx, db.RefundFeatureQuotaParams{UserID: toPgUUID(userID), Feature: feature, UsageDate: date}); err != nil {
			log.Printf("❌ billing: hoàn lượt %s user=%s: %v", feature, userID, err)
		}
	}, nil
}

// FeatureUsage — lượt đã dùng hôm nay của 1 tính năng
type FeatureUsage struct {
	Feature string `json:"feature" enums:"srs_review,speaking,sentence_analysis"`
	Used    int    `json:"used"`
	Limit   int    `json:"limit"` // 0 = không giới hạn
	Pro     bool   `json:"pro"`
}

// Usage — lượt đã dùng + giới hạn hôm nay của 1 tính năng
func (s *PlanService) Usage(ctx context.Context, userID uuid.UUID, feature string) (FeatureUsage, error) {
	pro, err := s.IsPro(ctx, userID)
	if err != nil {
		return FeatureUsage{}, err
	}
	return s.usage(ctx, userID, feature, pro)
}

func (s *PlanService) usage(ctx context.Context, userID uuid.UUID, feature string, pro bool) (FeatureUsage, error) {
	used, err := s.repo.GetFeatureUsage(ctx, db.GetFeatureUsageParams{UserID: toPgUUID(userID), Feature: feature, UsageDate: s.today()})
	if err != nil {
		return FeatureUsage{}, err
	}
	return FeatureUsage{Feature: feature, Used: int(used), Limit: dailyLimit(feature, pro), Pro: pro}, nil
}

// PlanStatus — gói hiện tại + lượt dùng hôm nay + vật phẩm (GET /billing/me)
type PlanStatus struct {
	IsPro         bool              `json:"is_pro"`
	Staff         bool              `json:"staff"` // admin/owner: dùng như Pro, không cần gói
	Subscription  *SubscriptionInfo `json:"subscription,omitempty"`
	Usage         []FeatureUsage    `json:"usage"`
	StreakFreezes int32             `json:"streak_freezes"`
	Gems          int32             `json:"gems"`
}

func (s *PlanService) Status(ctx context.Context, userID uuid.UUID) (PlanStatus, error) {
	pro, staff, sub, err := s.isPro(ctx, userID)
	if err != nil {
		return PlanStatus{}, err
	}
	out := PlanStatus{IsPro: pro, Staff: staff, Subscription: sub, Usage: make([]FeatureUsage, 0, len(billingFeatures))}
	for _, f := range billingFeatures {
		u, err := s.usage(ctx, userID, f, pro)
		if err != nil {
			return PlanStatus{}, err
		}
		out.Usage = append(out.Usage, u)
	}
	// Chỉ đọc: nạp freeze đầu tháng chỉ xảy ra khi học (TouchStreak), để ngày nghỉ cuối tháng trước không được bù
	// bằng phần của tháng mới chỉ vì học viên mở trang gói trước. Hiển thị gồm cả phần tháng này sắp được nạp.
	inv, err := s.storedInventory(ctx, userID)
	if err != nil {
		return PlanStatus{}, err
	}
	out.StreakFreezes, out.Gems = availableFreezes(inv, pro, s.monthStart()), inv.Gems
	return out, nil
}

func (s *PlanService) monthStart() pgtype.Date {
	t := s.today().Time
	return pgtype.Date{Time: time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.UTC), Valid: true}
}

// availableFreezes — số Streak Freeze dùng được, tính cả phần Pro sẽ được nạp đầu tháng này nếu chưa nạp (không ghi DB)
func availableFreezes(inv db.UserInventory, pro bool, month pgtype.Date) int32 {
	if pro && (!inv.FreezesGrantedMonth.Valid || inv.FreezesGrantedMonth.Time.Before(month.Time)) {
		return max(inv.StreakFreezes, ProStreakFreezesPerMonth)
	}
	return inv.StreakFreezes
}

// inventory — vật phẩm của học viên (tạo dòng nếu chưa có); Pro được nạp Streak Freeze của tháng này
func (s *PlanService) inventory(ctx context.Context, userID uuid.UUID, pro bool) (db.UserInventory, error) {
	if err := s.repo.EnsureUserInventory(ctx, toPgUUID(userID)); err != nil {
		return db.UserInventory{}, err
	}
	if pro {
		if err := s.repo.RefillStreakFreezes(ctx, db.RefillStreakFreezesParams{UserID: toPgUUID(userID), Amount: ProStreakFreezesPerMonth, Month: s.monthStart()}); err != nil {
			return db.UserInventory{}, err
		}
	}
	return s.repo.GetUserInventory(ctx, toPgUUID(userID))
}

// storedInventory — vật phẩm đang lưu, chỉ đọc (chưa có dòng = 0)
func (s *PlanService) storedInventory(ctx context.Context, userID uuid.UUID) (db.UserInventory, error) {
	inv, err := s.repo.GetUserInventory(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return db.UserInventory{UserID: toPgUUID(userID)}, nil
	}
	return inv, err
}

// ===== Admin cấp / thu Pro =====

type GrantSubscriptionRequest struct {
	Plan string `json:"plan" enums:"MONTHLY,YEARLY,LIFETIME" example:"MONTHLY"`
	Note string `json:"note,omitempty" example:"Tặng học viên lớp IELTS"`
}

// AdminSubscription — gói đang hiệu lực của 1 học viên (admin xem)
func (s *PlanService) AdminSubscription(ctx context.Context, userID uuid.UUID) (*SubscriptionInfo, error) {
	if _, err := s.repo.GetUserByID(ctx, toPgUUID(userID)); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	return s.activeSubscription(ctx, userID)
}

// Grant — admin cấp gói (thay gói đang có): tháng / năm tính từ bây giờ, trọn đời không hết hạn
func (s *PlanService) Grant(ctx context.Context, adminID, userID uuid.UUID, req GrantSubscriptionRequest) (*SubscriptionInfo, error) {
	now := s.now()
	var expires pgtype.Timestamptz
	switch req.Plan {
	case PlanMonthly:
		expires = pgtype.Timestamptz{Time: now.AddDate(0, 1, 0), Valid: true}
	case PlanYearly:
		expires = pgtype.Timestamptz{Time: now.AddDate(1, 0, 0), Valid: true}
	case PlanLifetime:
	default:
		return nil, fmt.Errorf("gói phải là MONTHLY, YEARLY hoặc LIFETIME: %w", ErrInvalidInput)
	}
	if len([]rune(req.Note)) > 500 {
		return nil, fmt.Errorf("ghi chú tối đa 500 ký tự: %w", ErrInvalidInput)
	}
	if _, err := s.repo.GetUserByID(ctx, toPgUUID(userID)); errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	// Gói Stripe tự gia hạn: thay ở đây thì Stripe vẫn trừ tiền — học viên tự huỷ ở Quản lý gói trước
	if active, err := s.repo.GetActiveSubscription(ctx, toPgUUID(userID)); err == nil && active.AutoRenew {
		return nil, fmt.Errorf("học viên đang có gói tự gia hạn qua Stripe — cần huỷ trên Stripe (Quản lý gói) trước khi cấp gói khác: %w", ErrInvalidInput)
	} else if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	if err := qtx.CancelActiveSubscriptions(ctx, toPgUUID(userID)); err != nil {
		return nil, err
	}
	sub, err := qtx.CreateSubscription(ctx, db.CreateSubscriptionParams{
		UserID: toPgUUID(userID), Plan: req.Plan, StartsAt: pgtype.Timestamptz{Time: now, Valid: true}, ExpiresAt: expires,
		PaymentProvider: "ADMIN", GrantedBy: toPgUUID(adminID), Note: req.Note,
	})
	if err != nil {
		// uq_subscriptions_one_active: lần cấp khác cho cùng học viên vừa chạy song song
		return nil, asDuplicate(err, "Gói của học viên vừa được thay đổi ở nơi khác, vui lòng tải lại")
	}
	return toSubscriptionInfo(sub), tx.Commit(ctx)
}

// Revoke — admin thu hồi gói đang hiệu lực (về Free)
func (s *PlanService) Revoke(ctx context.Context, userID uuid.UUID) error {
	if _, err := s.repo.GetUserByID(ctx, toPgUUID(userID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if err := s.repo.WithTx(tx).CancelActiveSubscriptions(ctx, toPgUUID(userID)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// ===== Chuỗi ngày học + Streak Freeze =====

// daysBetween — số ngày từ a tới b (cùng là ngày, không giờ)
func daysBetween(a, b pgtype.Date) int {
	return int(b.Time.Sub(a.Time).Hours() / 24)
}

// nextStreak — chuỗi mới khi học vào hôm nay: học tiếp từ hôm qua → +1; nghỉ `missed` ngày mà có đủ Streak Freeze
// → dùng freeze bù, vẫn +1; còn lại → bắt đầu lại từ 1. useFreezes = số freeze cần dùng.
func nextStreak(count int32, last pgtype.Date, today pgtype.Date, freezes int32) (next int32, useFreezes int32) {
	if !last.Valid {
		return 1, 0
	}
	gap := daysBetween(last, today)
	switch {
	case gap <= 0:
		return count, 0
	case gap == 1:
		return count + 1, 0
	}
	missed := int32(gap - 1)
	if freezes >= missed {
		return count + 1, missed
	}
	return 1, 0
}

// effectiveStreak — chuỗi đang hiển thị: chưa học hôm nay/hôm qua mà không đủ Streak Freeze bù → đã đứt (0)
func effectiveStreak(count int32, last pgtype.Date, today pgtype.Date, freezes int32) int32 {
	if !last.Valid {
		return 0
	}
	gap := daysBetween(last, today)
	if gap <= 1 || int32(gap-1) <= freezes {
		return count
	}
	return 0
}

// TouchStreak — gọi mỗi lần học viên học (MissionService.MarkStudied): cập nhật chuỗi ngày học của hôm nay,
// tự dùng Streak Freeze (Pro) bù các ngày nghỉ. Đã tính hôm nay rồi → chỉ 1 câu SELECT.
func (s *PlanService) TouchStreak(ctx context.Context, userID uuid.UUID) error {
	today := s.today()
	cur, err := s.repo.GetUserStreak(ctx, toPgUUID(userID))
	if err != nil {
		return err
	}
	if cur.StreakDate.Valid && daysBetween(cur.StreakDate, today) <= 0 {
		return nil
	}
	pro, err := s.IsPro(ctx, userID)
	if err != nil {
		return err
	}
	if err := s.repo.EnsureUserInventory(ctx, toPgUUID(userID)); err != nil {
		return err
	}
	// Freeze của tháng mới chỉ bù được ngày nghỉ TRONG tháng này (nghỉ cuối tháng trước không dùng phần tháng mới):
	// học gần nhất từ hôm trước ngày 1 trở đi → nạp phần tháng này trước khi tính
	month := s.monthStart()
	if pro && cur.StreakDate.Valid && daysBetween(cur.StreakDate, month) <= 1 {
		if err := s.repo.RefillStreakFreezes(ctx, db.RefillStreakFreezesParams{UserID: toPgUUID(userID), Amount: ProStreakFreezesPerMonth, Month: month}); err != nil {
			return err
		}
	}
	inv, err := s.storedInventory(ctx, userID)
	if err != nil {
		return err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)
	locked, err := qtx.LockUserStreak(ctx, toPgUUID(userID)) // 2 hoạt động cùng lúc không cộng 2 lần
	if err != nil {
		return err
	}
	next, use := nextStreak(locked.StreakCount.Int32, locked.StreakDate, today, inv.StreakFreezes)
	if use > 0 {
		if n, err := qtx.UseStreakFreezes(ctx, db.UseStreakFreezesParams{UserID: toPgUUID(userID), N: use}); err != nil {
			return err
		} else if n == 0 { // freeze vừa bị dùng ở request khác → không đủ bù
			next = 1
		}
	}
	if err := qtx.SetUserStreak(ctx, db.SetUserStreakParams{ID: toPgUUID(userID), StreakCount: pgtype.Int4{Int32: next, Valid: true}, StreakDate: today}); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	if pro { // nạp phần tháng này (nếu chưa) cho các ngày nghỉ sau
		_, err = s.inventory(ctx, userID, true)
	}
	return err
}

// EffectiveStreak — chuỗi ngày học đang hiển thị của học viên (đã đứt thì 0)
func (s *PlanService) EffectiveStreak(ctx context.Context, userID uuid.UUID) (int32, error) {
	cur, err := s.repo.GetUserStreak(ctx, toPgUUID(userID))
	if err != nil {
		return 0, err
	}
	today := s.today()
	if !cur.StreakDate.Valid || daysBetween(cur.StreakDate, today) <= 1 {
		return effectiveStreak(cur.StreakCount.Int32, cur.StreakDate, today, 0), nil
	}
	pro, err := s.IsPro(ctx, userID)
	if err != nil {
		return 0, err
	}
	inv, err := s.storedInventory(ctx, userID) // chỉ đọc — GET /users/me không ghi DB
	if err != nil {
		return 0, err
	}
	// Freeze tháng này (nạp đầu tháng) chỉ bù được ngày nghỉ trong tháng — giống TouchStreak
	freezes := inv.StreakFreezes
	if month := s.monthStart(); daysBetween(cur.StreakDate, month) <= 1 {
		freezes = availableFreezes(inv, pro, month)
	}
	return effectiveStreak(cur.StreakCount.Int32, cur.StreakDate, today, freezes), nil
}
