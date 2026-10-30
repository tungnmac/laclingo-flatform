package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"slices"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	reminderTickInterval = time.Minute
	pushSendTimeout      = 10 * time.Second // 1 push service treo không được làm kẹt cả lượt nhắc
	reminderPushTTL      = 12 * 60 * 60     // giây — quá hạn thì push service bỏ, không nhắc muộn hơn nửa ngày
	maxInactiveDays      = 30               // khớp CHECK inactive_days BETWEEN 1 AND 30
)

// ErrPushNotConfigured — server chưa cấu hình khoá VAPID nên không gửi được web push
var ErrPushNotConfigured = fmt.Errorf("server chưa cấu hình thông báo đẩy: %w", ErrInvalidInput)

// ReminderRepository — lịch nhắc học (mặc định admin + tuỳ chỉnh học viên) và subscription web push
type ReminderRepository interface {
	GetReminderDefaults(ctx context.Context) (db.ReminderDefault, error)
	UpdateReminderDefaults(ctx context.Context, arg db.UpdateReminderDefaultsParams) (db.ReminderDefault, error)
	GetUserReminderSettings(ctx context.Context, userID pgtype.UUID) (db.UserReminderSetting, error)
	UpsertUserReminderSettings(ctx context.Context, arg db.UpsertUserReminderSettingsParams) (db.UserReminderSetting, error)
	SetUserReminderTimezone(ctx context.Context, arg db.SetUserReminderTimezoneParams) error
	UpsertPushSubscription(ctx context.Context, arg db.UpsertPushSubscriptionParams) error
	DeletePushSubscription(ctx context.Context, arg db.DeletePushSubscriptionParams) error
	DeletePushSubscriptionByEndpoint(ctx context.Context, endpoint string) error
	ListPushSubscriptionsForUser(ctx context.Context, userID pgtype.UUID) ([]db.PushSubscription, error)
	CountPushSubscriptionsForUser(ctx context.Context, userID pgtype.UUID) (int32, error)
	TrimPushSubscriptions(ctx context.Context, arg db.TrimPushSubscriptionsParams) error
	ClaimDueReminders(ctx context.Context) ([]db.ClaimDueRemindersRow, error)
	CheckTimezone(ctx context.Context, tz string) (pgtype.Timestamp, error)
}

// pushServiceHosts — host của push service các trình duyệt (Chrome/Edge/Opera
// qua FCM, Firefox, Safari, Windows). Subscribe chỉ nhận endpoint thuộc các
// host này: server sẽ POST tới endpoint, không được để user trỏ vào host bất kỳ.
var pushServiceHosts = []string{
	"fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com",
	".push.apple.com", ".notify.windows.com",
}

func isPushServiceHost(host string) bool {
	for _, h := range pushServiceHosts {
		if host == h || (strings.HasPrefix(h, ".") && strings.HasSuffix(host, h)) {
			return true
		}
	}
	return false
}

// PushSender gửi 1 thông báo tới 1 subscription. gone = subscription không
// còn hiệu lực (trình duyệt đã huỷ) — caller xoá nó đi.
type PushSender interface {
	Send(ctx context.Context, sub db.PushSubscription, payload []byte) (gone bool, err error)
}

// ReminderSchedule — 1 lịch nhắc học (mặc định của admin hoặc lịch hiệu lực của học viên)
type ReminderSchedule struct {
	// Nhắc theo giờ: vào RemindTime các ngày DaysOfWeek, nếu hôm đó chưa học
	DailyEnabled bool    `json:"daily_enabled"`
	RemindTime   string  `json:"remind_time" example:"20:00"`      // HH:MM theo Timezone
	DaysOfWeek   []int16 `json:"days_of_week" example:"1,2,3,4,5"` // ISO: 1 = Thứ 2 ... 7 = Chủ nhật
	// Nhắc khi bỏ học InactiveDays ngày liên tiếp (gửi vào khung giờ nhắc, lặp lại mỗi InactiveDays ngày)
	InactiveEnabled bool   `json:"inactive_enabled"`
	InactiveDays    int32  `json:"inactive_days" example:"2"`
	Timezone        string `json:"timezone" example:"Asia/Ho_Chi_Minh"`
}

