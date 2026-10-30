package service

import (
	"context"
	"encoding/json"
	"errors"
	"slices"
	"strings"
	"testing"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func validSchedule() ReminderSchedule {
	return ReminderSchedule{
		DailyEnabled: true, RemindTime: "20:30", DaysOfWeek: []int16{5, 1, 3, 1},
		InactiveEnabled: true, InactiveDays: 2, Timezone: "Asia/Ho_Chi_Minh",
	}
}

func TestNormalizeSchedule(t *testing.T) {
	req := validSchedule()
	got, err := normalizeSchedule(&req)
	if err != nil {
		t.Fatalf("lịch hợp lệ bị từ chối: %v", err)
	}
	if formatPgTime(got) != "20:30" {
		t.Errorf("giờ nhắc = %s, muốn 20:30", formatPgTime(got))
	}
	if !slices.Equal(req.DaysOfWeek, []int16{1, 3, 5}) {
		t.Errorf("ngày chưa sắp xếp/bỏ trùng: %v", req.DaysOfWeek)
	}

	invalid := map[string]func(*ReminderSchedule){
		"giờ sai dạng":           func(r *ReminderSchedule) { r.RemindTime = "8pm" },
		"giờ vượt 23:59":         func(r *ReminderSchedule) { r.RemindTime = "24:00" },
		"ngày ngoài 1..7":        func(r *ReminderSchedule) { r.DaysOfWeek = []int16{0} },
		"bật nhắc nhưng 0 ngày":  func(r *ReminderSchedule) { r.DaysOfWeek = nil },
		"số ngày bỏ học = 0":     func(r *ReminderSchedule) { r.InactiveDays = 0 },
		"số ngày bỏ học quá lớn": func(r *ReminderSchedule) { r.InactiveDays = 31 },
	}
	for name, mutate := range invalid {
		req := validSchedule()
		mutate(&req)
		if _, err := normalizeSchedule(&req); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("%s: muốn ErrInvalidInput, nhận %v", name, err)
		}
	}

	// Tắt nhắc theo giờ thì được để trống ngày
	req = validSchedule()
	req.DailyEnabled, req.DaysOfWeek = false, nil
	if _, err := normalizeSchedule(&req); err != nil || req.DaysOfWeek == nil {
		t.Errorf("tắt nhắc theo giờ + 0 ngày phải hợp lệ (và lưu mảng rỗng), err=%v days=%v", err, req.DaysOfWeek)
	}
}

func TestCheckTimezoneRejectsNonIANANames(t *testing.T) {
	// Tên không dạng Khu_vực/Thành_phố bị chặn trước khi hỏi PostgreSQL (repo nil sẽ panic nếu bị gọi)
	svc := NewReminderService(&fakeReminderRepo{}, nil, "", &fakeNotifier{})
	for _, tz := range []string{"", "ICT", "Local", "GMT+7"} {
		if err := svc.checkTimezone(context.Background(), tz); !errors.Is(err, ErrInvalidInput) {
			t.Errorf("%q: muốn ErrInvalidInput, nhận %v", tz, err)
		}
	}
}

func TestIsPushServiceHost(t *testing.T) {
	allowed := []string{"fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com", "wns2-par02p.notify.windows.com"}
	blocked := []string{"evil.com", "fcm.googleapis.com.evil.com", "push.apple.com.evil.com", "notify.windows.com", "localhost", "10.0.0.1"}
	for _, h := range allowed {
		if !isPushServiceHost(h) {
			t.Errorf("%s phải được nhận", h)
		}
	}
	for _, h := range blocked {
		if isPushServiceHost(h) {
			t.Errorf("%s phải bị chặn", h)
		}
	}
}

func TestEffectiveSchedule(t *testing.T) {
	def := ReminderSchedule{DailyEnabled: true, RemindTime: "20:00", DaysOfWeek: []int16{1, 2, 3, 4, 5, 6, 7}, InactiveEnabled: true, InactiveDays: 2, Timezone: "Asia/Ho_Chi_Minh"}

	// Chỉ có múi giờ riêng (vừa bật push, chưa tự chỉnh) → theo mặc định, đổi múi giờ
	got := effectiveSchedule(def, db.UserReminderSetting{Timezone: pgtype.Text{String: "Asia/Tokyo", Valid: true}})
	want := def
	want.Timezone = "Asia/Tokyo"
	if !schedulesEqual(got, want) {
		t.Errorf("chỉ có múi giờ: %+v, muốn %+v", got, want)
	}

	// Tự chỉnh đầy đủ → lấy hết của học viên
	own := db.UserReminderSetting{
		DailyEnabled: pgtype.Bool{Bool: false, Valid: true}, RemindTime: pgtype.Time{Microseconds: 7 * 3600e6, Valid: true},
		DaysOfWeek: []int16{}, InactiveEnabled: pgtype.Bool{Bool: true, Valid: true}, InactiveDays: pgtype.Int4{Int32: 5, Valid: true},
		Timezone: pgtype.Text{String: "UTC", Valid: true},
	}
	got = effectiveSchedule(def, own)
	want = ReminderSchedule{DailyEnabled: false, RemindTime: "07:00", DaysOfWeek: []int16{}, InactiveEnabled: true, InactiveDays: 5, Timezone: "UTC"}
	if !schedulesEqual(got, want) {
		t.Errorf("tự chỉnh: %+v, muốn %+v", got, want)
	}
}

