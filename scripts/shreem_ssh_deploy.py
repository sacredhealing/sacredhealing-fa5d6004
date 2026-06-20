#!/usr/bin/env python3
import os, paramiko, json, re
from datetime import datetime, timezone, timedelta

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

# Get TOTAL signal count and last 10 min
print("=== SIGNAL COUNT ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?select=created_at&order=created_at.desc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Range: 0-999" -H "Prefer: count=exact" -i')
# Extract count from header
lines = r.split("\n")
for l in lines[:10]:
    if 'content-range' in l.lower() or 'Content-Range' in l:
        print("Total signals in DB:", l)

# Get count for last 10 min  
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?select=created_at&order=created_at.desc&limit=200" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    sigs = json.loads(r2)
    cutoff10 = datetime.now(timezone.utc) - timedelta(minutes=10)
    cutoff30 = datetime.now(timezone.utc) - timedelta(minutes=30)
    last10 = [s for s in sigs if s.get('created_at','') > cutoff10.isoformat()]
    last30 = [s for s in sigs if s.get('created_at','') > cutoff30.isoformat()]
    print(f"Signals last 10min: {len(last10)}")
    print(f"Signals last 30min: {len(last30)}")
    print(f"Rate: {len(last10)*6}/hour")
    print(f"= {len(last10)*6*24}/day credits from webhook receives")
    if len(last10) > 0:
        print(f"\nMost recent: {sigs[0].get('created_at','')} from {sigs[0].get('label','?')}")
except Exception as e:
    print(f"Error: {e}")

# Check Helius webhook - is there more than 1 webhook registered?
HELIUS = os.environ.get("HELIUS_KEY","7de253c3-49e2-42be-9672-23a761260f86")
print("\n=== HELIUS WEBHOOKS ===")
r3 = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={HELIUS}"')
try:
    hooks = json.loads(r3)
    print(f"Total webhooks registered: {len(hooks)}")
    for h in hooks:
        print(f"  ID: {h.get('webhookID')} | type: {h.get('webhookType')} | wallets: {len(h.get('accountAddresses',[]))} | txTypes: {h.get('transactionTypes')}")
except Exception as e:
    print(f"Error: {e} | {r3[:200]}")

client.close()