// MyReminderSettings — lịch nhắc của học viên đang đăng nhập
type MyReminderSettings struct {
	Settings             ReminderSchedule `json:"settings"`               // lịch đang có hiệu lực
	Custom               bool             `json:"custom"`                 // true = học viên đã tự chỉnh, false = theo mặc định
	Defaults             ReminderSchedule `json:"defaults"`               // mặc định của admin
	PushConfigured       bool             `json:"push_configured"`        // server đã cấu hình web push
	NativePushConfigured bool             `json:"native_push_configured"` // server đã cấu hình FCM (thông báo trên app iOS/Android)
	SubscriptionCount    int32            `json:"subscription_count"`     // số trình duyệt/thiết bị đã bật nhận thông báo
}

// PushSubscriptionRequest — subscription lấy từ PushManager.subscribe() của trình duyệt
type PushSubscriptionRequest struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
	Timezone string `json:"timezone" example:"Asia/Ho_Chi_Minh"` // Intl.DateTimeFormat().resolvedOptions().timeZone
}

// NativePushRequest — FCM registration token của app iOS/Android (@capacitor-firebase/messaging getToken)
type NativePushRequest struct {
	Token    string `json:"token"`
	Timezone string `json:"timezone" example:"Asia/Ho_Chi_Minh"`
}

const (
	pushKindWeb                 = "webpush"
	pushKindFCM                 = "fcm"
	maxPushSubscriptionsPerUser = 10 // thiết bị/trình duyệt mỗi học viên — vượt thì bỏ cái cũ nhất
)

// fcmTokenRegex — FCM registration token (~150-200 ký tự chữ, số, _ - :)
var fcmTokenRegex = regexp.MustCompile(`^[A-Za-z0-9_:\-]+$`)

type ReminderService struct {
	repo      ReminderRepository
	sender    PushSender // nil = server chưa cấu hình web push — vẫn nhắc trong chuông thông báo
	native    PushSender // nil = chưa cấu hình FCM — app iOS/Android không nhận được thông báo đẩy
	publicKey string
	notifier  Notifier
}

// NewReminderService — sender/publicKey rỗng khi chưa cấu hình VAPID: vẫn
// đọc/sửa được lịch và nhắc trong chuông thông báo, chỉ không đăng ký/gửi được push.
func NewReminderService(repo ReminderRepository, sender PushSender, publicKey string, notifier Notifier) *ReminderService {
	return &ReminderService{repo: repo, sender: sender, publicKey: publicKey, notifier: notifier}
}

// SetNativeSender bật thông báo đẩy cho app iOS/Android (FCM)
func (s *ReminderService) SetNativeSender(native PushSender) {
	s.native = native
}

// pushEnabled — có ít nhất 1 kênh đẩy (web push hoặc FCM)
func (s *ReminderService) pushEnabled() bool {
	return s.sender != nil || s.native != nil
}

// senderFor — kênh gửi theo loại subscription (nil = kênh đó chưa cấu hình)
func (s *ReminderService) senderFor(sub db.PushSubscription) PushSender {
	if sub.Kind == pushKindFCM {
		return s.native
	}
	return s.sender
}

// PushPublicKey — khoá VAPID công khai cho PushManager.subscribe (applicationServerKey)
func (s *ReminderService) PushPublicKey() (string, bool) {
	return s.publicKey, s.sender != nil
}

// ===== Subscription =====

func (s *ReminderService) Subscribe(ctx context.Context, userID uuid.UUID, req PushSubscriptionRequest) error {
	if s.sender == nil {
		return ErrPushNotConfigured
	}
	u, err := url.Parse(req.Endpoint)
	if err != nil || u.Scheme != "https" || u.Port() != "" || !isPushServiceHost(u.Hostname()) || req.Keys.P256dh == "" || req.Keys.Auth == "" {
		return fmt.Errorf("subscription không hợp lệ: %w", ErrInvalidInput)
	}
	if err := s.checkTimezone(ctx, req.Timezone); err != nil {
		return err
	}
	if err := s.repo.UpsertPushSubscription(ctx, db.UpsertPushSubscriptionParams{
		UserID: toPgUUID(userID), Endpoint: req.Endpoint, P256dh: req.Keys.P256dh, Auth: req.Keys.Auth, Kind: pushKindWeb,
	}); err != nil {
		return err
	}
	if err := s.repo.TrimPushSubscriptions(ctx, db.TrimPushSubscriptionsParams{UserID: toPgUUID(userID), Keep: maxPushSubscriptionsPerUser}); err != nil {
		return err
	}
	// Tạo dòng cài đặt (để bộ lập lịch quét tới) + múi giờ hiện tại của trình duyệt
	return s.repo.SetUserReminderTimezone(ctx, db.SetUserReminderTimezoneParams{
		UserID: toPgUUID(userID), Timezone: pgtype.Text{String: req.Timezone, Valid: true},
	})
}