func schedulesEqual(a, b ReminderSchedule) bool {
	return a.DailyEnabled == b.DailyEnabled && a.RemindTime == b.RemindTime && slices.Equal(a.DaysOfWeek, b.DaysOfWeek) &&
		a.InactiveEnabled == b.InactiveEnabled && a.InactiveDays == b.InactiveDays && a.Timezone == b.Timezone
}

// fakeReminderRepo — chỉ cài các method sendToUser/RunDue dùng; còn lại nil (panic nếu bị gọi nhầm)
type fakeReminderRepo struct {
	ReminderRepository
	subs    []db.PushSubscription
	due     []db.ClaimDueRemindersRow
	deleted []string
}

func (f *fakeReminderRepo) ListPushSubscriptionsForUser(_ context.Context, _ pgtype.UUID) ([]db.PushSubscription, error) {
	return f.subs, nil
}

func (f *fakeReminderRepo) DeletePushSubscriptionByEndpoint(_ context.Context, endpoint string) error {
	f.deleted = append(f.deleted, endpoint)
	return nil
}

func (f *fakeReminderRepo) ClaimDueReminders(_ context.Context) ([]db.ClaimDueRemindersRow, error) {
	return f.due, nil
}

type fakeSender struct {
	results  map[string]error // endpoint -> lỗi; errGone = subscription hết hạn
	payloads []pushPayload
}

var errGone = errors.New("gone")

func (f *fakeSender) Send(_ context.Context, sub db.PushSubscription, payload []byte) (bool, error) {
	var p pushPayload
	_ = json.Unmarshal(payload, &p)
	f.payloads = append(f.payloads, p)
	switch err := f.results[sub.Endpoint]; {
	case errors.Is(err, errGone):
		return true, nil
	default:
		return false, err
	}
}

func TestRunDueSendsAndPrunesGoneSubscriptions(t *testing.T) {
	repo := &fakeReminderRepo{
		subs: []db.PushSubscription{{Endpoint: "https://ok"}, {Endpoint: "https://gone"}, {Endpoint: "https://broken"}},
		due:  []db.ClaimDueRemindersRow{{IsInactive: true, DaysInactive: 4, HasPush: true}},
	}
	sender := &fakeSender{results: map[string]error{"https://gone": errGone, "https://broken": errors.New("503")}}
	notifier := &fakeNotifier{}
	svc := NewReminderService(repo, sender, "pub", notifier)

	if err := svc.RunDue(context.Background()); err != nil {
		t.Fatalf("RunDue: %v", err)
	}
	if len(sender.payloads) != 3 {
		t.Fatalf("muốn gửi tới 3 subscription, gửi %d", len(sender.payloads))
	}
	if p := sender.payloads[0]; !strings.Contains(p.Body, "4 ngày") || p.URL != "/review" {
		t.Errorf("payload nhắc bỏ học sai: %+v", p)
	}
	if len(notifier.sent) != 1 || notifier.sent[0].Type != NotificationStudyReminder || !strings.Contains(notifier.sent[0].Body, "4 ngày") {
		t.Errorf("phải tạo 1 thông báo nhắc học trong chuông, nhận %+v", notifier.sent)
	}
	if !slices.Equal(repo.deleted, []string{"https://gone"}) {
		t.Errorf("chỉ được xoá subscription hết hạn, đã xoá %v", repo.deleted)
	}

	sent, total, err := svc.sendToUser(context.Background(), uuid.New(), pushPayload{Title: "x"})
	if err != nil || sent != 1 || total != 3 {
		t.Errorf("sendToUser: muốn gửi được 1/3 (bỏ gone + broken), nhận %d/%d, err=%v", sent, total, err)
	}
}

