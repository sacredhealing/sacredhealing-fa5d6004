#!/usr/bin/env python3
import os, paramiko, json, re

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY.{0,5}["\'](\S{20,})["\'\s]', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"

# STOP ALL PM2
print("=== STOP ALL ===")
print(run("pm2 stop all && pm2 delete all && pm2 save --force && echo DONE"))

# Stop session in DB
from datetime import datetime, timezone
now = datetime.now(timezone.utc).isoformat()
print("\n=== STOP SESSION ===")
r = run(f'curl -sf -X PATCH "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json" -d "{{\"stopped_at\":\"{now}\",\"mode\":\"paper\"}}"')
print(r[:200])

# Delete ALL Helius webhooks
HELIUS = os.environ.get("HELIUS_KEY", "7de253c3-49e2-42be-9672-23a761260f86")
print("\n=== DELETE ALL HELIUS WEBHOOKS ===")
r2 = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={HELIUS}"')
try:
    hooks = json.loads(r2)
    print(f"Found {len(hooks)} webhooks")
    for h in hooks:
        wid = h.get('webhookID','')
        dr = run(f'curl -sf -X DELETE "https://api.helius.xyz/v0/webhooks/{wid}?api-key={HELIUS}"')
        print(f"Deleted {wid}: {dr[:50]}")
except Exception as e:
    print(f"Error: {e} | {r2[:200]}")

# Verify
r3 = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={HELIUS}"')
print(f"\nWebhooks remaining: {r3[:100]}")

print("\n=== ALL STOPPED. Credits will stop draining now. ===")
client.close()
