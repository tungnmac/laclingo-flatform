package config

import (
	"errors"
	"fmt"
	"os"
	"time"
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
}

func Load() (*Config, error) {
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
	}, nil
}

// R2Configured báo R2* đã được điền đủ chưa — dùng để quyết định có khởi tạo
// storage.R2Client hay không (audio upload là tính năng optional).
func (c *Config) R2Configured() bool {
	return c.R2AccountID != "" && c.R2Bucket != "" && c.R2AccessKeyID != "" && c.R2SecretAccessKey != ""
}
