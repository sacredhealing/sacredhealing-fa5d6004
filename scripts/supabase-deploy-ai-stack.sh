#!/usr/bin/env bash
# scripts/supabase-deploy-ai-stack.sh
# One-shot deploy of all SQI cost-optimized edge functions + migrations.
# Prereqs (run once): npx supabase@latest login && npx supabase@latest link --project-ref ssygukfdbtehvtndandn
# Run from repo root: chmod +x scripts/supabase-deploy-ai-stack.sh && ./scripts/supabase-deploy-ai-stack.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SB="npx --yes supabase@latest"

echo ""
echo "⚡ SQI COST SHIELD DEPLOY"
echo "========================="

echo ""
echo "📦 Deploying ayurveda-chat..."
$SB functions deploy ayurveda-chat
echo "✅ ayurveda-chat done"

echo ""
echo "📦 Deploying quantum-apothecary..."
$SB functions deploy quantum-apothecary
echo "✅ quantum-apothecary done"

echo ""
echo "📦 Deploying bhrigu-oracle..."
$SB functions deploy bhrigu-oracle
echo "✅ bhrigu-oracle done"

echo ""
echo "📦 Deploying akasha-codex-backfill..."
$SB functions deploy akasha-codex-backfill
echo "✅ akasha-codex-backfill done"

echo ""
echo "📦 Deploying akasha-codex-curator..."
$SB functions deploy akasha-codex-curator
echo "✅ akasha-codex-curator done"

echo ""
echo "🗄️  Running migrations..."
$SB db push
echo "✅ migrations done"

echo ""
echo "========================="
echo "✅ ALL DONE — Re-enable Gemini API now"
echo "https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/overview?project=gen-lang-client-0659162468"
echo ""
