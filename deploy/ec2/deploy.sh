#!/usr/bin/env bash
# One-shot: build + optional stage to /var/www. Usage:
#   ./deploy/ec2/deploy.sh           # build only
#   ./deploy/ec2/deploy.sh --stage   # build + sudo rsync to /var/www
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

"$REPO_ROOT/deploy/ec2/build.sh"

if [[ "${1:-}" == "--stage" ]]; then
  "$REPO_ROOT/deploy/ec2/stage-static.sh"
fi

echo "==> deploy.sh finished."
