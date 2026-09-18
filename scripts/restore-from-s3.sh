#!/usr/bin/env bash
# Recovery path for a real pod wipe when the local git checkout is also
# gone (e.g. a totally fresh clone/instance) - pulls the newest backup
# straight from S3 into db-backups/, then hands off to restore-db.sh for
# the actual SQLite rebuild. If you still have the git-committed copies
# under db-backups/, you can just run restore-db.sh directly instead -
# this script exists purely for "I don't even have that anymore."
#
# Usage: ./scripts/restore-from-s3.sh
set -euo pipefail
cd "$(dirname "$0")/.."

S3_BACKUP_BUCKET="${S3_BACKUP_BUCKET:-2026-security-awareness-month-images}"
S3_BACKUP_PREFIX="db-backups"
OUT_DIR="db-backups"
mkdir -p "$OUT_DIR"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found - can't reach S3 from this environment." >&2
  exit 1
fi

LATEST_KEY=$(aws s3api list-objects-v2 \
  --bucket "$S3_BACKUP_BUCKET" \
  --prefix "$S3_BACKUP_PREFIX/" \
  --query 'reverse(sort_by(Contents, &LastModified))[0].Key' \
  --output text 2>/dev/null || true)

if [ -z "$LATEST_KEY" ] || [ "$LATEST_KEY" = "None" ]; then
  echo "No backups found under s3://$S3_BACKUP_BUCKET/$S3_BACKUP_PREFIX/" >&2
  exit 1
fi

LOCAL_FILE="$OUT_DIR/$(basename "$LATEST_KEY")"
echo "Pulling s3://$S3_BACKUP_BUCKET/$LATEST_KEY -> $LOCAL_FILE"
aws s3 cp "s3://$S3_BACKUP_BUCKET/$LATEST_KEY" "$LOCAL_FILE" --only-show-errors

exec ./scripts/restore-db.sh "$LOCAL_FILE"
