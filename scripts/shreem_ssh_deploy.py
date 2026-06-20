#!/usr/bin/env python3
import os, paramiko, json, re
from datetime import datetime, timezone

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

# Count signals in last 1 hour to see webhook volume
print("=== SIGNALS LAST 1 HOUR ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?select=action,label,created_at&order=created_at.desc&limit=500" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    sigs = json.loads(r)
    from datetime import datetime, timezone, timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = [s for s in sigs if s.get('created_at','') > cutoff.isoformat()]
    print(f"Total signals last 1h: {len(recent)}")
    
    # Count by whale
    by_whale = {}
    for s in recent:
        label = s.get('label','?')
        by_whale[label] = by_whale.get(label, 0) + 1
    for whale, count in sorted(by_whale.items(), key=lambda x: -x[1]):
        print(f"  {whale}: {count} signals")
    
    # Count by action
    buys = sum(1 for s in recent if s.get('action') == 'BUY')
    sells = sum(1 for s in recent if s.get('action') == 'SELL')
    print(f"\nBUY: {buys} | SELL: {sells}")
    print(f"Estimated credits from signals alone: {len(recent)} (1 credit each)")
    print(f"At this rate: {len(recent) * 24} credits/day, {len(recent) * 24 * 30} credits/month")
except Exception as e:
    print(f"Error: {e} | {r[:200]}")

client.close()
