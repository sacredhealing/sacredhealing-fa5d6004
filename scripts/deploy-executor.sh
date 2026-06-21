#!/bin/bash
# Deploy shreem-live-executor to ssygukfdbtehvtndandn
set -e
cd /root/shreem-brzee
git pull origin main

export SUPABASE_ACCESS_TOKEN="sbp_102e689504a6e8b6e2e8df3e36a7699a7d94d744"

echo "Installing supabase CLI..."
if ! command -v supabase &>/dev/null; then
  curl -fsSL https://supabase.com/install.sh | bash
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "Deploying shreem-live-executor..."
supabase functions deploy shreem-live-executor \
  --project-ref ssygukfdbtehvtndandn \
  --no-verify-jwt

echo "Deploying shreem-helius-webhook..."
supabase functions deploy shreem-helius-webhook \
  --project-ref ssygukfdbtehvtndandn \
  --no-verify-jwt

echo "DONE"
