#!/usr/bin/env bash
# Rebuilds data/security_awareness_2026.db from the most recent SQLite SQL
# dump in db-backups/. This is the recovery step after a pod wipe: no
# service to reinstall (unlike the old Postgres setup) — just replay the
# latest dump into a fresh file.
#
# Usage: ./scripts/restore-db.sh [path-to-specific-dump.sql]
set -euo pipefail
cd "$(dirname "$0")/.."

DB_PATH="prisma/data/security_awareness_2026.db"
OUT_DIR="db-backups"

DUMP_FILE="${1:-}"
if [ -z "$DUMP_FILE" ]; then
  DUMP_FILE=$(ls -1t "$OUT_DIR"/security_awareness_2026-sqlite-*.sql 2>/dev/null | head -n 1)
fi

if [ -z "$DUMP_FILE" ] || [ ! -f "$DUMP_FILE" ]; then
  echo "No SQLite dump found in $OUT_DIR. Nothing to restore." >&2
  echo "(If this is a brand-new environment, run: npx prisma migrate deploy && npm run db:seed)" >&2
  exit 1
fi

mkdir -p "$(dirname "$DB_PATH")"
if [ -f "$DB_PATH" ]; then
  SAFETY="$DB_PATH.before-restore-$(date -u +%Y%m%d-%H%M%S)"
  mv "$DB_PATH" "$SAFETY"
  echo "Existing DB moved aside to $SAFETY"
fi

sqlite3 "$DB_PATH" < "$DUMP_FILE"
echo "Restored $DB_PATH from $DUMP_FILE"
