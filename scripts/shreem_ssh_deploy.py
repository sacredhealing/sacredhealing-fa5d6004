#!/usr/bin/env python3
"""Read DB state and write to _shreem_db_state.txt"""
import os, paramiko, json, re, subprocess

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, err = client.exec_command(cmd)
    o = out.read().decode().strip()
    return o

# Get supabase key
eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
print("SB key:", sb_key[:12] if sb_key else "MISSING")

SB = "https://ssygukfdbtehvtndandn.supabase.co"
H = f"-H 'apikey: {sb_key}' -H 'Authorization: Bearer {sb_key}' -H 'Content-Type: application/json'"

lines = []

# Session
r = run(f"curl -sf '{SB}/rest/v1/shreem_brzee_session?id=eq.default' {H}")
try:
    s = json.loads(r)
    sess = s[0] if s else {}
    lines.append(f"SESSION: mode={sess.get('mode')} portfolio={sess.get('portfolio')} start_bal={sess.get('start_balance')} started={str(sess.get('started_at',''))[:19]} stopped={sess.get('stopped_at')} wins={sess.get('wins')} losses={sess.get('losses')}")
except: lines.append(f"SESSION RAW: {r[:200]}")

# All live trades
r2 = run(f"curl -sf '{SB}/rest/v1/shreem_brzee_live_trades?select=id,status,symbol,mint,amount_sol,entry_price,tokens_received,pnl_pct,pnl_sol,opened_at,closed_at,sell_reason,tx_sig,tx_sig_close&order=opened_at.desc' {H}")
try:
    trades = json.loads(r2)
    lines.append(f"\nLIVE TRADES ({len(trades)} total):")
    for t in trades:
        lines.append(f"  [{t.get('status')}] {t.get('symbol','?')} | {t.get('amount_sol')} SOL | entry={t.get('entry_price')} | tokens={t.get('tokens_received')} | pnl={t.get('pnl_pct')}% | opened={str(t.get('opened_at',''))[:19]} | closed={str(t.get('closed_at',''))[:19]} | reason={t.get('sell_reason')} | tx={str(t.get('tx_sig',''))[:20]} | tx_close={str(t.get('tx_sig_close',''))[:20]}")
except: lines.append(f"TRADES RAW: {r2[:300]}")

# Recent signals
r3 = run(f"curl -sf '{SB}/rest/v1/shreem_brzee_signals?select=action,symbol,label,mint,amount_sol,live_processed,created_at&order=created_at.desc&limit=15' {H}")
try:
    sigs = json.loads(r3)
    lines.append(f"\nRECENT SIGNALS ({len(sigs)}):")
    for s in sigs:
        lines.append(f"  {s.get('action')} | {s.get('label')} | {s.get('symbol','?')} | {s.get('mint','')[:12]} | {s.get('amount_sol')} SOL | processed={s.get('live_processed')} | {str(s.get('created_at',''))[:19]}")
except: lines.append(f"SIGNALS RAW: {r3[:300]}")

# PM2 list
r4 = run("pm2 list")
lines.append(f"\nPM2:\n{r4}")

output = "\n".join(lines)
print(output)

# Write to file in repo so we can read it
run(f"echo '{output.replace(chr(39), chr(34))}' > /tmp/db_state.txt")

client.close()