// SubscribeNative — bật thông báo đẩy trên app iOS/Android: lưu FCM token (dùng chung bảng với web push)
func (s *ReminderService) SubscribeNative(ctx context.Context, userID uuid.UUID, req NativePushRequest) error {
	if s.native == nil {
		return ErrPushNotConfigured
	}
	req.Token = strings.TrimSpace(req.Token)
	if len(req.Token) < 20 || len(req.Token) > 2048 || !fcmTokenRegex.MatchString(req.Token) {
		return fmt.Errorf("token thông báo không hợp lệ: %w", ErrInvalidInput)
	}
	if err := s.checkTimezone(ctx, req.Timezone); err != nil {
		return err
	}
	if err := s.repo.UpsertPushSubscription(ctx, db.UpsertPushSubscriptionParams{
		UserID: toPgUUID(userID), Endpoint: req.Token, Kind: pushKindFCM,
	}); err != nil {
		return err
	}
	if err := s.repo.TrimPushSubscriptions(ctx, db.TrimPushSubscriptionsParams{UserID: toPgUUID(userID), Keep: maxPushSubscriptionsPerUser}); err != nil {
		return err
	}
	return s.repo.SetUserReminderTimezone(ctx, db.SetUserReminderTimezoneParams{
		UserID: toPgUUID(userID), Timezone: pgtype.Text{String: req.Timezone, Valid: true},
	})
}

// UpdateTimezone lưu múi giờ trình duyệt của user (FE gọi mỗi lần vào app) —
// để nhắc học đúng giờ địa phương kể cả với user chưa bật web push
func (s *ReminderService) UpdateTimezone(ctx context.Context, userID uuid.UUID, tz string) error {
	if err := s.checkTimezone(ctx, tz); err != nil {
		return err
	}
	return s.repo.SetUserReminderTimezone(ctx, db.SetUserReminderTimezoneParams{
		UserID: toPgUUID(userID), Timezone: pgtype.Text{String: tz, Valid: true},
	})
}

func (s *ReminderService) Unsubscribe(ctx context.Context, userID uuid.UUID, endpoint string) error {
	if endpoint == "" {
		return ErrInvalidInput
	}
	return s.repo.DeletePushSubscription(ctx, db.DeletePushSubscriptionParams{UserID: toPgUUID(userID), Endpoint: endpoint})
}

// ===== Lịch nhắc =====

func (s *ReminderService) GetMySettings(ctx context.Context, userID uuid.UUID) (MyReminderSettings, error) {
	defaults, err := s.repo.GetReminderDefaults(ctx)
	if err != nil {
		return MyReminderSettings{}, err
	}
	own, err := s.repo.GetUserReminderSettings(ctx, toPgUUID(userID))
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return MyReminderSettings{}, err
	}
	count, err := s.repo.CountPushSubscriptionsForUser(ctx, toPgUUID(userID))
	if err != nil {
		return MyReminderSettings{}, err
	}
	def := toReminderSchedule(defaults)
	return MyReminderSettings{
		Settings:             effectiveSchedule(def, own),
		Custom:               own.DailyEnabled.Valid, // UpdateMySettings luôn ghi đủ mọi cột cấu hình cùng lúc
		Defaults:             def,
		PushConfigured:       s.sender != nil,
		NativePushConfigured: s.native != nil,
		SubscriptionCount:    count,
	}, nil
}

// UpdateMySettings lưu lịch riêng của học viên (ghi đè toàn bộ — không còn theo mặc định admin)
func (s *ReminderService) UpdateMySettings(ctx context.Context, userID uuid.UUID, req ReminderSchedule) (MyReminderSettings, error) {
	remindTime, err := s.validateSchedule(ctx, &req)
	if err != nil {
		return MyReminderSettings{}, err
	}
	if _, err := s.repo.UpsertUserReminderSettings(ctx, db.UpsertUserReminderSettingsParams{
		UserID:          toPgUUID(userID),
		DailyEnabled:    pgtype.Bool{Bool: req.DailyEnabled, Valid: true},
		RemindTime:      remindTime,
		DaysOfWeek:      req.DaysOfWeek,
		InactiveEnabled: pgtype.Bool{Bool: req.InactiveEnabled, Valid: true},
		InactiveDays:    pgtype.Int4{Int32: req.InactiveDays, Valid: true},
		Timezone:        pgtype.Text{String: req.Timezone, Valid: true},
	}); err != nil {
		return MyReminderSettings{}, err
	}
	return s.GetMySettings(ctx, userID)
}

