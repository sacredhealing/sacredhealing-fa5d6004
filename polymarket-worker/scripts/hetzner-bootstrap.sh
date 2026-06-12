#!/bin/bash
# SQI-2050 CLAWBOT Hetzner Bootstrap Script
# Runs as root on the Hetzner server
set -e

echo "══════════════════════════════════════════════════"
echo " SQI-2050 ⚡ CLAWBOT Hetzner Bootstrap"
echo "══════════════════════════════════════════════════"

# ── Args ──────────────────────────────────────────────
GH_TOKEN="${1}"
if [ -z "$GH_TOKEN" ]; then
  echo "[ERROR] GitHub token required as first argument"
  exit 1
fi

# ── Node 20 ───────────────────────────────────────────
install_node() {
  echo "[SQI] Installing Node 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}

if ! command -v node &>/dev/null; then
  install_node
else
  NODE_MAJOR=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
  if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "[SQI] Node $NODE_MAJOR too old — upgrading to 20..."
    install_node
  fi
fi
echo "[SQI] Node: $(node -v) | npm: $(npm -v)"

# ── PM2 ───────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "[SQI] Installing PM2..."
  npm install -g pm2
  env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true
  systemctl enable pm2-root 2>/dev/null || true
fi
echo "[SQI] PM2: $(pm2 -v)"

# ── Git ───────────────────────────────────────────────
command -v git &>/dev/null || apt-get install -y git

# ── Clone / pull ──────────────────────────────────────
REPO_DIR="/root/clawbot"
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "[SQI] Cloning repo..."
  git clone "https://x-access-token:${GH_TOKEN}@github.com/sacredhealing/sacredhealing-fa5d6004.git" "$REPO_DIR"
else
  echo "[SQI] Pulling latest from main..."
  cd "$REPO_DIR"
  git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/sacredhealing/sacredhealing-fa5d6004.git"
  git fetch origin
  git reset --hard origin/main
fi

# ── Write .env ─────────────────────────────────────────
cd "$REPO_DIR/polymarket-worker"
cat > .env << 'ENVEOF'
PORT=8080
SUPABASE_URL=https://fjdzhrdpioxdeyyfogep.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjIyNTU4NCwiZXhwIjoyMDU3ODAxNTg0fQ.JZMdJEdJFHyBgLZIWuSJMYSwB0EK8WEbUfhJvJVb9kQ
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/xT5i9TCX6Z_sUn5eVkMY2kJCnxlO-M8x
BOT_PRIVATE_KEY=
POLY_API_KEY=
POLY_API_SECRET=
POLY_API_PASSPHRASE=
PAPER_MODE=true
RISK_PCT=0.05
MAX_POSITIONS=20
WHALE_MIN_WR=0.55
WHALE_MIN_TRADES=5
ENVEOF
echo "[SQI] .env written | PAPER_MODE=true | 9 elite whales pre-seeded"

# ── npm install ────────────────────────────────────────
npm install --omit=dev

# ── PM2 start/restart ─────────────────────────────────
if pm2 describe clawbot > /dev/null 2>&1; then
  pm2 restart clawbot --update-env
  echo "[SQI] ✅ CLAWBOT restarted"
else
  pm2 start npm --name clawbot -- start
  echo "[SQI] ✅ CLAWBOT started fresh"
fi
pm2 save

# ── Health check ──────────────────────────────────────
sleep 5
echo ""
echo "[SQI] ═══ PM2 STATUS ═══"
pm2 list
echo ""
echo "[SQI] ═══ HEALTH CHECK http://localhost:8080/health ═══"
curl -sf http://localhost:8080/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8080/health || echo "Not ready yet"
echo ""
echo "[SQI] ═══ LAST 30 LOG LINES ═══"
pm2 logs clawbot --lines 30 --nostream 2>/dev/null || true
echo "══════════════════════════════════════════════════"
echo "[SQI-2050] CLAWBOT DEPLOYMENT COMPLETE"
echo "══════════════════════════════════════════════════"
