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

# Count signals in last 30 minutes
print("=== SIGNALS LAST 30 MIN ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?select=action,label,created_at&order=created_at.desc&limit=500" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    sigs = json.loads(r)
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=30)
    recent = [s for s in sigs if s.get('created_at','') > cutoff.isoformat()]
    print(f"Signals in 30 min: {len(recent)}")
    print(f"= {len(recent)*2}/hour = {len(recent)*2*24}/day = {len(recent)*2*24*30}/month credits JUST from webhook receive")
    
    by_whale = {}
    for s in recent:
        label = s.get('label','?')
        by_whale[label] = by_whale.get(label,0) + 1
    print("\nBy whale (last 30min):")
    for k,v in sorted(by_whale.items(), key=lambda x:-x[1]):
        print(f"  {k}: {v} signals")
except Exception as e:
    print(f"Error: {e}")

# PM2 status
print("\n=== PM2 ===")
print(run("pm2 list --no-color 2>/dev/null | grep -v namespace | grep -v Applying | grep -v '──'"))

# Check what processes are alive and making Helius calls
print("\n=== HELIUS KEY USAGE IN RUNNING PROCESSES ===")
print(run("ps aux | grep -E 'node|deno|shreem' | grep -v grep | head -10"))
print(run("netstat -an 2>/dev/null | grep ESTABLISHED | grep -E ':443|:80' | wc -l"))

client.close()
