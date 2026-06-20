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

# KILL the old TS bot permanently
print("=== KILLING OLD TS BOT ===")
print(run("pm2 stop shreem-brzee 2>/dev/null; pm2 delete shreem-brzee 2>/dev/null; echo KILLED"))

# Also delete the old bot process entirely so PM2 can't restart it
print(run("pm2 save 2>/dev/null; echo SAVED"))

# Count signals in DB last hour
print("\n=== SIGNAL COUNT LAST 1H ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?select=action,label,created_at&order=created_at.desc&limit=200" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    import sys
    from datetime import datetime, timezone, timedelta
    sigs = json.loads(r)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = [s for s in sigs if s.get('created_at','') > cutoff.isoformat()]
    print(f"Signals in last 1h: {len(recent)}")
    by_whale = {}
    for s in recent:
        label = s.get('label','?')
        by_whale[label] = by_whale.get(label,0) + 1
    for k,v in sorted(by_whale.items(), key=lambda x:-x[1]):
        print(f"  {k}: {v}")
    print(f"\n1 credit per tx = {len(recent)} credits/hour = {len(recent)*24*30} credits/month")
    print(f"1M credits / {len(recent)*24*30} per month = {1000000//(len(recent)*24*30)} months on free plan")
except Exception as e:
    print(f"Error: {e} | {r[:200]}")

# PM2 final state
print("\n=== PM2 FINAL STATE ===")
print(run("pm2 list --no-color 2>/dev/null | grep -v namespace | grep -v Applying"))

# Restart clawbot only
print("\n=== CLAWBOT RESTART ===")
print(run("pm2 start clawbot 2>/dev/null; echo done"))

client.close()
print("\nOLD TS BOT PERMANENTLY DELETED")
