package handler

import (
	"strings"

	"laclingo-backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const userIDKey = "userID"

// TokenParser kiểm tra access token và trả về user ID
type TokenParser interface {
	Parse(token string) (uuid.UUID, error)
}

// RequireAuth chặn request không có Bearer token hợp lệ
func RequireAuth(tokens TokenParser) fiber.Handler {
	return func(c *fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)
		scheme, token, ok := strings.Cut(header, " ")
		if !ok || !strings.EqualFold(scheme, "Bearer") || token == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "thiếu access token")
		}

		userID, err := tokens.Parse(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals(userIDKey, userID)
		return c.Next()
	}
}

// currentUserID lấy user ID do RequireAuth gắn vào context
func currentUserID(c *fiber.Ctx) uuid.UUID {
	id, _ := c.Locals(userIDKey).(uuid.UUID)
	return id
}

// modulePathPrefixes map tiền tố đường dẫn /admin/* sang module cần được cấp
// quyền — dùng path thay vì tách nhiều Fiber Group vì Group("", mw) đăng ký
// middleware qua Use() cho CẢ app theo thứ tự đăng ký (tích luỹ cho mọi route
// khớp sau đó, không chỉ riêng route của group đó) — tách nhiều group cùng
// prefix rỗng sẽ cộng dồn hết các RequireModule lên nhau, chặn nhầm tất cả.
var modulePathPrefixes = []struct {
	prefix string
	module string
}{
	{"/api/v1/admin/users", "users"},
	{"/api/v1/admin/missions", "missions"},
	{"/api/v1/admin/vocabularies", "vocabulary"},
	{"/api/v1/admin/vocabulary-topics", "vocabulary"},
	{"/api/v1/admin/grammar", "grammar"},
	{"/api/v1/admin/challenge-questions", "challenge_questions"},
	{"/api/v1/admin/listening", "listening"},
	{"/api/v1/admin/classes", "classes"},
	{"/api/v1/admin/blog", "blog"},
}

func moduleForPath(path string) string {
	for _, m := range modulePathPrefixes {
		if strings.HasPrefix(path, m.prefix) {
			return m.module
		}
	}
	return ""
}

// RequireModule chặn request không phải role admin, HOẶC là admin nhưng chưa
// được cấp module tương ứng với đường dẫn đang gọi — PHẢI đứng SAU
// RequireAuth trong chain. Thay cho RequireAdmin cũ (role='admin' không còn
// tự động full quyền mọi module — phải được cấp admin_modules riêng, xem
// user_service.go). 1 middleware DUY NHẤT cho toàn bộ /admin/* (xem lý do ở
// modulePathPrefixes) — tự suy module từ c.Path(), không nhận module cố định.
func RequireModule(svc *service.UserService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		module := moduleForPath(c.Path())
		if module == "" {
			// Đường dẫn /admin/* chưa khai báo trong modulePathPrefixes — chặn
			// mặc định để không vô tình mở quyền cho route mới thêm mà quên khai báo.
			return fiber.NewError(fiber.StatusForbidden, "yêu cầu quyền admin")
		}

		user, err := svc.GetByID(c.UserContext(), currentUserID(c))
		if err != nil {
			return err
		}
		// owner luôn có mọi module — bỏ qua kiểm tra admin_modules.
		if user.Role == "owner" {
			return c.Next()
		}
		if user.Role != "admin" {
			return fiber.NewError(fiber.StatusForbidden, "yêu cầu quyền admin")
		}
		for _, m := range user.AdminModules {
			if m == module {
				return c.Next()
			}
		}
		return fiber.NewError(fiber.StatusForbidden, "bạn chưa được cấp quyền truy cập mục này")
	}
}

// RequireAuthWS xác thực WebSocket qua query param ?token= — browser không set
// được header Authorization tuỳ ý trên WS handshake nên không dùng lại
// RequireAuth (chỉ đọc header, đang được nhiều route REST khác dùng).
func RequireAuthWS(tokens TokenParser) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Query("token")
		if token == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "thiếu access token")
		}

		userID, err := tokens.Parse(token)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}

		c.Locals(userIDKey, userID)
		return c.Next()
	}
}

// pageParams đọc page/page_size (query string) dùng chung cho mọi list admin
// có phân trang — validate/clamp giá trị cụ thể nằm ở service.NormalizePage.
func pageParams(c *fiber.Ctx) (page, pageSize int32) {
	return int32(c.QueryInt("page", 1)), int32(c.QueryInt("page_size", 0))
}
