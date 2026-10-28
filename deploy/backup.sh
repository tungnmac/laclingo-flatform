#!/usr/bin/env bash
# Sao lưu Postgres production ra deploy/backups/laclingo-<thời gian>.sql.gz, giữ 14 bản gần nhất.
# Chạy hằng ngày bằng cron trên máy chủ, vd: 0 3 * * * cd /đường/dẫn/deploy && mkdir -p backups && ./backup.sh >> backups/backup.log 2>&1
# Khôi phục: xem mục "Khôi phục bản sao lưu" trong deploy/README.md
set -euo pipefail # pg_dump lỗi → dừng, không giữ bản sao lưu hỏng
umask 077 # bản sao lưu chứa dữ liệu người dùng — chỉ chủ sở hữu đọc được
cd "$(dirname "$0")"
mkdir -p backups
file="backups/laclingo-$(date +%Y%m%d-%H%M%S).sql.gz"
if ! docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U laclingo -d laclingo | gzip > "$file.tmp"; then
  rm -f "$file.tmp"
  echo "$(date '+%F %T') LỖI: sao lưu thất bại" >&2
  exit 1
fi
mv "$file.tmp" "$file"
echo "$(date '+%F %T') đã sao lưu $file ($(du -h "$file" | cut -f1))"
ls -1t backups/laclingo-*.sql.gz | tail -n +15 | xargs -r rm -f
