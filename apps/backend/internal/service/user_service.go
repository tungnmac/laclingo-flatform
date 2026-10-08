package service

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"laclingo-backend/internal/repository/db"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

// UserRepository định nghĩa Interface tiếp xúc với cơ sở dữ liệu
type UserRepository interface {
	GetUserByID(ctx context.Context, id pgtype.UUID) (db.User, error)
	GetUserByUsername(ctx context.Context, username string) (db.User, error)
	ListUsers(ctx context.Context) ([]db.User, error)
	UpdateUserProfile(ctx context.Context, arg db.UpdateUserProfileParams) (db.User, error)
	ListUsersByStreak(ctx context.Context, limit int32) ([]db.User, error)
	ListUsersByLevel(ctx context.Context, limit int32) ([]db.User, error)
	ListUsersByPoints(ctx context.Context, limit int32) ([]db.User, error)
	ListUsersAdminPaged(ctx context.Context, arg db.ListUsersAdminPagedParams) ([]db.ListUsersAdminPagedRow, error)
	UpdateUserRole(ctx context.Context, arg db.UpdateUserRoleParams) (db.User, error)
	UpdateUserModules(ctx context.Context, arg db.UpdateUserModulesParams) (db.User, error)
	UpdateUserActive(ctx context.Context, arg db.UpdateUserActiveParams) (db.User, error)
}

var validUserRoles = map[string]bool{"user": true, "admin": true}

// AdminModules — toàn bộ module /admin có thể cấp quyền riêng. Khớp 1-1 với
// các route group gắn RequireModule trong router.go và AdminSubNav/hub ở FE.
var AdminModules = []string{"users", "missions", "vocabulary", "grammar", "challenge_questions", "listening"}

var validAdminModules = func() map[string]bool {
	m := make(map[string]bool, len(AdminModules))
	for _, mod := range AdminModules {
		m[mod] = true
	}
	return m
}()

// UserResponse là dữ liệu trả ra API — không bao gồm password_hash
type UserResponse struct {
	ID           uuid.UUID `json:"id" swaggertype:"string" format:"uuid"`
	Email        string    `json:"email" example:"user@laclingo.vn"`
	Username     string    `json:"username" example:"nguyenvana"`
	FullName     string    `json:"full_name"`
	AvatarURL    string    `json:"avatar_url"`
	StreakCount  int32     `json:"streak_count"`
	Role         string    `json:"role" example:"user"`
	AdminModules []string  `json:"admin_modules,omitempty"`
	IsActive     bool      `json:"is_active"`
	Level        int32     `json:"level"`
	Exp          int64     `json:"exp"`
	Points       int64     `json:"points"`
	CreatedAt    time.Time `json:"created_at"`
}

