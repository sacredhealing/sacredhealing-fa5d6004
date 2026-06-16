#!/usr/bin/env python3
"""Shreem Brzee Hetzner SSH Deploy Script"""
import paramiko, os, sys

HOST     = "178.105.183.74"
USER     = "root"
PASS     = os.environ.get("HP", "")
GH_TOKEN = os.environ.get("GH", "")

GIT_URL  = f"https://x-access-token:{GH_TOKEN}@github.com/sacredhealing/sacredhealing-fa5d6004.git"

lines = [
    "set -e",
    'echo "SHREEM BRZEE Deploy starting..."',
    "node -v",
    f'REPO="/root/shreem-brzee"',
    f'GIT_URL="{GIT_URL}"',
    'if [ ! -d "$REPO/.git" ]; then',
    '  git clone "$GIT_URL" "$REPO" --depth=1 --quiet && echo "Cloned"',
    'else',
    '  cd "$REPO"',
    '  git remote set-url origin "$GIT_URL"',
    '  git fetch origin main --quiet && git reset --hard origin/main --quiet',
    '  echo "Pulled"',
    'fi',
    'cd "$REPO/railway/shreem-brzee-bot"',
    'npm install --omit=dev --silent 2>&1 | tail -2',
    'npx tsc --skipLibCheck 2>&1 | tail -5 || true',
    'ls dist/ && echo "dist OK" || (echo "ERROR: no dist/"; exit 1)',
    'if pm2 describe shreem-brzee > /dev/null 2>&1; then',
    '  pm2 restart shreem-brzee --update-env && echo "RESTARTED"',
    'else',
    '  pm2 start dist/index.js --name shreem-brzee && echo "STARTED"',
    'fi',
    'pm2 save --force > /dev/null',
    'sleep 4',
    'pm2 list',
    'pm2 logs shreem-brzee --lines 20 --nostream 2>/dev/null || true',
    'echo "DEPLOY COMPLETE"',
]

SCRIPT = "\n".join(lines)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to {HOST}...")
client.connect(HOST, username=USER, password=PASS, timeout=30)
print("Connected!")

stdin, stdout, stderr = client.exec_command(SCRIPT, timeout=600)

for line in iter(stdout.readline, ""):
    print(line, end="", flush=True)
for line in iter(stderr.readline, ""):
    print("ERR:", line, end="", flush=True)

code = stdout.channel.recv_exit_status()
client.close()
print(f"\nExit code: {code}")
sys.exit(code)
