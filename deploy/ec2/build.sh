#!/usr/bin/env bash
# Build both SPAs from the monorepo root. Run on EC2 after git pull (or from CI).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

echo "==> Installing dependencies (requires package-lock.json)..."
npm ci

echo "==> Building two-do + companion..."
npm run build

echo "==> Done."
echo "    Static output:"
echo "      $REPO_ROOT/apps/two-do/dist"
echo "      $REPO_ROOT/apps/companion/dist"
