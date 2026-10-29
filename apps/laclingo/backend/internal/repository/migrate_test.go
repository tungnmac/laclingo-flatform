package repository

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMigrationDatabaseURL(t *testing.T) {
	cases := map[string]string{
		"postgres://u:p@localhost:5432/db?sslmode=disable": "pgx5://u:p@localhost:5432/db?lock_timeout=10s&sslmode=disable",
		// Neon: bỏ "-pooler" để đi thẳng endpoint
		"postgresql://u:p@ep-cool-name-123456-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require": "pgx5://u:p@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/db?lock_timeout=10s&sslmode=require",
		"postgresql://u:p@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/db?sslmode=require":        "pgx5://u:p@ep-cool-name-123456.ap-southeast-1.aws.neon.tech/db?lock_timeout=10s&sslmode=require",
		// Không phải Neon: giữ nguyên host; lock_timeout có sẵn thì giữ
		"postgres://u:p@db-pooler.internal:5432/db?lock_timeout=3s": "pgx5://u:p@db-pooler.internal:5432/db?lock_timeout=3s",
	}
	for in, want := range cases {
		got, err := migrationDatabaseURL(in)
		if err != nil || got != want {
			t.Fatalf("migrationDatabaseURL(%q) = %q, %v; muốn %q", in, got, err, want)
		}
	}
	if _, err := migrationDatabaseURL("mysql://u:p@localhost/db"); err == nil {
		t.Fatal("muốn lỗi với scheme không phải postgres")
	}
}

func TestLatestMigrationVersion(t *testing.T) {
	dir := t.TempDir()
	for _, name := range []string{"000049_a.up.sql", "000049_a.down.sql", "000050_b.up.sql", "000051_c.down.sql", "README.md"} {
		if err := os.WriteFile(filepath.Join(dir, name), nil, 0o644); err != nil {
			t.Fatal(err)
		}
	}
	if v, err := latestMigrationVersion(dir); err != nil || v != 50 {
		t.Fatalf("latestMigrationVersion = %d, %v; muốn 50", v, err)
	}
}
