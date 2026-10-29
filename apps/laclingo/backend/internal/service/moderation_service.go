package service

import (
	"context"
	"errors"
	"fmt"
	"html"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Báo cáo + chặn nội dung do học viên tạo (bài blog, bình luận) — App Store (Guideline 1.2) và Google Play (UGC) bắt
// buộc: học viên báo cáo được nội dung vi phạm, chặn được người dùng khác; admin xử lý báo cáo ở /admin/blog/reports.

const (
	ReportTargetPost    = "post"
	ReportTargetComment = "comment"
	ReportTargetChat    = "chat" // tin nhắn phòng thử thách (game_chat_messages)

	maxReportNoteLen = 500
	// Đủ số người khác nhau báo cáo 1 nội dung → tự ẩn chờ admin xem xét (không phải chờ admin mới gỡ nội dung xấu)
	reportAutoHideThreshold = 3
)

var validReportReasons = map[string]bool{"spam": true, "harassment": true, "hate": true, "sexual": true, "violence": true, "other": true}

type ModerationRepository interface {
	CreateContentReport(ctx context.Context, arg db.CreateContentReportParams) (db.ContentReport, error)
	CountOpenReporters(ctx context.Context, arg db.CountOpenReportersParams) (int32, error)
	ListReportedContent(ctx context.Context, arg db.ListReportedContentParams) ([]db.ListReportedContentRow, error)
	ResolveContentReports(ctx context.Context, arg db.ResolveContentReportsParams) (int64, error)
	MarkReportAutoHidden(ctx context.Context, id pgtype.UUID) error
	HasAutoHiddenOpenReport(ctx context.Context, arg db.HasAutoHiddenOpenReportParams) (bool, error)
	BlockUser(ctx context.Context, arg db.BlockUserParams) error
	UnblockUser(ctx context.Context, arg db.UnblockUserParams) error
	ListBlockedUsers(ctx context.Context, blockerID pgtype.UUID) ([]db.ListBlockedUsersRow, error)
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetBlogPostByID(ctx context.Context, id pgtype.UUID) (db.BlogPost, error)
	GetBlogCommentByID(ctx context.Context, id pgtype.UUID) (db.BlogComment, error)
	HideBlogPost(ctx context.Context, id pgtype.UUID) error
	UnhideBlogPost(ctx context.Context, id pgtype.UUID) error
	HideBlogComment(ctx context.Context, id pgtype.UUID) error
	UnhideBlogComment(ctx context.Context, id pgtype.UUID) error
	GetGameChatMessage(ctx context.Context, id pgtype.UUID) (db.GameChatMessage, error)
	SetGameChatMessageHidden(ctx context.Context, arg db.SetGameChatMessageHiddenParams) error
}

type ModerationService struct {
	repo ModerationRepository
}

func NewModerationService(repo ModerationRepository) *ModerationService {
	return &ModerationService{repo: repo}
}

// ReportRequest — học viên báo cáo 1 bài viết / bình luận / tin nhắn chat phòng thử thách
type ReportRequest struct {
	TargetType string    `json:"target_type" enums:"post,comment,chat"`
	TargetID   uuid.UUID `json:"target_id" swaggertype:"string" format:"uuid"`
	Reason     string    `json:"reason" enums:"spam,harassment,hate,sexual,violence,other"`
	Note       string    `json:"note" maxLength:"500"`
}

type ReportResult struct {
	AutoHidden bool `json:"auto_hidden"` // đủ người báo cáo → nội dung đã tự ẩn chờ admin
}

// targetAuthor — tác giả của nội dung bị báo cáo (ErrNotFound nếu không còn)
func (s *ModerationService) targetAuthor(ctx context.Context, targetType string, id uuid.UUID) (uuid.UUID, error) {
	var author pgtype.UUID
	var err error
	switch targetType {
	case ReportTargetPost:
		var p db.BlogPost
		p, err = s.repo.GetBlogPostByID(ctx, toPgUUID(id))
		author = p.AuthorID
	case ReportTargetComment:
		var c db.BlogComment
		c, err = s.repo.GetBlogCommentByID(ctx, toPgUUID(id))
		author = c.AuthorID
	case ReportTargetChat:
		var m db.GameChatMessage
		m, err = s.repo.GetGameChatMessage(ctx, toPgUUID(id))
		author = m.UserID
	default:
		return uuid.Nil, fmt.Errorf("loại nội dung không hợp lệ: %w", ErrInvalidInput)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, ErrNotFound
	}
	return uuid.UUID(author.Bytes), err
}

func (s *ModerationService) hide(ctx context.Context, targetType string, id uuid.UUID, hidden bool) error {
	switch {
	case targetType == ReportTargetChat:
		// Tin nhắn chat đã phát tức thời — đánh dấu để lưu vết xử lý (không còn hiện ở đâu để ẩn)
		return s.repo.SetGameChatMessageHidden(ctx, db.SetGameChatMessageHiddenParams{ID: toPgUUID(id), IsHidden: hidden})
	case targetType == ReportTargetPost && hidden:
		return s.repo.HideBlogPost(ctx, toPgUUID(id))
	case targetType == ReportTargetPost:
		return s.repo.UnhideBlogPost(ctx, toPgUUID(id))
	case hidden:
		return s.repo.HideBlogComment(ctx, toPgUUID(id))
	default:
		return s.repo.UnhideBlogComment(ctx, toPgUUID(id))
	}
}

// Report — học viên báo cáo nội dung vi phạm. Mỗi người 1 báo cáo đang mở / nội dung; không báo cáo nội dung của mình.
func (s *ModerationService) Report(ctx context.Context, reporterID uuid.UUID, req ReportRequest) (ReportResult, error) {
	req.Note = strings.TrimSpace(req.Note)
	if !validReportReasons[req.Reason] || utf8.RuneCountInString(req.Note) > maxReportNoteLen {
		return ReportResult{}, fmt.Errorf("lý do báo cáo không hợp lệ: %w", ErrInvalidInput)
	}
	author, err := s.targetAuthor(ctx, req.TargetType, req.TargetID)
	if err != nil {
		return ReportResult{}, err
	}
	if author == reporterID {
		return ReportResult{}, fmt.Errorf("không thể báo cáo nội dung của chính bạn: %w", ErrInvalidInput)
	}
	report, err := s.repo.CreateContentReport(ctx, db.CreateContentReportParams{
		ReporterID: toPgUUID(reporterID), TargetType: req.TargetType, TargetID: toPgUUID(req.TargetID), Reason: req.Reason, Note: req.Note,
	})
	if isPgError(err, pgUniqueViolation) {
		return ReportResult{}, fmt.Errorf("bạn đã báo cáo nội dung này, quản trị viên đang xem xét: %w", ErrDuplicate)
	}
	if err != nil {
		return ReportResult{}, err
	}
	n, err := s.repo.CountOpenReporters(ctx, db.CountOpenReportersParams{TargetType: req.TargetType, TargetID: toPgUUID(req.TargetID)})
	if err != nil {
		return ReportResult{}, err
	}
	if n < reportAutoHideThreshold {
		return ReportResult{}, nil
	}
	if err := s.hide(ctx, req.TargetType, req.TargetID, true); err != nil {
		return ReportResult{}, err
	}
	return ReportResult{AutoHidden: true}, s.repo.MarkReportAutoHidden(ctx, report.ID)
}

// ===== Chặn người dùng =====

type BlockedUser struct {
	ID        uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Username  string    `json:"username"`
	FullName  string    `json:"full_name,omitempty"`
	AvatarURL string    `json:"avatar_url,omitempty"`
	BlockedAt time.Time `json:"blocked_at"`
}

func (s *ModerationService) Block(ctx context.Context, blockerID, blockedID uuid.UUID) error {
	if blockerID == blockedID {
		return fmt.Errorf("không thể tự chặn chính mình: %w", ErrInvalidInput)
	}
	if _, err := s.repo.GetUserByID(ctx, toPgUUID(blockedID)); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return err
	}
	return s.repo.BlockUser(ctx, db.BlockUserParams{BlockerID: toPgUUID(blockerID), BlockedID: toPgUUID(blockedID)})
}

