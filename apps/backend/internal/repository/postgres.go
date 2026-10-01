package repository

import (
	"context"
	"fmt"

	"laclingo-backend/internal/repository/db"

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