func TestReminderServiceWithoutPushConfig(t *testing.T) {
	svc := NewReminderService(&fakeReminderRepo{}, nil, "", &fakeNotifier{})
	if _, ok := svc.PushPublicKey(); ok {
		t.Error("chưa cấu hình VAPID mà PushPublicKey báo ok")
	}
	if _, err := svc.SendTest(context.Background(), uuid.New()); !errors.Is(err, ErrPushNotConfigured) {
		t.Errorf("SendTest: muốn ErrPushNotConfigured, nhận %v", err)
	}
	if err := svc.Subscribe(context.Background(), uuid.New(), PushSubscriptionRequest{}); !errors.Is(err, ErrPushNotConfigured) {
		t.Errorf("Subscribe: muốn ErrPushNotConfigured, nhận %v", err)
	}
}

type fakeNotifier struct{ sent []NotificationInput }

func (f *fakeNotifier) Notify(_ context.Context, _ uuid.UUID, n NotificationInput) {
	f.sent = append(f.sent, n)
}

func TestRunDueWithoutPushStillNotifiesInApp(t *testing.T) {
	notifier := &fakeNotifier{}
	svc := NewReminderService(&fakeReminderRepo{due: []db.ClaimDueRemindersRow{{}}}, nil, "", notifier)
	if err := svc.RunDue(context.Background()); err != nil {
		t.Fatalf("RunDue: %v", err)
	}
	if len(notifier.sent) != 1 || notifier.sent[0].Type != NotificationStudyReminder {
		t.Errorf("chưa cấu hình push vẫn phải nhắc trong chuông, nhận %+v", notifier.sent)
	}
}

func TestRunDueSkipsPushForUsersWithoutSubscription(t *testing.T) {
	sender := &fakeSender{}
	notifier := &fakeNotifier{}
	svc := NewReminderService(&fakeReminderRepo{due: []db.ClaimDueRemindersRow{{HasPush: false}}}, sender, "pub", notifier)
	if err := svc.RunDue(context.Background()); err != nil {
		t.Fatalf("RunDue: %v", err)
	}
	if len(sender.payloads) != 0 {
		t.Errorf("user chưa đăng ký push thì không được gọi gửi push, đã gửi %d", len(sender.payloads))
	}
	if len(notifier.sent) != 1 || !notifier.sent[0].ReplaceUnread || notifier.sent[0].Icon != "lac" || notifier.sent[0].Title != "Đến giờ học rồi!" {
		t.Errorf("nhắc trong chuông phải thay bản chưa đọc cũ, icon chim Lạc, tiêu đề không emoji: %+v", notifier.sent)
	}
}

func TestSendToUserRoutesByKind(t *testing.T) {
	repo := &fakeReminderRepo{subs: []db.PushSubscription{
		{Endpoint: "https://web", Kind: pushKindWeb}, {Endpoint: "fcm-token", Kind: pushKindFCM},
	}}
	web := &fakeSender{}
	svc := NewReminderService(repo, web, "pub", &fakeNotifier{})

	// Chưa cấu hình FCM: chỉ gửi web push, token FCM giữ nguyên (không tính vào số đã thử)
	sent, total, err := svc.sendToUser(context.Background(), uuid.New(), pushPayload{Title: "x"})
	if err != nil || sent != 1 || total != 1 || len(web.payloads) != 1 {
		t.Errorf("chỉ web push: nhận %d/%d (web gửi %d), err=%v", sent, total, len(web.payloads), err)
	}

	native := &fakeSender{}
	svc.SetNativeSender(native)
	sent, total, _ = svc.sendToUser(context.Background(), uuid.New(), pushPayload{Title: "x"})
	if sent != 2 || total != 2 || len(native.payloads) != 1 || len(web.payloads) != 2 {
		t.Errorf("web + FCM: nhận %d/%d (web %d, fcm %d)", sent, total, len(web.payloads), len(native.payloads))
	}

	// Chỉ có FCM (không VAPID) vẫn gửi nhắc học
	fcmOnly := NewReminderService(repo, nil, "", &fakeNotifier{})
	fcmOnly.SetNativeSender(&fakeSender{})
	if _, err := fcmOnly.SendTest(context.Background(), uuid.New()); err != nil {
		t.Errorf("chỉ FCM: SendTest lỗi %v", err)
	}
	if err := fcmOnly.SubscribeNative(context.Background(), uuid.New(), NativePushRequest{Token: "a b"}); !errors.Is(err, ErrInvalidInput) {
		t.Errorf("token có khoảng trắng phải bị từ chối: %v", err)
	}
}
