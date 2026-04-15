#!/usr/bin/env bash
# Deploy daily-room Edge Function to your Supabase project (replaces Lovable deploy).
# Prereq: add SUPABASE_ACCESS_TOKEN to .env (Dashboard → Account → Access Tokens)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
set -a
[ -f .env ] && . ./.env
set +a
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN in .env" >&2
  echo "Create a token: https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi
REF="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
REF="${REF#https://}"
REF="${REF%%.*}"
if [[ -z "$REF" || "$REF" == *"supabase"* ]]; then
  echo "Could not parse project ref from VITE_SUPABASE_URL / SUPABASE_URL in .env" >&2
  exit 1
fi
exec npx --yes supabase@latest functions deploy daily-room --project-ref "$REF"
