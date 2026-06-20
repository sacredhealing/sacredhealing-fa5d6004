#!/bin/bash
# Deploy ayurveda-chat to Lovable Supabase using hardcoded PAT
PAT="sbp_102e689504a6e8b6e2e8df3e36a7699a7d94d744"
PROJECT="ssygukfdbtehvtndandn"
FN="ayurveda-chat"

echo "=== Deploying $FN to $PROJECT ==="

# Install supabase CLI if not present
if ! command -v supabase &> /dev/null; then
  npm install -g supabase --silent 2>/dev/null || \
  curl -fsSL https://github.com/supabase/cli/releases/download/v1.200.3/supabase_linux_amd64.tar.gz \
    | tar xz -C /usr/local/bin supabase 2>/dev/null || true
fi

SUPABASE_ACCESS_TOKEN="$PAT" supabase functions deploy $FN \
  --project-ref $PROJECT \
  --no-verify-jwt

echo "✅ Done at $(date)"
