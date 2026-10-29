package service

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"
	"laclingo-backend/internal/storage"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// OnboardingRepository — dữ liệu cho luồng thiết lập lần đầu đăng nhập (thông tin cơ bản, ảnh đại diện, ngôn ngữ
// đang học + trình độ, chủ đề yêu thích)
type OnboardingRepository interface {
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	MarkUserOnboarded(ctx context.Context, id pgtype.UUID) (db.User, error)
	ListUserTargetLanguages(ctx context.Context, userID pgtype.UUID) ([]db.ListUserTargetLanguagesRow, error)
	ListUserPreferredTopics(ctx context.Context, userID pgtype.UUID) ([]db.ListUserPreferredTopicsRow, error)
	CreateUserAvatar(ctx context.Context, arg db.CreateUserAvatarParams) (db.UserAvatar, error)
	GetUserAvatarByID(ctx context.Context, id pgtype.UUID) (db.UserAvatar, error)
	BeginTx(ctx context.Context) (pgx.Tx, error)
	WithTx(tx pgx.Tx) *db.Queries
}

const (
	maxBioLen            = 300
	maxTargetLanguages   = 5
	maxTopicsPerLanguage = 20
	maxTopicLen          = 100
	avatarPresignTTL     = 1 * time.Hour
	avatarPathPrefix     = "/users/avatars/"
	minBirthYear         = 1900
	minAge               = 3 // năm sinh hợp lệ: 1900 .. (năm nay - 3)
)

