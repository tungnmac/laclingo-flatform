package service

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Loại thông báo trong app — khớp cột notifications.type
const (
	NotificationMissionCompleted = "mission_completed"
	NotificationLevelUp          = "level_up"
	NotificationStudyReminder    = "study_reminder"
	NotificationBlogComment      = "blog_comment"
	NotificationBlogReply        = "blog_reply"
	NotificationAnnouncement     = "announcement"
)

const (
	defaultNotificationPageSize = 20
	maxNotificationPageSize     = 50
	maxNotificationTitleLen     = 200 // notifications.title / announcements.title VARCHAR(200)
	maxAnnouncementBodyLen      = 2000
)

// NotificationRepository — thông báo trong app (chuông) và thông báo chung của admin
type NotificationRepository interface {
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
	CreateNotification(ctx context.Context, arg db.CreateNotificationParams) error
	ListNotifications(ctx context.Context, arg db.ListNotificationsParams) ([]db.Notification, error)
	CountUnreadNotifications(ctx context.Context, userID pgtype.UUID) (int32, error)
	MarkNotificationRead(ctx context.Context, arg db.MarkNotificationReadParams) (int64, error)
	MarkAllNotificationsRead(ctx context.Context, userID pgtype.UUID) (int64, error)
	DeleteNotification(ctx context.Context, arg db.DeleteNotificationParams) (int64, error)
	DeleteAllNotifications(ctx context.Context, userID pgtype.UUID) (int64, error)
	ListAnnouncements(ctx context.Context, arg db.ListAnnouncementsParams) ([]db.ListAnnouncementsRow, error)
	DeleteAnnouncement(ctx context.Context, id pgtype.UUID) (int64, error)
}

// Notifier — nơi phát sinh sự kiện (nhiệm vụ, blog, nhắc học) tạo thông báo
// cho 1 user. Lỗi chỉ log: thông báo không được làm hỏng hành động chính.
type Notifier interface {
	Notify(ctx context.Context, userID uuid.UUID, n NotificationInput)
}

// NotificationInput — nội dung 1 thông báo (text tiếng Việt, tạo sẵn lúc phát sinh sự kiện)
type NotificationInput struct {
	Type  string
	Title string
	Body  string
	URL   string // đường dẫn trong app khi bấm vào, để trống = không điều hướng
	Icon  string
}