// LeaderboardEntry — 1 dòng trong bảng xếp hạng, đã kèm thứ hạng (rank =
// vị trí trong danh sách đã sort theo `by`, không cần window function vì luôn
// LIMIT cố định).
type LeaderboardEntry struct {
	Rank        int32     `json:"rank"`
	UserID      uuid.UUID `json:"user_id" swaggertype:"string" format:"uuid"`
	Username    string    `json:"username"`
	FullName    string    `json:"full_name,omitempty"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
	Level       int32     `json:"level"`
	Exp         int64     `json:"exp"`
	Points      int64     `json:"points"`
	StreakCount int32     `json:"streak_count"`
}

const defaultLeaderboardLimit = 50

// UpdateProfileRequest — field nào không gửi (null) thì giữ nguyên
type UpdateProfileRequest struct {
	FullName  *string `json:"full_name" maxLength:"100" example:"Nguyễn Văn A"`
	AvatarURL *string `json:"avatar_url" example:"https://example.com/avatar.png"`
}

func toUserResponse(u db.User) UserResponse {
	return UserResponse{
		ID:           uuid.UUID(u.ID.Bytes),
		Email:        u.Email,
		Username:     u.Username,
		FullName:     u.FullName.String,
		AvatarURL:    u.AvatarUrl.String,
		StreakCount:  u.StreakCount.Int32,
		Role:         u.Role,
		AdminModules: u.AdminModules,
		IsActive:     u.IsActive,
		Level:        u.Level,
		Exp:          u.Exp,
		Points:       u.Points,
		CreatedAt:    u.CreatedAt.Time,
	}
}

type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (UserResponse, error) {
	u, err := s.repo.GetUserByID(ctx, toPgUUID(id))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// GetByUsername trả về 1 user theo username — admin dùng để hiển thị trang
// chi tiết học viên qua URL /admin/users/<username> thay vì lộ UUID database.
func (s *UserService) GetByUsername(ctx context.Context, username string) (UserResponse, error) {
	u, err := s.repo.GetUserByUsername(ctx, username)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

func (s *UserService) List(ctx context.Context) ([]UserResponse, error) {
	users, err := s.repo.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	results := make([]UserResponse, 0, len(users))
	for _, u := range users {
		results = append(results, toUserResponse(u))
	}
	return results, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, id uuid.UUID, req UpdateProfileRequest) (UserResponse, error) {
	params := db.UpdateUserProfileParams{ID: toPgUUID(id)}

	if req.FullName != nil {
		name := strings.TrimSpace(*req.FullName)
		if utf8.RuneCountInString(name) > maxFullNameLen {
			return UserResponse{}, ErrInvalidInput
		}
		params.FullName = pgtype.Text{String: name, Valid: true}
	}
	if req.AvatarURL != nil {
		avatar := strings.TrimSpace(*req.AvatarURL)
		if avatar != "" && !isHTTPURL(avatar) {
			return UserResponse{}, ErrInvalidInput
		}
		params.AvatarUrl = pgtype.Text{String: avatar, Valid: true}
	}

	u, err := s.repo.UpdateUserProfile(ctx, params)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// GetLeaderboard trả về top user theo tiêu chí `by` (level|points|streak,
// mặc định streak để tương thích hành vi cũ — FE trước đây tự sort client-side
// theo streak_count). Rank tính theo vị trí trong danh sách (đã LIMIT, sort ở DB).
func (s *UserService) GetLeaderboard(ctx context.Context, by string) ([]LeaderboardEntry, error) {
	var users []db.User
	var err error
	switch by {
	case "level":
		users, err = s.repo.ListUsersByLevel(ctx, defaultLeaderboardLimit)
	case "points":
		users, err = s.repo.ListUsersByPoints(ctx, defaultLeaderboardLimit)
	case "", "streak":
		users, err = s.repo.ListUsersByStreak(ctx, defaultLeaderboardLimit)
	default:
		return nil, ErrInvalidInput
	}
	if err != nil {
		return nil, err
	}

	results := make([]LeaderboardEntry, 0, len(users))
	for i, u := range users {
		results = append(results, LeaderboardEntry{
			Rank:        int32(i + 1),
			UserID:      uuid.UUID(u.ID.Bytes),
			Username:    u.Username,
			FullName:    u.FullName.String,
			AvatarURL:   u.AvatarUrl.String,
			Level:       u.Level,
			Exp:         u.Exp,
			Points:      u.Points,
			StreakCount: u.StreakCount.Int32,
		})
	}
	return results, nil
}

// ListUsersAdmin trả về 1 trang học viên (admin quản lý) — search theo
// username/email/full_name, lọc theo role và/hoặc theo module đã được cấp
// quyền, phân trang server-side.
func (s *UserService) ListUsersAdmin(ctx context.Context, search, role, module string, page, pageSize int32) (PageResult[UserResponse], error) {
	if module != "" && !validAdminModules[module] {
		return PageResult[UserResponse]{}, fmt.Errorf("module \"%s\" không hợp lệ: %w", module, ErrInvalidInput)
	}
	limit, offset := NormalizePage(page, pageSize)
	rows, err := s.repo.ListUsersAdminPaged(ctx, db.ListUsersAdminPagedParams{
		Search: pgtype.Text{String: search, Valid: search != ""},
		Role:   pgtype.Text{String: role, Valid: role != ""},
		Module: pgtype.Text{String: module, Valid: module != ""},
		Limit:  limit,
		Offset: offset,
	})
	if err != nil {
		return PageResult[UserResponse]{}, err
	}
	results := make([]UserResponse, 0, len(rows))
	var total int64
	for _, r := range rows {
		total = r.TotalCount
		results = append(results, toUserResponse(db.User{
			ID: r.ID, Email: r.Email, Username: r.Username, FullName: r.FullName, AvatarUrl: r.AvatarUrl,
			StreakCount: r.StreakCount, Role: r.Role, AdminModules: r.AdminModules, IsActive: r.IsActive, Exp: r.Exp, Level: r.Level,
			Points: r.Points, CreatedAt: r.CreatedAt,
		}))
	}
	return PageResult[UserResponse]{Items: results, Total: total}, nil
}

// SetRole cấp/thu hồi quyền admin cho 1 user. CẤP (role="admin") thì admin
// thường có module "users" vẫn làm được như cũ; THU HỒI (role="user", demote)
// thì CHỈ owner mới được làm — owner cũng là người duy nhất không bị tác động
// được qua hàm này (target.Role == "owner" luôn bị chặn, dù set role gì).
func (s *UserService) SetRole(ctx context.Context, actingAdminID, targetID uuid.UUID, role string) (UserResponse, error) {
	if !validUserRoles[role] {
		return UserResponse{}, ErrInvalidInput
	}

	target, err := s.repo.GetUserByID(ctx, toPgUUID(targetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	if target.Role == "owner" {
		return UserResponse{}, fmt.Errorf("không thể thay đổi quyền của owner: %w", ErrForbidden)
	}

	if role == "user" {
		acting, err := s.repo.GetUserByID(ctx, toPgUUID(actingAdminID))
		if err != nil {
			return UserResponse{}, err
		}
		if acting.Role != "owner" {
			return UserResponse{}, fmt.Errorf("chỉ owner mới có quyền thu hồi quyền admin: %w", ErrForbidden)
		}
	}

	u, err := s.repo.UpdateUserRole(ctx, db.UpdateUserRoleParams{ID: toPgUUID(targetID), Role: role})
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// SetModules cấp/thu hồi module /admin cho 1 user — không cho tự rút module
// "users" của chính mình (tránh tự khoá khỏi màn cấu hình quyền này).
func (s *UserService) SetModules(ctx context.Context, actingAdminID, targetID uuid.UUID, modules []string) (UserResponse, error) {
	seen := make(map[string]bool, len(modules))
	clean := make([]string, 0, len(modules))
	for _, m := range modules {
		if !validAdminModules[m] {
			return UserResponse{}, fmt.Errorf("module \"%s\" không hợp lệ: %w", m, ErrInvalidInput)
		}
		if !seen[m] {
			seen[m] = true
			clean = append(clean, m)
		}
	}
	if actingAdminID == targetID && !seen["users"] {
		return UserResponse{}, fmt.Errorf("không thể tự rút quyền module \"Học viên\" của chính mình: %w", ErrInvalidInput)
	}

	target, err := s.repo.GetUserByID(ctx, toPgUUID(targetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	if target.Role == "owner" {
		return UserResponse{}, fmt.Errorf("owner luôn có mọi module, không cần (và không thể) sửa: %w", ErrForbidden)
	}

	u, err := s.repo.UpdateUserModules(ctx, db.UpdateUserModulesParams{ID: toPgUUID(targetID), AdminModules: clean})
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

// SetActive vô hiệu hoá/khôi phục tài khoản — CHỈ owner mới được làm (ngay cả
// admin có module "users" cũng không được), không áp dụng lên owner, và
// không cho tự vô hiệu hoá chính mình. Soft-delete (is_active=false) thay vì
// xoá cứng — giữ lại toàn bộ dữ liệu liên quan, có thể khôi phục bất kỳ lúc nào.
func (s *UserService) SetActive(ctx context.Context, actingOwnerID, targetID uuid.UUID, active bool) (UserResponse, error) {
	acting, err := s.repo.GetUserByID(ctx, toPgUUID(actingOwnerID))
	if err != nil {
		return UserResponse{}, err
	}
	if acting.Role != "owner" {
		return UserResponse{}, fmt.Errorf("chỉ owner mới có quyền vô hiệu hoá/khôi phục tài khoản: %w", ErrForbidden)
	}
	if actingOwnerID == targetID {
		return UserResponse{}, fmt.Errorf("không thể tự vô hiệu hoá chính mình: %w", ErrInvalidInput)
	}

	target, err := s.repo.GetUserByID(ctx, toPgUUID(targetID))
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	if target.Role == "owner" {
		return UserResponse{}, fmt.Errorf("không thể vô hiệu hoá owner: %w", ErrForbidden)
	}

	u, err := s.repo.UpdateUserActive(ctx, db.UpdateUserActiveParams{ID: toPgUUID(targetID), IsActive: active})
	if errors.Is(err, pgx.ErrNoRows) {
		return UserResponse{}, ErrNotFound
	}
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(u), nil
}

func isHTTPURL(raw string) bool {
	u, err := url.Parse(raw)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}
