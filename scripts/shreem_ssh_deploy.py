#!/usr/bin/env python3
"""shreem_ssh_deploy.py — Switch shreem-brzee to LIVE mode"""
import os, paramiko, re, json

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, err = client.exec_command(cmd)
    o = out.read().decode().strip()
    if o: print(o)
    return o

print("=== CURRENT PM2 ===")
run("pm2 list")

print("\n=== READ BOT KEYPAIR from existing ecosystem ===")
raw = run("cat /root/shreem-live-ecosystem.config.js 2>/dev/null || cat /root/shreem-ecosystem.config.js 2>/dev/null || echo MISSING")
print("Raw (redacted):", "FOUND" if "BOT_WALLET_PRIVATE_KEY" in raw else "NOT FOUND")

bk = ""
for line in raw.split("\n"):
    if "BOT_WALLET_PRIVATE_KEY" in line or "SHREEM_BOT_KEYPAIR" in line:
        # Extract value after : stripping quotes
        m = re.search(r'["\']([A-Za-z0-9]{60,})["\']', line)
        if m:
            bk = m.group(1)
            print(f"Keypair: {bk[:6]}...{bk[-4:]} ({len(bk)} chars)")
            break

if not bk:
    print("ERROR: Could not extract keypair")
    exit(1)

print("\n=== GET CURRENT shreem-brzee ECOSYSTEM ===")
eco_raw = run("cat /root/shreem-ecosystem.config.js 2>/dev/null || echo NONE")

# Find supabase key
sb = ""
for line in eco_raw.split("\n"):
    if "SUPABASE_SERVICE_ROLE_KEY" in line:
        m = re.search(r'["\']([A-Za-z0-9._\-]{20,})["\']', line)
        if m:
            sb = m.group(1)
            break
if not sb:
    # Try from live ecosystem
    for line in raw.split("\n"):
        if "SUPABASE_SERVICE_ROLE_KEY" in line:
            m = re.search(r'["\']([A-Za-z0-9._\-]{20,})["\']', line)
            if m:
                sb = m.group(1)
                break

print(f"SB key: {sb[:12]}..." if sb else "SB key: NOT FOUND")
if not sb:
    print("ERROR: No supabase key")
    exit(1)

helius = "7de253c3-49e2-42be-9672-23a761260f86"
sb_url  = "https://ssygukfdbtehvtndandn.supabase.co"

print("\n=== WRITE LIVE ECOSYSTEM FOR shreem-brzee ===")
eco_content = f"""module.exports = {{
  apps: [{{
    name: "shreem-brzee",
    script: "/root/shreem-brzee/railway/shreem-brzee-bot/dist/index.js",
    cwd: "/root/shreem-brzee/railway/shreem-brzee-bot",
    restart_delay: 5000,
    max_restarts: 20,
    watch: false,
    env: {{
      NODE_ENV: "production",
      BOT_MODE: "live",
      HELIUS_API_KEY: "{helius}",
      BOT_WALLET_PRIVATE_KEY: "{bk}",
      SHREEM_BOT_KEYPAIR: "{bk}",
      SUPABASE_URL: "{sb_url}",
      SUPABASE_SERVICE_ROLE_KEY: "{sb}"
    }}
  }}]
}};"""

# Write via heredoc
cmd = "cat > /root/shreem-ecosystem.config.js << 'ECOEOF'\n" + eco_content + "\nECOEOF\necho WRITTEN"
run(cmd)

print("\n=== RESTART shreem-brzee in LIVE mode ===")
run("pm2 stop shreem-brzee 2>/dev/null; pm2 delete shreem-brzee 2>/dev/null; true")
run("pm2 start /root/shreem-ecosystem.config.js && pm2 save --force && echo PM2-OK")

import time; time.sleep(8)

print("\n=== PM2 STATUS ===")
run("pm2 list")

print("\n=== LOGS ===")
run("pm2 logs shreem-brzee --lines 30 --nostream 2>/dev/null")

print("\n=== DONE — shreem-brzee is now in LIVE mode ===")
client.close()
