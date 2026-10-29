package repository

import (
	"context"
	"fmt"

	"laclingo-backend/internal/repository/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	Pool *pgxpool.Pool
	*db.Queries
}

func NewPostgresRepository(ctx context.Context, dbURL string) (*PostgresRepository, error) {
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		return nil, fmt.Errorf("không thể parse config database URL: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("không thể kết nối Postgres pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("không thể ping database: %w", err)
	}

	return &PostgresRepository{
		Pool:    pool,
		Queries: db.New(pool),
	}, nil
}

func (r *PostgresRepository) Close() {
	if r.Pool != nil {
		r.Pool.Close()
	}
}

// BeginTx mở 1 transaction thật trên pool — dùng cho các service cần cộng
// thưởng nhiều bảng atomically (ví dụ MissionService.RecordAction). Kết hợp
// với *db.Queries.WithTx (sqlc) để chạy query trong tx đó.
func (r *PostgresRepository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	return r.Pool.Begin(ctx)
}
