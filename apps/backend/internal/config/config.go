package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

// devJWTSecret chỉ dùng cho môi trường development khi chưa set JWT_SECRET
const devJWTSecret = "laclingo-dev-secret-do-not-use-in-production"

type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
	JWTSecret   string
	JWTTTL      time.Duration

	// R2* — Cloudflare R2 (lưu audio luyện nghe). Để trống hết thì tính năng
	// upload audio tắt (handler trả lỗi rõ ràng), không bắt buộc như JWT_SECRET.
	R2AccountID       string
	R2Bucket          string
	R2AccessKeyID     string
	R2SecretAccessKey string

	// VAPID* — khoá ký web push (nhắc học). Để trống thì tính năng nhắc học tắt
	// (bộ lập lịch không chạy, API trả push_configured=false), server vẫn chạy.
	// Tạo cặp khoá: npx web-push generate-vapid-keys
	VAPIDPublicKey  string
	VAPIDPrivateKey string
	VAPIDSubject    string // mailto:... hoặc https://... — push service dùng để liên hệ khi có sự cố

	// FCMServiceAccountFile — đường dẫn file JSON service account của project Firebase: gửi thông báo đẩy
	// tới app iOS/Android (Capacitor). Trống = app không nhận được thông báo đẩy, web push không ảnh hưởng.
	FCMServiceAccountFile string

	// AI cho nút "Gợi ý tự động" khi admin thêm từ (nghĩa tiếng Việt, câu ví dụ, từ loại...).
	// AIProvider: "claude" | "gemini"; trống = tự chọn theo key đang có (ưu tiên Claude).
	// Không có key nào thì chỉ gợi ý phiên âm/audio từ Free Dictionary API.
	// SuggestModel (Claude) mặc định claude-opus-5-5; GeminiModel mặc định gemini-3.5-flash-lite.
	AIProvider      string
	AnthropicAPIKey string
	SuggestModel    string
	GeminiAPIKey    string
	GeminiModel     string

	// Thanh toán (gói Pro, gems). Cổng nào thiếu key thì tắt (trang bảng giá báo chưa hỗ trợ).
	// VNPay: mã website + chuỗi bí mật từ VNPay (sandbox: sandbox.vnpayment.vn); VNPayPayURL trống = URL sandbox.
	// Stripe: secret key (sk_test_… / sk_live_…) + signing secret của webhook (whsec_…).
	// AppWebURL: địa chỉ trang web (trang kết quả thanh toán); AppAPIURL: địa chỉ public của API (VNPay gọi Return/IPN).
	VNPayTmnCode        string
	VNPayHashSecret     string
	VNPayPayURL         string
	StripeSecretKey     string
	StripeWebhookSecret string
	StripeAPIBase       string // trống = api.stripe.com (đặt khi chạy với stripe-mock / server giả lập để test)
	AppWebURL           string
	AppAPIURL           string
}

func Load() (*Config, error) {
	// .env chỉ tồn tại ở local dev — không có file này (production chạy bằng
	// env var thật do hạ tầng cấp) thì bỏ qua lỗi, KHÔNG được làm Load() fail.
	// Không set lại biến đã có trong môi trường (ưu tiên env thật hơn .env).
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://laclingo_user:laclingo_password@localhost:5432/laclingo_db?sslmode=disable"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		if appEnv == "production" {
			return nil, errors.New("JWT_SECRET bắt buộc khi APP_ENV=production")
		}
		jwtSecret = devJWTSecret
	}

	jwtTTL := 24 * time.Hour
	if v := os.Getenv("JWT_TTL"); v != "" {
		d, err := time.ParseDuration(v)
		if err != nil || d <= 0 {
			return nil, fmt.Errorf("JWT_TTL không hợp lệ (ví dụ: 24h, 30m): %q", v)
		}
		jwtTTL = d
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		AppEnv:      appEnv,
		JWTSecret:   jwtSecret,
		JWTTTL:      jwtTTL,

		R2AccountID:       os.Getenv("R2_ACCOUNT_ID"),
		R2Bucket:          os.Getenv("R2_BUCKET"),
		R2AccessKeyID:     os.Getenv("R2_ACCESS_KEY_ID"),
		R2SecretAccessKey: os.Getenv("R2_SECRET_ACCESS_KEY"),

		VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		VAPIDSubject:    os.Getenv("VAPID_SUBJECT"),

		FCMServiceAccountFile: os.Getenv("FCM_SERVICE_ACCOUNT_FILE"),

		AIProvider:      strings.ToLower(strings.TrimSpace(os.Getenv("AI_PROVIDER"))),
		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),
		SuggestModel:    os.Getenv("VOCAB_SUGGEST_MODEL"),
		GeminiAPIKey:    os.Getenv("GEMINI_API_KEY"),
		GeminiModel:     os.Getenv("GEMINI_MODEL"),

		VNPayTmnCode:        strings.TrimSpace(os.Getenv("VNPAY_TMN_CODE")),
		VNPayHashSecret:     strings.TrimSpace(os.Getenv("VNPAY_HASH_SECRET")),
		VNPayPayURL:         strings.TrimSpace(os.Getenv("VNPAY_PAY_URL")),
		StripeSecretKey:     strings.TrimSpace(os.Getenv("STRIPE_SECRET_KEY")),
		StripeWebhookSecret: strings.TrimSpace(os.Getenv("STRIPE_WEBHOOK_SECRET")),
		StripeAPIBase:       strings.TrimSpace(os.Getenv("STRIPE_API_BASE")),
		AppWebURL:           envOr("APP_WEB_URL", "http://localhost:3000"),
		AppAPIURL:           envOr("APP_API_URL", "http://localhost:"+port+"/api/v1"),
	}, nil
}

// PushConfigured báo VAPID_* đã được điền đủ chưa — thiếu thì tắt nhắc học (web push).
func (c *Config) PushConfigured() bool {
	return c.VAPIDPublicKey != "" && c.VAPIDPrivateKey != "" && c.VAPIDSubject != ""
}

// R2Configured báo R2* đã được điền đủ chưa — dùng để quyết định có khởi tạo
// storage.R2Client hay không (audio upload là tính năng optional).
func (c *Config) R2Configured() bool {
	return c.R2AccountID != "" && c.R2Bucket != "" && c.R2AccessKeyID != "" && c.R2SecretAccessKey != ""
}

func envOr(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}
