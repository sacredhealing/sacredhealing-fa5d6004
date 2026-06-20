#!/usr/bin/env python3
"""EMERGENCY STOP: stop bot + set session stopped_at + read wallet state"""
import os, paramiko, json, re
from datetime import datetime, timezone

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

# Stop ALL bot processes immediately
print("=== STOPPING ALL BOT PROCESSES ===")
print(run("pm2 stop all 2>/dev/null; echo DONE"))
print(run("pm2 list --no-color 2>/dev/null | grep -E 'shreem|clawbot'"))

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
now = datetime.now(timezone.utc).isoformat()

print(f"\n=== SETTING SESSION STOPPED_AT ===")
stop_body = json.dumps({"stopped_at": now, "mode": "paper"})
r = run(f"""curl -sf -X PATCH "{SB}/rest/v1/shreem_brzee_session?id=eq.default" \
  -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{stop_body}'""")
print(f"Stop result: {r[:200]}")

print(f"\n=== SESSION STATE AFTER STOP ===")
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    s = json.loads(r2)[0]
    print(f"mode={s.get('mode')} stopped_at={s.get('stopped_at')} portfolio={s.get('portfolio')}")
except: print(r2[:200])

print(f"\n=== ALL LIVE TRADES IN DB ===")
r3 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r3)
    print(f"Total: {len(trades)}")
    for t in trades:
        status = t.get('status','?')
        sym = t.get('symbol','?')
        mint = t.get('mint','')[:16]
        sol = t.get('amount_sol','?')
        tokens = t.get('tokens_received','?')
        dec = t.get('token_decimals','?')
        tx = str(t.get('tx_sig',''))[:30]
        opened = str(t.get('opened_at',''))[:19]
        print(f"  [{status}] {sym} | {mint} | {sol} SOL | tokens={tokens} decimals={dec} | tx={tx} | opened={opened}")
except: print(r3[:400])

print(f"\n=== BOT WALLET SOL ===")
r4 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"{BOT}\"]}}'")
try: print(f"SOL balance: {json.loads(r4).get('result',{}).get('value',0)/1e9}")
except: print(r4[:100])

print(f"\n=== BOT WALLET TOKENS ===")
r5 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"{BOT}\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}'")
try:
    accts = json.loads(r5).get('result',{}).get('value',[])
    non_zero = []
    for a in accts:
        info = a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        ta = info.get('tokenAmount',{})
        amt = float(ta.get('uiAmount') or 0)
        if amt > 0:
            non_zero.append({'mint': info.get('mint',''), 'amount': amt, 'decimals': ta.get('decimals',6), 'raw': ta.get('amount','0')})
            print(f"  {info.get('mint','')} | {amt} tokens | dec={ta.get('decimals',6)}")
    print(f"Non-zero token accounts: {len(non_zero)}")
except: print(r5[:200])

print(f"\n=== RECENT SIGNALS ===")
r6 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?order=created_at.desc&limit=15" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    for s in json.loads(r6):
        print(f"  {s.get('action')} | {s.get('label')} | {s.get('symbol','?')} | {s.get('mint','')[:14]} | processed={s.get('live_processed')} | {str(s.get('created_at',''))[:19]}")
except: print(r6[:300])

# Restart only clawbot - NOT shreem
print(f"\n=== RESTARTING CLAWBOT ONLY ===")
print(run("pm2 start clawbot 2>/dev/null; pm2 list --no-color 2>/dev/null | grep clawbot"))

client.close()
print("\n=== BOT STOPPED. NO MORE TRADES WILL EXECUTE. ===")
