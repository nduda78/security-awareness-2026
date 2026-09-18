#!/usr/bin/env bash
# Dumps the live SQLite database to a timestamped, git-friendly SQL text
# file under db-backups/. This is the ONLY thing that survives a pod wipe —
# data/*.db itself is gitignored (matches the world-cup-pool convention:
# never commit the live binary DB file, only periodic SQL dumps).
#
# Usage: ./scripts/backup-db.sh   (or: npm run db:backup)
set -euo pipefail
cd "$(dirname "$0")/.."

DB_PATH="prisma/data/security_awareness_2026.db"
OUT_DIR="db-backups"
mkdir -p "$OUT_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "No database at $DB_PATH — nothing to back up." >&2
  exit 1
fi

TS=$(date -u +%Y%m%d-%H%M%S)
# gzip-compressed: the dump is plain SQL text, but BLOB columns (badge
# photos, and increasingly challenge question/unlock images+audio+video)
# get hex-encoded as X'...' literals, which roughly doubles their size on
# top of already being uncompressed media - an uncompressed dump crossed
# GitHub's 100MB single-file hard limit and got a push rejected outright.
# gzip -9 shrinks that dramatically (already-compressed video/image bytes
# still compress well once hex-encoded back to text) while restore-db.sh
# transparently decompresses either this or a legacy plain .sql dump.
OUT_FILE="$OUT_DIR/security_awareness_2026-sqlite-$TS.sql.gz"

sqlite3 "$DB_PATH" .dump | gzip -9 > "$OUT_FILE"
echo "Backed up $DB_PATH -> $OUT_FILE ($(wc -c < "$OUT_FILE") bytes)"

# Keep the backup directory from growing unbounded — retain the 20 most
# recent SQLite dumps, whichever of the plain-.sql (legacy) or .sql.gz
# (current) format they're in (old Postgres-era dumps from before the
# SQLite migration are left alone as historical record).
ls -1t "$OUT_DIR"/security_awareness_2026-sqlite-*.sql "$OUT_DIR"/security_awareness_2026-sqlite-*.sql.gz 2>/dev/null |
  tail -n +21 | xargs -r rm -v
