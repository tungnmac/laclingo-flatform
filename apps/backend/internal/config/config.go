package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	AppEnv      string
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

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		AppEnv:      appEnv,
	}, nil
}
