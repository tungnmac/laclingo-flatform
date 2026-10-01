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
	}, nil
}