// ResetMySettings quay về theo mặc định admin — chỉ giữ lại múi giờ của học viên
func (s *ReminderService) ResetMySettings(ctx context.Context, userID uuid.UUID) (MyReminderSettings, error) {
	own, err := s.repo.GetUserReminderSettings(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return s.GetMySettings(ctx, userID)
	}
	if err != nil {
		return MyReminderSettings{}, err
	}
	if _, err := s.repo.UpsertUserReminderSettings(ctx, db.UpsertUserReminderSettingsParams{
		UserID: toPgUUID(userID), Timezone: own.Timezone,
	}); err != nil {
		return MyReminderSettings{}, err
	}
	return s.GetMySettings(ctx, userID)
}

func (s *ReminderService) GetDefaults(ctx context.Context) (ReminderSchedule, error) {
	d, err := s.repo.GetReminderDefaults(ctx)
	if err != nil {
		return ReminderSchedule{}, err
	}
	return toReminderSchedule(d), nil
}

// UpdateDefaults (admin) — áp dụng cho mọi học viên chưa tự chỉnh lịch.
// Timezone ở đây chỉ dùng cho học viên chưa từng bật thông báo trên trình duyệt nào.
func (s *ReminderService) UpdateDefaults(ctx context.Context, req ReminderSchedule) (ReminderSchedule, error) {
	remindTime, err := s.validateSchedule(ctx, &req)
	if err != nil {
		return ReminderSchedule{}, err
	}
	d, err := s.repo.UpdateReminderDefaults(ctx, db.UpdateReminderDefaultsParams{
		DailyEnabled: req.DailyEnabled, RemindTime: remindTime, DaysOfWeek: req.DaysOfWeek,
		InactiveEnabled: req.InactiveEnabled, InactiveDays: req.InactiveDays, Timezone: req.Timezone,
	})
	if err != nil {
		return ReminderSchedule{}, err
	}
	return toReminderSchedule(d), nil
}

// ===== Gửi thông báo =====

type pushPayload struct {
	Title string `json:"title"`
	Body  string `json:"body"`
	URL   string `json:"url"`
	Tag   string `json:"tag"` // cùng tag thì thông báo mới thay thông báo cũ, không chồng lên nhau
}

// SendTest gửi 1 thông báo thử tới mọi thiết bị của học viên, trả về số thiết bị đã gửi được
func (s *ReminderService) SendTest(ctx context.Context, userID uuid.UUID) (int, error) {
	if !s.pushEnabled() {
		return 0, ErrPushNotConfigured
	}
	sent, total, err := s.sendToUser(ctx, userID, pushPayload{
		Title: "LacLingo", Body: "Thông báo nhắc học đã hoạt động trên thiết bị này!", URL: "/profile", Tag: "laclingo-test",
	})
	switch {
	case err != nil:
		return 0, err
	case total == 0:
		return 0, fmt.Errorf("chưa có thiết bị nào bật nhận thông báo: %w", ErrNotFound)
	case sent == 0:
		return 0, errors.New("không gửi được thông báo tới thiết bị nào, vui lòng tắt rồi bật lại thông báo")
	}
	return sent, nil
}

// RunDue nhắc mọi học viên đến giờ nhắc (1 lượt của bộ lập lịch): luôn tạo
// thông báo trong chuông, và gửi thêm web push nếu server đã cấu hình
func (s *ReminderService) RunDue(ctx context.Context) error {
	due, err := s.repo.ClaimDueReminders(ctx)
	if err != nil {
		return err
	}
	for _, r := range due {
		userID := uuid.UUID(r.UserID.Bytes)
		p := reminderPayload(r)
		s.notifier.Notify(ctx, userID, NotificationInput{
			Type: NotificationStudyReminder, Icon: "🔔", Title: p.Title, Body: p.Body, URL: p.URL,
			ReplaceUnread: true,
		})
		if !s.pushEnabled() || !r.HasPush {
			continue
		}
		if _, _, err := s.sendToUser(ctx, userID, p); err != nil {
			log.Printf("❌ reminder: gửi nhắc học user=%s: %v", userID, err)
		}
	}
	return nil
}

