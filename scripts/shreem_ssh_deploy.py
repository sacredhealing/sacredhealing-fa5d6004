#!/usr/bin/env python3
"""Shreem Brzee Hetzner SSH Deploy — downloads pre-compiled dist from GitHub"""
import paramiko, os, sys

HOST     = "178.105.183.74"
USER     = "root"
PASS     = os.environ.get("HP", "")
GH_TOKEN = os.environ.get("GH", "")
GIT_URL  = f"https://x-access-token:{GH_TOKEN}@github.com/sacredhealing/sacredhealing-fa5d6004.git"
RAW_DIST = f"https://raw.githubusercontent.com/sacredhealing/sacredhealing-fa5d6004/main/railway/shreem-brzee-bot/dist/index.js"

lines = [
    "set -e",
    'echo "SHREEM BRZEE v2.5 Deploy"',
    f'GIT_URL="{GIT_URL}"',
    f'RAW_DIST="{RAW_DIST}"',
    f'GH_TOKEN="{GH_TOKEN}"',
    'REPO="/root/shreem-brzee"',
    'if [ ! -d "$REPO/.git" ]; then',
    '  git clone "$GIT_URL" "$REPO" --depth=1 --quiet && echo "Cloned"',
    'else',
    '  cd "$REPO"',
    '  git remote set-url origin "$GIT_URL"',
    '  git fetch origin main --quiet && git reset --hard origin/main --quiet',
    '  echo "Pulled: $(git log --oneline -1)"',
    'fi',
    'cd "$REPO/railway/shreem-brzee-bot"',
    'npm install --omit=dev --silent 2>&1 | tail -2',
    # Download pre-compiled dist directly from GitHub raw (bypasses .gitignore)
    'echo "Downloading pre-compiled dist..."',
    'mkdir -p dist',
    f'curl -sL -H "Authorization: token {GH_TOKEN}" "$RAW_DIST" -o dist/index.js',
    'echo "Dist size: $(wc -c < dist/index.js) bytes"',
    'grep -c "pollTimer" dist/index.js && echo "✅ poller OK" || (echo "❌ poller missing"; exit 1)',
    'grep -m1 "v2\\.5" dist/index.js || echo "WARNING: not v2.5"',
    'if pm2 describe shreem-brzee > /dev/null 2>&1; then',
    '  pm2 delete shreem-brzee',
    'fi',
    'pm2 start dist/index.js --name shreem-brzee',
    'pm2 save --force > /dev/null',
    'sleep 8',
    'pm2 list',
    'pm2 logs shreem-brzee --lines 30 --nostream 2>/dev/null || true',
    'echo "DEPLOY COMPLETE"',
]

SCRIPT = "\n".join(lines)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to {HOST}...")
client.connect(HOST, username=USER, password=PASS, timeout=30)
print("Connected!")

stdin, stdout, stderr = client.exec_command(SCRIPT, timeout=300)
for line in iter(stdout.readline, ""):
    print(line, end="", flush=True)
for line in iter(stderr.readline, ""):
    print("ERR:", line, end="", flush=True)

code = stdout.channel.recv_exit_status()
client.close()
print(f"\nExit code: {code}")
sys.exit(code)
