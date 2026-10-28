package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// Phiên bản app iOS/Android (vỏ native Capacitor). Web nạp từ server nên luôn mới — chỉ vỏ native (plugin, quyền,
// icon...) mới có thể cũ trên máy học viên. App hỏi GET /app/version lúc mở: dưới min_version → bắt buộc cập nhật,
// dưới latest_version → nhắc cập nhật.

type AppVersionRepository interface {
	GetAppVersion(ctx context.Context, platform string) (db.AppVersion, error)
	ListAppVersions(ctx context.Context) ([]db.AppVersion, error)
	UpdateAppVersion(ctx context.Context, arg db.UpdateAppVersionParams) (db.AppVersion, error)
}

type AppVersionService struct {
	repo AppVersionRepository
}

func NewAppVersionService(repo AppVersionRepository) *AppVersionService {
	return &AppVersionService{repo: repo}
}

// storeHosts — link trang app trên store của từng nền tảng
var storeHosts = map[string]string{"ios": "apps.apple.com", "android": "play.google.com"}

// versionPattern — x.y.z (1–3 phần số), đúng định dạng phiên bản trên App Store / Google Play
var versionPattern = regexp.MustCompile(`^\d{1,4}(\.\d{1,4}){0,2}$`)

// compareVersions so sánh "1.2.10" và "1.10" theo từng phần số (thiếu phần coi là 0): -1, 0, 1
func compareVersions(a, b string) int {
	pa, pb := strings.Split(a, "."), strings.Split(b, ".")
	for i := 0; i < max(len(pa), len(pb)); i++ {
		var x, y int
		if i < len(pa) {
			x, _ = strconv.Atoi(pa[i])
		}
		if i < len(pb) {
			y, _ = strconv.Atoi(pb[i])
		}
		if x != y {
			if x < y {
				return -1
			}
			return 1
		}
	}
	return 0
}

type AppVersionInfo struct {
	Platform      string    `json:"platform" enums:"ios,android"`
	MinVersion    string    `json:"min_version" example:"1.0.0"`
	LatestVersion string    `json:"latest_version" example:"1.2.0"`
	StoreURL      string    `json:"store_url"`
	Message       string    `json:"message"` // lời nhắn hiện trên màn cập nhật (vd tính năng mới)
	UpdatedAt     time.Time `json:"updated_at"`
}

func toAppVersionInfo(v db.AppVersion) AppVersionInfo {
	return AppVersionInfo{
		Platform: v.Platform, MinVersion: v.MinVersion, LatestVersion: v.LatestVersion, StoreURL: v.StoreUrl,
		Message: v.Message, UpdatedAt: v.UpdatedAt.Time,
	}
}

func (s *AppVersionService) Get(ctx context.Context, platform string) (AppVersionInfo, error) {
	v, err := s.repo.GetAppVersion(ctx, platform)
	if errors.Is(err, pgx.ErrNoRows) {
		return AppVersionInfo{}, fmt.Errorf("nền tảng không hợp lệ (ios | android): %w", ErrInvalidInput)
	}
	if err != nil {
		return AppVersionInfo{}, err
	}
	return toAppVersionInfo(v), nil
}

func (s *AppVersionService) List(ctx context.Context) ([]AppVersionInfo, error) {
	rows, err := s.repo.ListAppVersions(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]AppVersionInfo, 0, len(rows))
	for _, v := range rows {
		out = append(out, toAppVersionInfo(v))
	}
	return out, nil
}

type AppVersionRequest struct {
	MinVersion    string `json:"min_version" example:"1.0.0"`
	LatestVersion string `json:"latest_version" example:"1.2.0"`
	StoreURL      string `json:"store_url" example:"https://apps.apple.com/app/id123"`
	Message       string `json:"message" maxLength:"300"`
}

// Update — admin đặt phiên bản tối thiểu / mới nhất (min ≤ latest) + link store (https) cho 1 nền tảng
func (s *AppVersionService) Update(ctx context.Context, adminID uuid.UUID, platform string, req AppVersionRequest) (AppVersionInfo, error) {
	req.MinVersion, req.LatestVersion = strings.TrimSpace(req.MinVersion), strings.TrimSpace(req.LatestVersion)
	req.StoreURL, req.Message = strings.TrimSpace(req.StoreURL), strings.TrimSpace(req.Message)
	if !versionPattern.MatchString(req.MinVersion) || !versionPattern.MatchString(req.LatestVersion) {
		return AppVersionInfo{}, fmt.Errorf("phiên bản phải dạng 1.2.3: %w", ErrInvalidInput)
	}
	if compareVersions(req.MinVersion, req.LatestVersion) > 0 {
		return AppVersionInfo{}, fmt.Errorf("phiên bản tối thiểu không được lớn hơn phiên bản mới nhất: %w", ErrInvalidInput)
	}
	// Bắt buộc có link store đúng nền tảng — màn "bắt buộc cập nhật" không có link là ngõ cụt cho học viên
	if u, err := url.Parse(req.StoreURL); err != nil || u.Scheme != "https" || u.Host != storeHosts[platform] {
		return AppVersionInfo{}, fmt.Errorf("link store phải là https://%s/…: %w", storeHosts[platform], ErrInvalidInput)
	}
	if len([]rune(req.Message)) > 300 {
		return AppVersionInfo{}, fmt.Errorf("lời nhắn tối đa 300 ký tự: %w", ErrInvalidInput)
	}
	v, err := s.repo.UpdateAppVersion(ctx, db.UpdateAppVersionParams{
		Platform: platform, MinVersion: req.MinVersion, LatestVersion: req.LatestVersion, StoreUrl: req.StoreURL,
		Message: req.Message, UpdatedBy: pgtype.UUID{Bytes: adminID, Valid: true},
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return AppVersionInfo{}, fmt.Errorf("nền tảng không hợp lệ (ios | android): %w", ErrInvalidInput)
	}
	if err != nil {
		return AppVersionInfo{}, err
	}
	return toAppVersionInfo(v), nil
}