// Start chạy bộ lập lịch mỗi phút tới khi ctx bị huỷ
func (s *ReminderService) Start(ctx context.Context) {
	ticker := time.NewTicker(reminderTickInterval)
	defer ticker.Stop()
	for {
		if err := s.RunDue(ctx); err != nil && ctx.Err() == nil {
			log.Printf("❌ reminder: quét lịch nhắc học: %v", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func reminderPayload(r db.ClaimDueRemindersRow) pushPayload {
	if r.IsInactive {
		return pushPayload{
			Title: "Lâu rồi không gặp bạn!",
			Body:  fmt.Sprintf("Bạn đã nghỉ học %d ngày. Quay lại ôn vài từ để không quên bài nhé!", r.DaysInactive),
			URL:   "/review", Tag: "laclingo-reminder",
		}
	}
	return pushPayload{
		Title: "Đến giờ học rồi!",
		Body:  "Hôm nay bạn chưa học. Dành vài phút ôn tập để giữ chuỗi ngày học nhé!",
		URL:   "/review", Tag: "laclingo-reminder",
	}
}

// sendToUser gửi tới mọi subscription của user (tự xoá subscription đã hết hiệu
// lực), trả về số lần gửi thành công / số subscription đã thử gửi (bỏ qua kênh chưa cấu hình)
func (s *ReminderService) sendToUser(ctx context.Context, userID uuid.UUID, p pushPayload) (sent, total int, err error) {
	subs, err := s.repo.ListPushSubscriptionsForUser(ctx, toPgUUID(userID))
	if err != nil {
		return 0, 0, err
	}
	payload, err := json.Marshal(p)
	if err != nil {
		return 0, 0, err
	}
	for _, sub := range subs {
		sender := s.senderFor(sub)
		if sender == nil {
			continue // kênh của subscription này chưa cấu hình trên server — giữ lại, không tính là lỗi
		}
		total++
		gone, err := sender.Send(ctx, sub, payload)
		switch {
		case gone:
			if err := s.repo.DeletePushSubscriptionByEndpoint(ctx, sub.Endpoint); err != nil {
				log.Printf("❌ reminder: xoá subscription hết hạn: %v", err)
			}
		case err != nil:
			log.Printf("❌ reminder: gửi push user=%s: %v", userID, err)
		default:
			sent++
		}
	}
	return sent, total, nil
}

// ===== Chuyển đổi / kiểm tra dữ liệu =====

func toReminderSchedule(d db.ReminderDefault) ReminderSchedule {
	return ReminderSchedule{
		DailyEnabled: d.DailyEnabled, RemindTime: formatPgTime(d.RemindTime), DaysOfWeek: d.DaysOfWeek,
		InactiveEnabled: d.InactiveEnabled, InactiveDays: d.InactiveDays, Timezone: d.Timezone,
	}
}

// effectiveSchedule — cột nào của học viên NULL thì lấy mặc định admin (khớp COALESCE trong ClaimDueReminders)
func effectiveSchedule(def ReminderSchedule, own db.UserReminderSetting) ReminderSchedule {
	eff := def
	if own.DailyEnabled.Valid {
		eff.DailyEnabled = own.DailyEnabled.Bool
	}
	if own.RemindTime.Valid {
		eff.RemindTime = formatPgTime(own.RemindTime)
	}
	if own.DaysOfWeek != nil {
		eff.DaysOfWeek = own.DaysOfWeek
	}
	if own.InactiveEnabled.Valid {
		eff.InactiveEnabled = own.InactiveEnabled.Bool
	}
	if own.InactiveDays.Valid {
		eff.InactiveDays = own.InactiveDays.Int32
	}
	if own.Timezone.Valid {
		eff.Timezone = own.Timezone.String
	}
	return eff
}

// normalizeSchedule kiểm tra + chuẩn hoá lịch (sắp xếp, bỏ trùng ngày) và trả về giờ nhắc dạng pgtype.Time
func normalizeSchedule(req *ReminderSchedule) (pgtype.Time, error) {
	t, err := time.Parse("15:04", req.RemindTime)
	if err != nil {
		return pgtype.Time{}, fmt.Errorf("giờ nhắc phải có dạng HH:MM: %w", ErrInvalidInput)
	}
	for _, d := range req.DaysOfWeek {
		if d < 1 || d > 7 {
			return pgtype.Time{}, fmt.Errorf("ngày trong tuần phải từ 1 (Thứ 2) tới 7 (Chủ nhật): %w", ErrInvalidInput)
		}
	}
	days := slices.Clone(req.DaysOfWeek)
	slices.Sort(days)
	req.DaysOfWeek = slices.Compact(days)
	if req.DaysOfWeek == nil {
		req.DaysOfWeek = []int16{}
	}
	if req.DailyEnabled && len(req.DaysOfWeek) == 0 {
		return pgtype.Time{}, fmt.Errorf("chọn ít nhất 1 ngày nhắc trong tuần: %w", ErrInvalidInput)
	}
	if req.InactiveDays < 1 || req.InactiveDays > maxInactiveDays {
		return pgtype.Time{}, fmt.Errorf("số ngày bỏ học phải từ 1 tới %d: %w", maxInactiveDays, ErrInvalidInput)
	}
	micros := int64(t.Hour()*60+t.Minute()) * int64(time.Minute/time.Microsecond)
	return pgtype.Time{Microseconds: micros, Valid: true}, nil
}

// validateSchedule = normalizeSchedule + kiểm tra múi giờ với PostgreSQL
func (s *ReminderService) validateSchedule(ctx context.Context, req *ReminderSchedule) (pgtype.Time, error) {
	remindTime, err := normalizeSchedule(req)
	if err != nil {
		return pgtype.Time{}, err
	}
	return remindTime, s.checkTimezone(ctx, req.Timezone)
}

// checkTimezone — chỉ nhận tên IANA dạng Khu_vực/Thành_phố (hoặc UTC) như Intl của
// trình duyệt trả về, và PHẢI được chính PostgreSQL nhận (ClaimDueReminders dùng
// AT TIME ZONE cho mọi user trong 1 câu — 1 múi giờ lạ làm hỏng cả lượt nhắc).
func (s *ReminderService) checkTimezone(ctx context.Context, tz string) error {
	invalid := fmt.Errorf("múi giờ không hợp lệ: %w", ErrInvalidInput)
	if tz != "UTC" && !strings.Contains(tz, "/") {
		return invalid
	}
	if _, err := s.repo.CheckTimezone(ctx, tz); err != nil {
		if isPgError(err, pgInvalidParameterValue) {
			return invalid
		}
		return err
	}
	return nil
}

func formatPgTime(t pgtype.Time) string {
	minutes := t.Microseconds / int64(time.Minute/time.Microsecond)
	return fmt.Sprintf("%02d:%02d", minutes/60, minutes%60)
}

// ===== Web push (VAPID) =====

type webPushSender struct {
	publicKey, privateKey, subject string
	client                         *http.Client
}

// NewWebPushSender — gửi qua Web Push Protocol, ký VAPID bằng cặp khoá của server.
// subject nhận cả "mailto:a@b.c" lẫn "a@b.c": webpush-go tự thêm "mailto:" cho
// mọi subject không bắt đầu bằng "https:", nên bỏ tiền tố để không thành "mailto:mailto:".
func NewWebPushSender(publicKey, privateKey, subject string) PushSender {
	return &webPushSender{
		publicKey: publicKey, privateKey: privateKey, subject: strings.TrimPrefix(subject, "mailto:"),
		client: &http.Client{Timeout: pushSendTimeout},
	}
}

func (w *webPushSender) Send(ctx context.Context, sub db.PushSubscription, payload []byte) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, pushSendTimeout)
	defer cancel()
	resp, err := webpush.SendNotificationWithContext(ctx, payload, &webpush.Subscription{
		Endpoint: sub.Endpoint,
		Keys:     webpush.Keys{P256dh: sub.P256dh, Auth: sub.Auth},
	}, &webpush.Options{
		Subscriber:      w.subject,
		VAPIDPublicKey:  w.publicKey,
		VAPIDPrivateKey: w.privateKey,
		TTL:             reminderPushTTL,
		Urgency:         webpush.UrgencyNormal,
		HTTPClient:      w.client,
	})
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, resp.Body)
	switch {
	case resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone:
		return true, nil
	case resp.StatusCode >= 400:
		return false, fmt.Errorf("push service trả về %d", resp.StatusCode)
	}
	return false, nil
}
