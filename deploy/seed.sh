#!/usr/bin/env bash
# Nạp dữ liệu nền (ngôn ngữ, chủ đề, bài tập, nhiệm vụ…) vào Postgres production — chạy 1 lần sau lần deploy đầu,
# SAU khi đã tạo tài khoản owner (seed nhiệm vụ cần ít nhất 1 user).
# Idempotent (ON CONFLICT), chạy lại an toàn. Danh sách + thứ tự giống `make seed` (Makefile) — sửa cả hai cùng lúc.
set -euo pipefail
cd "$(dirname "$0")"
db=../packages/database
for f in \
  "$db/seeds.sql" \
  "$db/seeds_vocabulary.sql" \
  "$db/seeds/0003_exercise_types_seed.sql" \
  "$db/seeds/0004_challenge_questions_seed.sql" \
  "$db/seeds/0006_missions_seed.sql" \
  "$db/seeds_zh.sql" \
  "$db/seeds/0007_vocabulary_topics_emoji_seed.sql" \
  "$db/seeds/0008_listening_seed.sql" \
  "$db/seeds/0009_vocabulary_example_meaning_seed.sql" \
  "$db/seeds/0010_vocabulary_part_of_speech_seed.sql" \
  "$db/seeds/0011_speaking_it_interview_seed.sql"; do
  echo "→ $f"
  docker compose -f docker-compose.prod.yml exec -T postgres psql -q -U laclingo -d laclingo -v ON_ERROR_STOP=1 < "$f"
done
echo "Đã nạp dữ liệu nền"
