#!/usr/bin/env bash
# Dumps the live SQLite database to a timestamped SQL text file under
# db-backups/ (kept locally, gitignored - see .gitignore) and uploads it
# to S3 (see below). S3 is the sole real backup destination as of
# October 2026: committing these dumps to git grew .git past 800MB and
# started tripping GitHub's 100MB single-file limit as challenge media
# assets got bigger; S3 has no such ceiling. data/*.db itself is also
# gitignored (matches the original world-cup-pool convention: never
# commit the live binary DB file).
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

# The actual backup - local dump above is scratch space for this upload,
# not a backup on its own (db-backups/ is gitignored and lives on the
# same ephemeral pod disk as everything else). Never hard-fails the
# script if S3 is unreachable or the bucket policy changes, so a
# transient network blip doesn't count as a failed cron run either.
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
