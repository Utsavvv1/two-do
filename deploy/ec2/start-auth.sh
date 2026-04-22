#!/usr/bin/env bash
# Run auth-server in production (foreground). Use systemd or PM2 for always-on.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export NODE_ENV=production
cd "$REPO_ROOT/services/auth-server"
exec node src/index.js
