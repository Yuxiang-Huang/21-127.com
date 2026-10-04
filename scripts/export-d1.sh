#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/21-127.com-data/cloudflare/21-127.sql"

mkdir -p "$root/21-127.com-data/cloudflare"
cd "$root"
npx wrangler d1 export 21-127 --remote --skip-confirmation --output "$out"
echo "Wrote $out"