func (s *ModerationService) Unblock(ctx context.Context, blockerID, blockedID uuid.UUID) error {
	return s.repo.UnblockUser(ctx, db.UnblockUserParams{BlockerID: toPgUUID(blockerID), BlockedID: toPgUUID(blockedID)})
}

func (s *ModerationService) ListBlocked(ctx context.Context, blockerID uuid.UUID) ([]BlockedUser, error) {
	rows, err := s.repo.ListBlockedUsers(ctx, toPgUUID(blockerID))
	if err != nil {
		return nil, err
	}
	out := make([]BlockedUser, 0, len(rows))
	for _, r := range rows {
		out = append(out, BlockedUser{
			ID: uuid.UUID(r.ID.Bytes), Username: r.Username, FullName: optionalText(r.FullName), AvatarURL: optionalText(r.AvatarUrl),
			BlockedAt: r.CreatedAt.Time,
		})
	}
	return out, nil
}

// ===== Admin =====

// ReportedContent — 1 nội dung bị báo cáo (gom mọi báo cáo của nó) trong hàng chờ admin
type ReportedContent struct {
	TargetType     string    `json:"target_type" enums:"post,comment,chat"`
	TargetID       uuid.UUID `json:"target_id" swaggertype:"string" format:"uuid"`
	RoomCode       string    `json:"room_code,omitempty"` // tin nhắn chat: mã phòng thử thách
	ReportCount    int32     `json:"report_count"`
	Reasons        []string  `json:"reasons"`
	Notes          string    `json:"notes,omitempty"`
	LastReportedAt time.Time `json:"last_reported_at"`
	PostID         string    `json:"post_id,omitempty"` // mở bài (bình luận: bài chứa nó)
	PostTitle      string    `json:"post_title,omitempty"`
	Excerpt        string    `json:"excerpt"`
	AuthorID       string    `json:"author_id,omitempty"`
	AuthorUsername string    `json:"author_username,omitempty"`
	IsHidden       bool      `json:"is_hidden"`
	Deleted        bool      `json:"deleted"` // nội dung đã bị xoá
}

