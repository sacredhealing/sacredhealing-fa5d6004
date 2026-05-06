#!/usr/bin/env bash
# Run from repo root after: npx supabase login (or export SUPABASE_ACCESS_TOKEN)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
SUPABASE="npx --yes supabase@latest"

echo "=== Step 1: link project (requires login) ==="
$SUPABASE link --project-ref ssygukfdbtehvtndandn

echo "=== Step 2: deploy functions ==="
for fn in ayurveda-chat quantum-apothecary bhrigu-oracle akasha-codex-backfill akasha-codex-curator; do
  echo "-- deploying $fn --"
  $SUPABASE functions deploy "$fn"
done

echo "=== Step 3: push migrations ==="
$SUPABASE db push

echo "Done."
