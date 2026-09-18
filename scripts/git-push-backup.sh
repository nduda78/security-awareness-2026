#!/usr/bin/env bash
# Historical note (October 2026): this used to commit+push db-backups/
# dumps to git - that's what actually survived a pod wipe before S3
# backups existed. db-backups/*.sql(.gz) is now gitignored (see
# backup-db.sh and .gitignore for why - committing them grew .git past
# 800MB and started tripping GitHub's 100MB single-file limit), so
# `git add db-backups/` below now always stages nothing and this script
# harmlessly no-ops every cycle. Left in place (rather than removed from
# the proc loop) in case this repo ever has some other reason to want an
# auto-commit-and-push-if-dirty step again - safe to run on a timer
# either way.
#
# Usage: ./scripts/git-push-backup.sh   (called by backup-db.sh's proc loop)
set -euo pipefail
cd "$(dirname "$0")/.."

# Never push from a detached HEAD or a protected branch, even by accident.
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "HEAD" ] || [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ] || [ "$BRANCH" = "develop" ]; then
  echo "Refusing to auto-push from branch '$BRANCH'." >&2
  exit 1
fi

git add db-backups/

if git diff --cached --quiet; then
  echo "No new backup snapshots to commit."
  exit 0
fi

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
git commit -q -m "Auto-backup: refresh SQLite DB snapshot ($TS)"
git push -q origin "$BRANCH"
echo "Committed and pushed new backup snapshot(s) to $BRANCH at $TS"
