#!/usr/bin/env bash
# Remove duplicate default server{} from Amazon Linux nginx.conf (keep conf.d only).
set -euo pipefail
CONF=/etc/nginx/nginx.conf
sudo cp "$CONF" "${CONF}.bak.$(date +%s)"
sudo python3 <<'PY'
from pathlib import Path
p = Path("/etc/nginx/nginx.conf")
t = p.read_text()
marker = "    include /etc/nginx/conf.d/*.conf;\n\n    server {"
keep = "    include /etc/nginx/conf.d/*.conf;\n\n"
tls = "# Settings for a TLS enabled server."
i = t.find(marker)
j = t.find(tls)
if i == -1 or j == -1:
    raise SystemExit(f"pattern not found i={i} j={j}")
p.write_text(t[: i + len(keep)] + t[j:])
print("ok")
PY
sudo nginx -t