// reportExcerpt — xem trước nội dung bị báo cáo: bài viết là HTML (bỏ thẻ); bình luận / chat là chữ thuần — giữ
// nguyên ký tự người dùng đã gõ (vd "<3"), chỉ gộp khoảng trắng + cắt ngắn
func reportExcerpt(targetType, content string) string {
	if targetType == ReportTargetPost {
		return html.UnescapeString(excerpt(content))
	}
	return truncateRunes(strings.Join(strings.Fields(content), " "), excerptLen)
}

var validReportStatuses = map[string]bool{"OPEN": true, "RESOLVED": true, "DISMISSED": true}

func (s *ModerationService) ListReports(ctx context.Context, status string, page, pageSize int32) (PageResult[ReportedContent], error) {
	if status == "" {
		status = "OPEN"
	}
	if !validReportStatuses[status] {
		return PageResult[ReportedContent]{}, fmt.Errorf("trạng thái không hợp lệ: %w", ErrInvalidInput)
	}
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListReportedContent(ctx, db.ListReportedContentParams{Status: status, Limit: limit, Offset: offset})
	if err != nil {
		return PageResult[ReportedContent]{}, err
	}
	items := make([]ReportedContent, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = int64(r.TotalCount)
		item := ReportedContent{
			TargetType: r.TargetType, TargetID: uuid.UUID(r.TargetID.Bytes), ReportCount: r.ReportCount, Reasons: r.Reasons,
			Notes: r.Notes, LastReportedAt: r.LastReportedAt.Time, PostTitle: r.PostTitle, AuthorUsername: r.AuthorUsername,
			Excerpt: reportExcerpt(r.TargetType, r.Content), RoomCode: r.RoomCode,
			IsHidden: r.IsHidden, Deleted: r.Deleted,
		}
		if r.PostID.Valid {
			item.PostID = uuid.UUID(r.PostID.Bytes).String()
		}
		if r.AuthorID.Valid {
			item.AuthorID = uuid.UUID(r.AuthorID.Bytes).String()
		}
		items = append(items, item)
	}
	return PageResult[ReportedContent]{Items: items, Total: total}, nil
}

// ResolveRequest — admin xử lý 1 nội dung bị báo cáo: "hide" = vi phạm, ẩn nội dung; "dismiss" = không vi phạm, bỏ
// qua (bỏ ẩn nếu đã tự ẩn vì đủ người báo cáo)
type ResolveRequest struct {
	Action string `json:"action" enums:"hide,dismiss"`
}

func (s *ModerationService) Resolve(ctx context.Context, adminID uuid.UUID, targetType string, targetID uuid.UUID, req ResolveRequest) error {
	status := map[string]string{"hide": "RESOLVED", "dismiss": "DISMISSED"}[req.Action]
	if status == "" || (targetType != ReportTargetPost && targetType != ReportTargetComment && targetType != ReportTargetChat) {
		return fmt.Errorf("thao tác không hợp lệ: %w", ErrInvalidInput)
	}
	// Ẩn / gỡ ẩn TRƯỚC rồi mới đóng báo cáo — bước ẩn lỗi thì báo cáo vẫn mở để admin xử lý lại
	if _, err := s.targetAuthor(ctx, targetType, targetID); err == nil {
		switch req.Action {
		case "hide":
			err = s.hide(ctx, targetType, targetID, true)
		case "dismiss":
			// Chỉ gỡ ẩn khi nội dung bị ẩn vì đủ người báo cáo — không gỡ ẩn do admin tự ẩn
			var auto bool
			if auto, err = s.repo.HasAutoHiddenOpenReport(ctx, db.HasAutoHiddenOpenReportParams{TargetType: targetType, TargetID: toPgUUID(targetID)}); err == nil && auto {
				err = s.hide(ctx, targetType, targetID, false)
			}
		}
		if err != nil {
			return err
		}
	} else if !errors.Is(err, ErrNotFound) {
		return err
	} // nội dung đã bị xoá — chỉ đóng báo cáo
	n, err := s.repo.ResolveContentReports(ctx, db.ResolveContentReportsParams{
		TargetType: targetType, TargetID: toPgUUID(targetID), Status: status, ResolvedBy: toPgUUID(adminID),
	})
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
