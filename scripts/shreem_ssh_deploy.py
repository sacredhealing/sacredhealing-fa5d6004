#!/usr/bin/env python3
"""
shreem_ssh_deploy.py
Executed by shreem-hetzner-ssh.yml via paramiko on Hetzner.
Reads BOT_WALLET_PRIVATE_KEY from /root/shreem-live-ecosystem.config.js,
then rewrites /root/shreem-ecosystem.config.js to point at v6 worker with keypair.
"""
import os, paramiko, re

HP = os.environ["HP"]
HOST = "178.105.183.74"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=HP, timeout=30)

def run(cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if out: print(out)
    if err: print("STDERR:", err)
    return out

print("=== 1. READ BOT_WALLET_PRIVATE_KEY from existing ecosystem ===")
raw = run("cat /root/shreem-live-ecosystem.config.js 2>/dev/null || echo MISSING")

bk = ""
if "BOT_WALLET_PRIVATE_KEY" in raw:
    m = re.search(r'BOT_WALLET_PRIVATE_KEY["\s:]+["\']?([A-Za-z0-9]{80,})["\']?', raw)
    if m:
        bk = m.group(1)
        print(f"✅ Keypair found: {bk[:8]}...{bk[-4:]}")
    else:
        print("⚠️  Pattern not matched - trying alternate extract")
        for line in raw.split("\n"):
            if "BOT_WALLET_PRIVATE_KEY" in line:
                print("  Line:", line[:120])
                parts = line.split(":")
                if len(parts) > 1:
                    val = parts[-1].strip().strip('"').strip("'").strip(",").strip()
                    if len(val) > 40:
                        bk = val
                        print(f"✅ Extracted: {bk[:8]}...")
                        break
else:
    print("⚠️  BOT_WALLET_PRIVATE_KEY not in ecosystem file. Checking shreem-ecosystem.config.js...")
    raw2 = run("cat /root/shreem-ecosystem.config.js 2>/dev/null || echo MISSING")
    for line in raw2.split("\n"):
        if "SHREEM_BOT_KEYPAIR" in line or "BOT_WALLET" in line:
            parts = line.split(":")
            if len(parts) > 1:
                val = parts[-1].strip().strip('"').strip("'").strip(",").strip()
                if len(val) > 40:
                    bk = val
                    print(f"✅ Found in shreem-ecosystem: {bk[:8]}...")
                    break

if not bk:
    print("❌ Could not extract keypair from any ecosystem file")
    print("ECOSYSTEM CONTENT:", raw[:500])
    exit(1)

print("=== 2. GET SUPABASE_SERVICE_ROLE_KEY ===")
sb_raw = run("cat /root/shreem-ecosystem.config.js 2>/dev/null || echo MISSING")
sb_key = ""
for line in sb_raw.split("\n"):
    if "SUPABASE_SERVICE_ROLE_KEY" in line:
        parts = line.split(":")
        if len(parts) > 1:
            val = parts[-1].strip().strip('"').strip("'").strip(",").strip()
            if len(val) > 20:
                sb_key = val
                print(f"✅ SB key: {sb_key[:12]}...")
                break

if not sb_key:
    # Try live ecosystem
    for line in raw.split("\n"):
        if "SUPABASE_SERVICE_ROLE_KEY" in line:
            parts = line.split(":")
            if len(parts) > 1:
                val = parts[-1].strip().strip('"').strip("'").strip(",").strip()
                if len(val) > 20:
                    sb_key = val
                    print(f"✅ SB key (from live): {sb_key[:12]}...")
                    break

print("=== 3. COPY v6 WORKER ===")
run("cp /root/shreem-brzee/hetzner/shreem-live-worker.js /root/shreem-live-worker.js && echo COPIED")
run("node --version")

print("=== 4. INSTALL @solana/web3.js ===")
run("cd /root && npm install @solana/web3.js --save --silent 2>&1 | tail -2")

print("=== 5. WRITE CORRECT ECOSYSTEM ===")
eco = f"""module.exports={{apps:[{{
  name:"shreem-live",
  script:"/root/shreem-live-worker.js",
  restart_delay:5000,
  max_restarts:10,
  env:{{
    SUPABASE_SERVICE_ROLE_KEY:"{sb_key}",
    SHREEM_BOT_KEYPAIR:"{bk}",
    BOT_WALLET_PRIVATE_KEY:"{bk}",
    HELIUS_API_KEY:"7de253c3-49e2-42be-9672-23a761260f86"
  }}
}}]}};"""

cmd = f"cat > /root/shreem-ecosystem.config.js << 'ECOEOF'\n{eco}\nECOEOF\necho ECOSYSTEM-WRITTEN"
run(cmd)
run("head -5 /root/shreem-ecosystem.config.js")

print("=== 6. RESTART PM2 ===")
run("pm2 stop shreem-live 2>/dev/null; pm2 delete shreem-live 2>/dev/null; true")
run("pm2 start /root/shreem-ecosystem.config.js && pm2 save --force && echo PM2-OK")

import time; time.sleep(6)

print("=== 7. VERIFY ===")
run("pm2 list")
run("pm2 logs shreem-live --lines 30 --nostream 2>/dev/null || true")

print("=== 8. HEALTH ===")
run("curl -sf http://localhost:3001 || echo STARTING")

client.close()
print("=== DONE ===")
