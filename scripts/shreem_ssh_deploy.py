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
    'echo "SHREEM BRZEE v2.5 Deploy starting..."',
    "node -v",
    f'REPO="/root/shreem-brzee"',
    f'GIT_URL="{GIT_URL}"',
    'if [ ! -d "$REPO/.git" ]; then',
    '  git clone "$GIT_URL" "$REPO" --depth=1 --quiet && echo "Cloned"',
    'else',
    '  cd "$REPO"',
    '  git remote set-url origin "$GIT_URL"',
    '  git fetch origin main --quiet && git reset --hard origin/main --quiet',
    '  echo "Pulled: $(git log --oneline -1)"',
    'fi',
    'cd "$REPO/railway/shreem-brzee-bot"',
    'npm install --silent 2>&1 | tail -3',
    'echo "Compiling TypeScript..."',
    'rm -rf dist/',
    'npx tsc --skipLibCheck 2>&1',
    'echo "TSC exit: $?"',
    'ls -la dist/ || (echo "ERROR: no dist/ - compile failed"; exit 1)',
    'echo "Checking poller in dist:"',
    'grep -c "pollTimer" dist/index.js && echo "poller OK" || echo "WARNING: poller missing"',
    'grep -m2 "v2\\." dist/index.js || true',
    'if pm2 describe shreem-brzee > /dev/null 2>&1; then',
    '  pm2 delete shreem-brzee',
    'fi',
    'pm2 start dist/index.js --name shreem-brzee',
    'pm2 save --force > /dev/null',
    'sleep 5',
    'pm2 list',
    'pm2 logs shreem-brzee --lines 25 --nostream 2>/dev/null || true',
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
