#!/usr/bin/env bash
# Dumps the live SQLite database to a timestamped SQL text file, both
# under db-backups/ (git-committed by git-push-backup.sh) and to an S3
# bucket (see push_to_s3 below). Either one alone is enough to survive a
# pod wipe - data/*.db itself is gitignored (matches the world-cup-pool
# convention: never commit the live binary DB file, only periodic dumps) -
# but keeping both gives a safety net against the other failing (e.g. a
# dump that grows past GitHub's 100MB hard file-size limit again as more
# challenge media gets added still lands safely in S3, which has no such
# limit; a temporary S3/network hiccup still leaves the git copy).
#
# Usage: ./scripts/backup-db.sh   (or: npm run db:backup)
set -euo pipefail
cd "$(dirname "$0")/.."

DB_PATH="prisma/data/security_awareness_2026.db"
OUT_DIR="db-backups"
# Added October 2026 as a second, size-unlimited backup destination -
# override with an S3_BACKUP_BUCKET env var if this ever needs to point
# elsewhere; blank disables the S3 leg entirely (git-only, the original
# behavior) without editing this script.
S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-2026-security-awareness-month-images}"
S3_BACKUP_PREFIX="db-backups"
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

# Second copy, straight to S3 - independent of the git-committed copy
# (git-push-backup.sh handles that leg separately). Never fails the whole
# backup run if S3 is unreachable or the bucket policy changes - the git
# copy this run already made is still a valid backup on its own.
if [ -n "$S3_BACKUP_BUCKET" ] && command -v aws >/dev/null 2>&1; then
  if aws s3 cp "$OUT_FILE" "s3://$S3_BACKUP_BUCKET/$S3_BACKUP_PREFIX/$(basename "$OUT_FILE")" --only-show-errors; then
    echo "Also copied to s3://$S3_BACKUP_BUCKET/$S3_BACKUP_PREFIX/$(basename "$OUT_FILE")"
  else
    echo "WARNING: S3 upload failed - the git-committed copy is still a valid backup." >&2
  fi
fi

# Keep the backup directory from growing unbounded — retain the 20 most
# recent SQLite dumps, whichever of the plain-.sql (legacy) or .sql.gz
# (current) format they're in (old Postgres-era dumps from before the
# SQLite migration are left alone as historical record).
ls -1t "$OUT_DIR"/security_awareness_2026-sqlite-*.sql "$OUT_DIR"/security_awareness_2026-sqlite-*.sql.gz 2>/dev/null |
  tail -n +21 | xargs -r rm -v