// Notification — 1 thông báo trong chuông
type Notification struct {
	ID        uuid.UUID  `json:"id" swaggertype:"string" format:"uuid"`
	Type      string     `json:"type" example:"mission_completed"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	URL       string     `json:"url,omitempty" example:"/missions"`
	Icon      string     `json:"icon" example:"🎯"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// NotificationPage — 1 trang thông báo, mới nhất trước. NextCursor rỗng = hết.
type NotificationPage struct {
	Items       []Notification `json:"items"`
	UnreadCount int32          `json:"unread_count"`
	NextCursor  string         `json:"next_cursor,omitempty"`
}

// AnnouncementRequest — admin soạn thông báo chung gửi tới mọi học viên
type AnnouncementRequest struct {
	Title string `json:"title" example:"Bảo trì hệ thống tối nay"`
	Body  string `json:"body" example:"LacLingo sẽ bảo trì từ 23:00 tới 23:30."`
	URL   string `json:"url,omitempty" example:"/blog"` // đường dẫn trong app (bắt đầu bằng /)
}

type Announcement struct {
	ID             uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Title          string    `json:"title"`
	Body           string    `json:"body"`
	URL            string    `json:"url,omitempty"`
	RecipientCount int32     `json:"recipient_count"`
	ReadCount      int32     `json:"read_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type NotificationService struct {
	repo NotificationRepository
}

func NewNotificationService(repo NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

// Notify tạo 1 thông báo — xem Notifier
func (s *NotificationService) Notify(ctx context.Context, userID uuid.UUID, n NotificationInput) {
	if n.Icon == "" {
		n.Icon = "🔔"
	}
	err := s.repo.CreateNotification(ctx, db.CreateNotificationParams{
		UserID: toPgUUID(userID), Type: n.Type, Title: truncateRunes(n.Title, maxNotificationTitleLen), Body: n.Body,
		Url: pgtype.Text{String: n.URL, Valid: n.URL != ""}, Icon: n.Icon,
	})
	if err != nil {
		log.Printf("❌ notification: tạo thông báo %s user=%s: %v", n.Type, userID, err)
	}
}

// List trả 1 trang thông báo. cursor = NextCursor của trang trước ("" = trang đầu).
func (s *NotificationService) List(ctx context.Context, userID uuid.UUID, cursor string, limit int32) (NotificationPage, error) {
	if limit <= 0 {
		limit = defaultNotificationPageSize
	}
	limit = min(limit, maxNotificationPageSize)
	arg := db.ListNotificationsParams{UserID: toPgUUID(userID), Limit: limit + 1} // +1 để biết còn trang sau
	if cursor != "" {
		at, id, err := parseNotificationCursor(cursor)
		if err != nil {
			return NotificationPage{}, err
		}
		arg.BeforeCreatedAt = pgtype.Timestamptz{Time: at, Valid: true}
		arg.BeforeID = toPgUUID(id)
	}
	rows, err := s.repo.ListNotifications(ctx, arg)
	if err != nil {
		return NotificationPage{}, err
	}
	unread, err := s.repo.CountUnreadNotifications(ctx, toPgUUID(userID))
	if err != nil {
		return NotificationPage{}, err
	}
	page := NotificationPage{Items: make([]Notification, 0, len(rows)), UnreadCount: unread}
	if int32(len(rows)) > limit {
		rows = rows[:limit]
		last := rows[len(rows)-1]
		page.NextCursor = formatNotificationCursor(last.CreatedAt.Time, uuid.UUID(last.ID.Bytes))
	}
	for _, r := range rows {
		page.Items = append(page.Items, toNotification(r))
	}
	return page, nil
}

func (s *NotificationService) UnreadCount(ctx context.Context, userID uuid.UUID) (int32, error) {
	return s.repo.CountUnreadNotifications(ctx, toPgUUID(userID))
}

func (s *NotificationService) MarkRead(ctx context.Context, userID, id uuid.UUID) error {
	n, err := s.repo.MarkNotificationRead(ctx, db.MarkNotificationReadParams{ID: toPgUUID(id), UserID: toPgUUID(userID)})
	if err == nil && n == 0 {
		return ErrNotFound
	}
	return err
}

func (s *NotificationService) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	_, err := s.repo.MarkAllNotificationsRead(ctx, toPgUUID(userID))
	return err
}

func (s *NotificationService) Delete(ctx context.Context, userID, id uuid.UUID) error {
	n, err := s.repo.DeleteNotification(ctx, db.DeleteNotificationParams{ID: toPgUUID(id), UserID: toPgUUID(userID)})
	if err == nil && n == 0 {
		return ErrNotFound
	}
	return err
}

// Clear xoá toàn bộ thông báo của user
func (s *NotificationService) Clear(ctx context.Context, userID uuid.UUID) error {
	_, err := s.repo.DeleteAllNotifications(ctx, toPgUUID(userID))
	return err
}

// ===== Thông báo chung (admin) =====

// CreateAnnouncement lưu thông báo chung và gửi vào chuông của mọi tài khoản đang active (1 transaction)
func (s *NotificationService) CreateAnnouncement(ctx context.Context, adminID uuid.UUID, req AnnouncementRequest) (Announcement, error) {
	req.Title, req.Body, req.URL = strings.TrimSpace(req.Title), strings.TrimSpace(req.Body), strings.TrimSpace(req.URL)
	switch {
	case req.Title == "" || utf8.RuneCountInString(req.Title) > maxNotificationTitleLen:
		return Announcement{}, fmt.Errorf("tiêu đề bắt buộc, tối đa %d ký tự: %w", maxNotificationTitleLen, ErrInvalidInput)
	case utf8.RuneCountInString(req.Body) > maxAnnouncementBodyLen:
		return Announcement{}, fmt.Errorf("nội dung tối đa %d ký tự: %w", maxAnnouncementBodyLen, ErrInvalidInput)
	case req.URL != "" && !isInAppPath(req.URL):
		return Announcement{}, fmt.Errorf("đường dẫn phải là 1 trang trong app, bắt đầu bằng /: %w", ErrInvalidInput)
	}

	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return Announcement{}, err
	}
	defer tx.Rollback(ctx)
	qtx := s.repo.WithTx(tx)

	a, err := qtx.CreateAnnouncement(ctx, db.CreateAnnouncementParams{
		Title: req.Title, Body: req.Body, Url: pgtype.Text{String: req.URL, Valid: req.URL != ""}, CreatedBy: toPgUUID(adminID),
	})
	if err != nil {
		return Announcement{}, err
	}
	sent, err := qtx.FanOutAnnouncement(ctx, a.ID)
	if err != nil {
		return Announcement{}, err
	}
	a, err = qtx.SetAnnouncementRecipientCount(ctx, db.SetAnnouncementRecipientCountParams{ID: a.ID, RecipientCount: int32(sent)})
	if err != nil {
		return Announcement{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Announcement{}, err
	}
	return toAnnouncement(a, 0), nil
}

func (s *NotificationService) ListAnnouncements(ctx context.Context, page, pageSize int32) (PageResult[Announcement], error) {
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListAnnouncements(ctx, db.ListAnnouncementsParams{Limit: limit, Offset: offset})
	if err != nil {
		return PageResult[Announcement]{}, err
	}
	result := PageResult[Announcement]{Items: make([]Announcement, 0, len(rows))}
	for _, r := range rows {
		result.Total = r.TotalCount
		result.Items = append(result.Items, toAnnouncement(db.Announcement{
			ID: r.ID, Title: r.Title, Body: r.Body, Url: r.Url, RecipientCount: r.RecipientCount, CreatedAt: r.CreatedAt,
		}, r.ReadCount))
	}
	return result, nil
}

// DeleteAnnouncement xoá thông báo chung — thu hồi luôn khỏi chuông của mọi user (ON DELETE CASCADE)
func (s *NotificationService) DeleteAnnouncement(ctx context.Context, id uuid.UUID) error {
	n, err := s.repo.DeleteAnnouncement(ctx, toPgUUID(id))
	if err == nil && n == 0 {
		return ErrNotFound
	}
	return err
}

// ===== Helpers =====

func toNotification(r db.Notification) Notification {
	n := Notification{
		ID: uuid.UUID(r.ID.Bytes), Type: r.Type, Title: r.Title, Body: r.Body, URL: r.Url.String, Icon: r.Icon,
		CreatedAt: r.CreatedAt.Time,
	}
	if r.ReadAt.Valid {
		t := r.ReadAt.Time
		n.ReadAt = &t
	}
	return n
}

func toAnnouncement(a db.Announcement, readCount int32) Announcement {
	return Announcement{
		ID: uuid.UUID(a.ID.Bytes), Title: a.Title, Body: a.Body, URL: a.Url.String,
		RecipientCount: a.RecipientCount, ReadCount: readCount, CreatedAt: a.CreatedAt.Time,
	}
}

// Con trỏ phân trang: "<created_at RFC3339Nano>_<id>"
func formatNotificationCursor(at time.Time, id uuid.UUID) string {
	return at.UTC().Format(time.RFC3339Nano) + "_" + id.String()
}

func parseNotificationCursor(cursor string) (time.Time, uuid.UUID, error) {
	invalid := fmt.Errorf("cursor không hợp lệ: %w", ErrInvalidInput)
	ts, idStr, ok := strings.Cut(cursor, "_")
	if !ok {
		return time.Time{}, uuid.Nil, invalid
	}
	at, err := time.Parse(time.RFC3339Nano, ts)
	if err != nil {
		return time.Time{}, uuid.Nil, invalid
	}
	id, err := uuid.Parse(idStr)
	if err != nil {
		return time.Time{}, uuid.Nil, invalid
	}
	return at, id, nil
}

// isInAppPath — chỉ nhận đường dẫn tương đối trong app ("/blog"), không nhận "//evil.com" hay URL tuyệt đối
func isInAppPath(p string) bool {
	return strings.HasPrefix(p, "/") && !strings.HasPrefix(p, "//") && !strings.ContainsAny(p, "\\ \t\n")
}

func truncateRunes(s string, max int) string {
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	r := []rune(s)
	return string(r[:max-1]) + "…"
}