var (
	countryCodeRe  = regexp.MustCompile(`^[A-Z]{2}$`)
	languageCodeRe = regexp.MustCompile(`^[a-z]{2,3}(-[A-Za-z]{2,4})?$`)
	validCEFR      = map[string]bool{"A1": true, "A2": true, "B1": true, "B2": true, "C1": true, "C2": true}
	// Ảnh tải lên qua POST /users/me/avatar → avatar_url tương đối "/users/avatars/<uuid>" (web ghép địa chỉ API)
	uploadedAvatarRe = regexp.MustCompile(`^/users/avatars/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
)

// isAvatarURL — avatar_url hợp lệ: link http(s) (kể cả avatar mẫu của web) hoặc ảnh đã tải lên
func isAvatarURL(raw string) bool {
	return isHTTPURL(raw) || uploadedAvatarRe.MatchString(raw)
}

type TargetLanguage struct {
	LanguageID string `json:"language_id" example:"en"`
	Level      string `json:"level" example:"A1" enums:"A1,A2,B1,B2,C1,C2"`
}

type PreferredTopic struct {
	LanguageID string `json:"language_id" example:"en"`
	Topic      string `json:"topic" example:"Du lịch"`
}

// OnboardingResponse — trạng thái onboarding hiện tại (điền sẵn khi mở lại từ Hồ sơ)
type OnboardingResponse struct {
	User            UserResponse     `json:"user"`
	TargetLanguages []TargetLanguage `json:"target_languages"`
	PreferredTopics []PreferredTopic `json:"preferred_topics"`
}

// SaveOnboardingRequest — ghi đè toàn bộ (field rỗng = xoá). complete=true đánh dấu đã xong onboarding.
type SaveOnboardingRequest struct {
	FullName        string           `json:"full_name" maxLength:"100"`
	AvatarURL       string           `json:"avatar_url"`
	Country         string           `json:"country" example:"VN"`
	NativeLanguage  string           `json:"native_language" example:"vi"`
	BirthYear       *int             `json:"birth_year" example:"2000"`
	Bio             string           `json:"bio" maxLength:"300"`
	TargetLanguages []TargetLanguage `json:"target_languages"`
	PreferredTopics []PreferredTopic `json:"preferred_topics"`
	Complete        bool             `json:"complete"`
}

type AvatarUploadResponse struct {
	ID  uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	URL string    `json:"url" example:"/users/avatars/3fa85f64-5717-4562-b3fc-2c963f66afa6"`
}

type OnboardingService struct {
	repo OnboardingRepository
	r2   *storage.R2Client
	now  func() time.Time
}

func NewOnboardingService(repo OnboardingRepository, r2 *storage.R2Client) *OnboardingService {
	return &OnboardingService{repo: repo, r2: r2, now: time.Now}
}

func (s *OnboardingService) Get(ctx context.Context, userID uuid.UUID) (OnboardingResponse, error) {
	u, err := s.repo.GetUserByID(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return OnboardingResponse{}, ErrNotFound
	}
	if err != nil {
		return OnboardingResponse{}, err
	}
	targets, err := s.repo.ListUserTargetLanguages(ctx, toPgUUID(userID))
	if err != nil {
		return OnboardingResponse{}, err
	}
	topics, err := s.repo.ListUserPreferredTopics(ctx, toPgUUID(userID))
	if err != nil {
		return OnboardingResponse{}, err
	}
	res := OnboardingResponse{User: toUserResponse(u), TargetLanguages: []TargetLanguage{}, PreferredTopics: []PreferredTopic{}}
	for _, t := range targets {
		res.TargetLanguages = append(res.TargetLanguages, TargetLanguage{LanguageID: t.LanguageID, Level: t.Level})
	}
	for _, t := range topics {
		res.PreferredTopics = append(res.PreferredTopics, PreferredTopic{LanguageID: t.LanguageID, Topic: t.Topic})
	}
	return res, nil
}

func optionalPgText(v string) pgtype.Text {
	return pgtype.Text{String: v, Valid: v != ""}
}

// validate chuẩn hoá + kiểm tra request; trả lỗi ErrInvalidInput kèm lý do
func (s *OnboardingService) validate(req *SaveOnboardingRequest) error {
	req.FullName = strings.TrimSpace(req.FullName)
	req.AvatarURL = strings.TrimSpace(req.AvatarURL)
	req.Country = strings.ToUpper(strings.TrimSpace(req.Country))
	req.NativeLanguage = strings.TrimSpace(req.NativeLanguage)
	req.Bio = strings.TrimSpace(req.Bio)

	if utf8.RuneCountInString(req.FullName) > maxFullNameLen {
		return fmt.Errorf("họ tên tối đa %d ký tự: %w", maxFullNameLen, ErrInvalidInput)
	}
	if req.AvatarURL != "" && !isAvatarURL(req.AvatarURL) {
		return fmt.Errorf("ảnh đại diện không hợp lệ: %w", ErrInvalidInput)
	}
	if req.Country != "" && !countryCodeRe.MatchString(req.Country) {
		return fmt.Errorf("mã quốc gia không hợp lệ: %w", ErrInvalidInput)
	}
	if req.NativeLanguage != "" && !languageCodeRe.MatchString(req.NativeLanguage) {
		return fmt.Errorf("mã ngôn ngữ mẹ đẻ không hợp lệ: %w", ErrInvalidInput)
	}
	if req.BirthYear != nil && (*req.BirthYear < minBirthYear || *req.BirthYear > s.now().Year()-minAge) {
		return fmt.Errorf("năm sinh không hợp lệ: %w", ErrInvalidInput)
	}
	if utf8.RuneCountInString(req.Bio) > maxBioLen {
		return fmt.Errorf("giới thiệu tối đa %d ký tự: %w", maxBioLen, ErrInvalidInput)
	}

	if len(req.TargetLanguages) > maxTargetLanguages {
		return fmt.Errorf("chọn tối đa %d ngôn ngữ: %w", maxTargetLanguages, ErrInvalidInput)
	}
	targets := make(map[string]bool, len(req.TargetLanguages))
	for i, t := range req.TargetLanguages {
		t.LanguageID = strings.TrimSpace(t.LanguageID)
		t.Level = strings.ToUpper(strings.TrimSpace(t.Level))
		if t.LanguageID == "" || targets[t.LanguageID] || !validCEFR[t.Level] {
			return fmt.Errorf("ngôn ngữ học / trình độ không hợp lệ: %w", ErrInvalidInput)
		}
		targets[t.LanguageID] = true
		req.TargetLanguages[i] = t
	}

	perLanguage := map[string]int{}
	seen := map[PreferredTopic]bool{}
	topics := req.PreferredTopics[:0]
	for _, t := range req.PreferredTopics {
		t.LanguageID = strings.TrimSpace(t.LanguageID)
		t.Topic = strings.TrimSpace(t.Topic)
		if !targets[t.LanguageID] || t.Topic == "" || utf8.RuneCountInString(t.Topic) > maxTopicLen {
			return fmt.Errorf("chủ đề yêu thích không hợp lệ: %w", ErrInvalidInput)
		}
		if seen[t] {
			continue
		}
		seen[t] = true
		if perLanguage[t.LanguageID]++; perLanguage[t.LanguageID] > maxTopicsPerLanguage {
			return fmt.Errorf("chọn tối đa %d chủ đề mỗi ngôn ngữ: %w", maxTopicsPerLanguage, ErrInvalidInput)
		}
		topics = append(topics, t)
	}
	req.PreferredTopics = topics
	return nil
}

// Save ghi toàn bộ dữ liệu onboarding trong 1 transaction (lưu từng bước cũng gọi hàm này với complete=false)
func (s *OnboardingService) Save(ctx context.Context, userID uuid.UUID, req SaveOnboardingRequest) (OnboardingResponse, error) {
	if err := s.validate(&req); err != nil {
		return OnboardingResponse{}, err
	}
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		return OnboardingResponse{}, err
	}
	defer tx.Rollback(ctx)
	q := s.repo.WithTx(tx)
	uid := toPgUUID(userID)

	params := db.UpdateUserOnboardingProfileParams{
		ID:             uid,
		FullName:       optionalPgText(req.FullName),
		AvatarUrl:      optionalPgText(req.AvatarURL),
		Country:        optionalPgText(req.Country),
		NativeLanguage: optionalPgText(req.NativeLanguage),
		Bio:            optionalPgText(req.Bio),
	}
	if req.BirthYear != nil {
		params.BirthYear = pgtype.Int2{Int16: int16(*req.BirthYear), Valid: true}
	}
	if _, err := q.UpdateUserOnboardingProfile(ctx, params); errors.Is(err, pgx.ErrNoRows) {
		return OnboardingResponse{}, ErrNotFound
	} else if err != nil {
		return OnboardingResponse{}, err
	}

	if err := q.DeleteUserTargetLanguages(ctx, uid); err != nil {
		return OnboardingResponse{}, err
	}
	for _, t := range req.TargetLanguages {
		err := q.InsertUserTargetLanguage(ctx, db.InsertUserTargetLanguageParams{UserID: uid, LanguageID: t.LanguageID, Level: t.Level})
		if isPgError(err, pgForeignKeyViolation) {
			return OnboardingResponse{}, fmt.Errorf("ngôn ngữ %q không tồn tại: %w", t.LanguageID, ErrInvalidInput)
		}
		if err != nil {
			return OnboardingResponse{}, err
		}
	}
	if err := q.DeleteUserPreferredTopics(ctx, uid); err != nil {
		return OnboardingResponse{}, err
	}
	for _, t := range req.PreferredTopics {
		if err := q.InsertUserPreferredTopic(ctx, db.InsertUserPreferredTopicParams{UserID: uid, LanguageID: t.LanguageID, Topic: t.Topic}); err != nil {
			return OnboardingResponse{}, err
		}
	}
	if req.Complete {
		if _, err := q.MarkUserOnboarded(ctx, uid); err != nil {
			return OnboardingResponse{}, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return OnboardingResponse{}, err
	}
	return s.Get(ctx, userID)
}

// Skip — "Để sau": không hỏi lại onboarding (mở lại được từ Hồ sơ)
func (s *OnboardingService) Skip(ctx context.Context, userID uuid.UUID) (UserResponse, error) {
	u, err := s.repo.MarkUserOnboarded(ctx, toPgUUID(userID))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// UploadAvatar lưu ảnh lên R2; avatar_url của user chỉ đổi khi lưu onboarding / hồ sơ với URL trả về.
// Loại ảnh + đuôi file nhận theo nội dung (như ảnh từ vựng), không tin Content-Type / tên file client gửi.
func (s *OnboardingService) UploadAvatar(ctx context.Context, userID uuid.UUID, content io.Reader, size int64) (AvatarUploadResponse, error) {
	if s.r2 == nil {
		return AvatarUploadResponse{}, fmt.Errorf("chưa cấu hình lưu trữ ảnh (R2) — hãy chọn ảnh có sẵn: %w", ErrInvalidInput)
	}
	buffered := bufio.NewReaderSize(content, 512)
	head, _ := buffered.Peek(512)
	contentType := http.DetectContentType(head)
	ext, ok := vocabularyImageExt[contentType]
	if !ok {
		return AvatarUploadResponse{}, fmt.Errorf("định dạng ảnh không hỗ trợ (%s): %w", contentType, ErrInvalidInput)
	}
	if size > maxImageBytes {
		return AvatarUploadResponse{}, fmt.Errorf("ảnh quá lớn (tối đa %dMB): %w", maxImageBytes/1024/1024, ErrInvalidInput)
	}
	key := fmt.Sprintf("avatars/%s/%s%s", userID, uuid.New(), ext)
	if err := s.r2.Upload(ctx, key, buffered, contentType); err != nil {
		return AvatarUploadResponse{}, fmt.Errorf("upload ảnh thất bại: %w", err)
	}
	avatar, err := s.repo.CreateUserAvatar(ctx, db.CreateUserAvatarParams{UserID: toPgUUID(userID), ImageKey: key})
	if err != nil {
		return AvatarUploadResponse{}, err
	}
	id := uuid.UUID(avatar.ID.Bytes)
	return AvatarUploadResponse{ID: id, URL: avatarPathPrefix + id.String()}, nil
}

// ResolveAvatarURL — route public GET /users/avatars/:id redirect sang URL presign (thẻ <img> không gửi được token)
func (s *OnboardingService) ResolveAvatarURL(ctx context.Context, id uuid.UUID) (string, error) {
	if s.r2 == nil {
		return "", ErrNotFound
	}
	avatar, err := s.repo.GetUserAvatarByID(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return s.r2.PresignGet(ctx, avatar.ImageKey, avatarPresignTTL)
}
