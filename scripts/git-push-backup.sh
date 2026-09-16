#!/usr/bin/env bash
# Commits and pushes any new db-backups/*.sql dumps so they survive even if
# this pod (and its working copy) is deleted outright, not just restarted.
# Safe to run on a timer: no-ops cleanly if there's nothing new to commit.
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
