package repository

import (
	"errors"
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5" // driver "pgx5://"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// ErrSchemaAhead — DB đang ở version mới hơn migration mới nhất image này có (rollback về bản cũ, hoặc bản mới migrate
// lỗi giữa chừng): không migrate, backend vẫn chạy — code cũ chạy được trên schema mới nếu migration tương thích ngược
// (chỉ thêm, không xoá/đổi tên — xem deploy/README.md).
var ErrSchemaAhead = errors.New("database mới hơn migration của bản này")

// migrationLockTimeout — mỗi câu migration chờ lock bảng tối đa chừng này rồi báo lỗi, thay vì xếp hàng sau transaction
// của bản đang chạy và kéo theo mọi query khác của API treo theo
const migrationLockTimeout = "10s"

// Migrate áp các migration chưa chạy trong dir lúc backend khởi động — cùng công cụ + bảng schema_migrations với
// `make migrate` / container migrate của deploy/docker-compose.prod.yml, nên chạy xen kẽ vẫn khớp. Nhiều instance khởi
// động cùng lúc thì chờ nhau bằng advisory lock. Trả về version hiện tại sau khi migrate.
func Migrate(dbURL, dir string) (uint, error) {
	latest, err := latestMigrationVersion(dir)
	if err != nil {
		return 0, err
	}
	migrateURL, err := migrationDatabaseURL(dbURL)
	if err != nil {
		return 0, err
	}
	m, err := migrate.New("file://"+dir, migrateURL)
	if err != nil {
		return 0, fmt.Errorf("không khởi tạo được migration: %w", err)
	}
	defer m.Close()

	if version, dirty, err := m.Version(); err == nil && version > latest {
		return version, fmt.Errorf("%w (DB %d, dirty=%t; bản này tới %d)", ErrSchemaAhead, version, dirty, latest)
	} else if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return 0, err
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return 0, fmt.Errorf("chạy migration thất bại (DB dirty thì sửa tay rồi `migrate force` — xem deploy/README.md): %w", err)
	}
	version, _, err := m.Version()
	if errors.Is(err, migrate.ErrNilVersion) {
		return 0, nil
	}
	return version, err
}

// latestMigrationVersion — version lớn nhất trong dir (tên file golang-migrate: <version>_<tên>.up.sql)
func latestMigrationVersion(dir string) (uint, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return 0, fmt.Errorf("không đọc được thư mục migration: %w", err)
	}
	var latest uint64
	for _, e := range entries {
		prefix, _, ok := strings.Cut(e.Name(), "_")
		if !ok || !strings.HasSuffix(e.Name(), ".up.sql") {
			continue
		}
		if v, err := strconv.ParseUint(prefix, 10, 64); err == nil && v > latest {
			latest = v
		}
	}
	return uint(latest), nil
}

// migrationDatabaseURL đổi DATABASE_URL sang scheme driver pgx5 của golang-migrate, kèm lock_timeout (tham số runtime
// Postgres gửi lúc kết nối). Neon: bỏ "-pooler" khỏi host để đi thẳng endpoint — advisory lock của migrate là lock theo
// session, qua PgBouncer (transaction mode) có thể kẹt lock trên 1 kết nối khác và lần deploy sau chờ mãi.
func migrationDatabaseURL(dbURL string) (string, error) {
	u, err := url.Parse(dbURL)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") {
		return "", errors.New("DATABASE_URL phải có dạng postgres://… để chạy migration")
	}
	u.Scheme = "pgx5"
	if host, rest, ok := strings.Cut(u.Host, "-pooler."); ok && strings.HasSuffix(u.Hostname(), ".neon.tech") {
		u.Host = host + "." + rest
	}
	q := u.Query()
	if q.Get("lock_timeout") == "" {
		q.Set("lock_timeout", migrationLockTimeout)
		u.RawQuery = q.Encode()
	}
	return u.String(), nil
}
