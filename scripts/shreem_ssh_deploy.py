#!/usr/bin/env python3
"""Fix: insert existing Phantom token positions as open live trades so auto-sell works"""
import os, paramiko, json, re, uuid, datetime

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd, timeout=30):
    _, out, err = client.exec_command(cmd, timeout=timeout)
    return out.read().decode().strip()

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
print("SB key:", "OK" if sb_key else "MISSING")

SB = "https://ssygukfdbtehvtndandn.supabase.co"
H = f'-H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json"'

# 1. Read current live trades
print("\n=== CURRENT LIVE TRADES ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" {H}')
try:
    trades = json.loads(r)
    print(f"Count: {len(trades)}")
    for t in trades:
        print(f"  [{t.get('status')}] {t.get('symbol')} | {t.get('amount_sol')} SOL | tx={str(t.get('tx_sig',''))[:20]}")
except Exception as e:
    print("Error:", e, r[:300])

# 2. Read session
print("\n=== SESSION ===")
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" {H}')
try:
    sess_list = json.loads(r2)
    sess = sess_list[0] if sess_list else {}
    print(f"mode={sess.get('mode')} portfolio={sess.get('portfolio')} started={str(sess.get('started_at',''))[:19]}")
except Exception as e:
    print("Error:", e, r2[:200])

# 3. PM2 list
print("\n=== PM2 ===")
print(run("pm2 list --no-color 2>/dev/null | grep -E 'name|shreem|clawbot'"))

# 4. Read v6 worker logs (if running as shreem-brzee id=23)
print("\n=== v6 WORKER LOGS ===")
print(run("pm2 logs shreem-brzee --lines 20 --nostream 2>/dev/null | tail -25"))

# 5. Check which script is actually running
print("\n=== WHAT IS shreem-brzee RUNNING ===")
print(run("pm2 describe shreem-brzee 2>/dev/null | grep -E 'script|exec|cwd'"))

client.close()
print("\n=== DONE ===")
