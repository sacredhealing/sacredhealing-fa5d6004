#!/usr/bin/env python3
"""Read DB state: session + all live trades"""
import os, paramiko, json

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd)
    return out.read().decode().strip()

# Read supabase key from ecosystem
eco = run("cat /root/shreem-ecosystem.config.js 2>/dev/null")
sb_key = ""
import re
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY["\s:]+["\']([^"\']{20,})["\']', eco)
if m: sb_key = m.group(1)
print("SB key found:", bool(sb_key), sb_key[:12] if sb_key else "MISSING")

SB_URL = "https://ssygukfdbtehvtndandn.supabase.co"

# Read session
print("\n=== SESSION ===")
r = run(f"""curl -sf '{SB_URL}/rest/v1/shreem_brzee_session?id=eq.default&select=mode,portfolio,start_balance,started_at,stopped_at,wins,losses' -H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}'""")
print(r)

# Read ALL live trades
print("\n=== ALL LIVE TRADES ===")
r2 = run(f"""curl -sf '{SB_URL}/rest/v1/shreem_brzee_live_trades?select=id,status,symbol,mint,amount_sol,entry_price,pnl_pct,pnl_sol,opened_at,closed_at,sell_reason,tx_sig,tx_sig_close&order=opened_at.desc&limit=20' -H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}'""")
try:
    trades = json.loads(r2)
    print(f"Total: {len(trades)}")
    for t in trades:
        print(f"  {t.get('status','?')} | {t.get('symbol','?')} | {t.get('amount_sol','?')} SOL | opened:{str(t.get('opened_at',''))[:19]} | closed:{str(t.get('closed_at',''))[:19]} | reason:{t.get('sell_reason','?')} | tx:{str(t.get('tx_sig',''))[:16]}")
except:
    print(r2[:500])

# Recent signals with live_processed status
print("\n=== RECENT SIGNALS (last 10) ===")
r3 = run(f"""curl -sf '{SB_URL}/rest/v1/shreem_brzee_signals?select=action,symbol,label,amount_sol,live_processed,created_at&order=created_at.desc&limit=10' -H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}'""")
try:
    sigs = json.loads(r3)
    for s in sigs:
        print(f"  {s.get('action')} | {s.get('label')} | {s.get('symbol','?')} | {s.get('amount_sol','?')} SOL | processed:{s.get('live_processed')} | {str(s.get('created_at',''))[:19]}")
except:
    print(r3[:500])

client.close()
print("\n=== DONE ===")
