#!/usr/bin/env bash
# Copy built SPAs into /var/www (or STAGE_ROOT). Requires sudo. Run after build.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE_ROOT="${STAGE_ROOT:-/var/www}"

echo "==> Staging dist -> $STAGE_ROOT/{two-do,companion} (sudo)..."
sudo mkdir -p "$STAGE_ROOT/two-do" "$STAGE_ROOT/companion"
sudo rsync -a --delete "$REPO_ROOT/apps/two-do/dist/" "$STAGE_ROOT/two-do/"
sudo rsync -a --delete "$REPO_ROOT/apps/companion/dist/" "$STAGE_ROOT/companion/"
echo "==> Staged. Point nginx root to $STAGE_ROOT/two-do and $STAGE_ROOT/companion."
