#!/usr/bin/env python3
import os, paramiko, json, re
from datetime import datetime, timezone

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=25)
    return out.read().decode().strip()

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
now = datetime.now(timezone.utc).isoformat()

# STOP session
print("=== STOPPING SESSION ===")
stop = json.dumps({"stopped_at": now, "mode": "paper", "updated_at": now})
r = run(f"""curl -sf -X PATCH "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json" -H "Prefer: return=representation" -d '{stop}'""")
print(r[:300])

# Stop all PM2 processes  
print("\n=== PM2 STOP ALL ===")
print(run("pm2 stop all 2>/dev/null; pm2 list --no-color 2>/dev/null | grep -E 'name|shreem|clawbot'"))

# Session confirmation
print("\n=== SESSION AFTER STOP ===")
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    s = json.loads(r2)[0]
    print(f"mode={s.get('mode')} stopped_at={s.get('stopped_at')} portfolio={s.get('portfolio')} wins={s.get('wins')} losses={s.get('losses')}")
except: print(r2[:200])

# Read ALL live trades - this is the most important
print("\n=== ALL LIVE TRADES ===")
r3 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.asc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r3)
    print(f"Total trades in DB: {len(trades)}")
    total_spent = 0
    for t in trades:
        sol = float(t.get('amount_sol') or 0)
        total_spent += sol
        print(f"  [{t.get('status')}] {t.get('symbol','?')} | {sol} SOL | tx={str(t.get('tx_sig',''))[:20]} | opened={str(t.get('opened_at',''))[:19]} | closed={str(t.get('closed_at',''))[:16]}")
    print(f"Total SOL spent on trades in DB: {total_spent}")
except: print(r3[:400])

# Wallet balance
print("\n=== BOT WALLET ===")
r4 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"{BOT}\"]}}'")
try: print(f"SOL: {json.loads(r4).get('result',{}).get('value',0)/1e9}")
except: print(r4[:100])

# Tokens still held
print("\n=== TOKENS IN WALLET ===")
r5 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"{BOT}\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}'")
try:
    accts = json.loads(r5).get('result',{}).get('value',[])
    any_tokens = False
    for a in accts:
        info = a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        ta = info.get('tokenAmount',{})
        amt = float(ta.get('uiAmount') or 0)
        if amt > 0:
            print(f"  STILL HOLDING: {info.get('mint','')} | {amt} tokens | decimals={ta.get('decimals',6)}")
            any_tokens = True
    if not any_tokens:
        print("  No tokens with balance found")
except: print(r5[:200])

# Get recent tx history on bot wallet to understand what happened
print("\n=== RECENT TRANSACTIONS (last 10) ===")
r6 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getSignaturesForAddress\",\"params\":[\"{BOT}\",{{\"limit\":15}}]}}'")
try:
    txs = json.loads(r6).get('result',[])
    print(f"Recent transactions: {len(txs)}")
    for tx in txs:
        ts = tx.get('blockTime',0)
        from datetime import datetime
        dt = datetime.utcfromtimestamp(ts).strftime('%H:%M:%S') if ts else '?'
        print(f"  {tx.get('signature','')[:20]} | {dt} | err={tx.get('err')}")
except: print(r6[:300])

# Restart clawbot only
print("\n=== RESTARTING CLAWBOT ===")
print(run("pm2 start clawbot 2>/dev/null; echo done"))

client.close()
print("\n=== COMPLETE — SHREEM BOT IS STOPPED ===")
