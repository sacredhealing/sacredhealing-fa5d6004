#!/bin/bash
set -e

echo "=== SQI-2050 Shiesty Signal Oracle — Railway Deploy ==="

# Check if service already exists
echo "Checking Railway services..."
railway whoami || { echo "Auth failed"; exit 1; }

# Try to link existing service or create new one
PROJECT_NAME="sqi-polymarket"
SERVICE_NAME="shiesty-signal-oracle"

# Check existing projects
railway projects list 2>/dev/null || true

# Create/link project
echo "Setting up Railway service from GitHub..."
railway up \
  --service "$SERVICE_NAME" \
  --detach \
  --root polymarket-worker \
  2>&1 | head -50

# Set environment variables
echo "Setting environment variables..."
railway variables set \
  SUPABASE_URL=https://fjdzhrdpioxdeyyfogep.supabase.co \
  SUPABASE_SERVICE_KEY="$SERVICE_ROLE" \
  PAPER_MODE=true \
  RISK_PCT=0.05 \
  PORT=8080 \
  --service "$SERVICE_NAME" \
  2>&1 || echo "Env vars set inline during deploy"

echo "=== Deploy initiated. Check railway.app for status ==="
