#!/usr/bin/env python3
"""EMERGENCY: read wallet + all live trades + recent signals"""
import os, paramiko, json, re

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"

# STOP THE BOT IMMEDIATELY
print("=== STOPPING BOT ===")
run("pm2 stop shreem-brzee 2>/dev/null; pm2 stop shreem-live 2>/dev/null; echo STOPPED")

# Read all live trades
print("\n=== ALL LIVE TRADES IN DB ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r)
    print(f"Total: {len(trades)}")
    for t in trades:
        print(f"  [{t.get('status')}] {t.get('symbol','?')} | {t.get('mint','')[:16]} | {t.get('amount_sol')} SOL | tokens={t.get('tokens_received')} | decimals={t.get('token_decimals')} | tx={str(t.get('tx_sig',''))[:30]} | opened={str(t.get('opened_at',''))[:19]}")
except: print(r[:400])

# Read session
print("\n=== SESSION ===")
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    s = json.loads(r2)[0]
    print(f"mode={s.get('mode')} portfolio={s.get('portfolio')} start_balance={s.get('start_balance')} wins={s.get('wins')} losses={s.get('losses')}")
except: print(r2[:200])

# Bot wallet SOL
print("\n=== BOT WALLET SOL ===")
r3 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"{BOT}\"]}}'")
try:
    sol = json.loads(r3).get('result',{}).get('value',0)/1e9
    print(f"SOL: {sol}")
except: print(r3[:100])

# Bot wallet tokens
print("\n=== BOT WALLET TOKENS ===")
r4 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"{BOT}\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}'")
try:
    accts = json.loads(r4).get('result',{}).get('value',[])
    non_zero = []
    for a in accts:
        info = a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        ta = info.get('tokenAmount',{})
        amt = float(ta.get('uiAmount') or 0)
        if amt > 0:
            non_zero.append(info)
            print(f"  {info.get('mint','')} | {amt} tokens | decimals={ta.get('decimals')}")
    if not non_zero:
        print("  NO TOKENS - all sold or never bought")
except: print(r4[:200])

# Recent signals - see what was processed
print("\n=== RECENT SIGNALS (last 20) ===")
r5 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?order=created_at.desc&limit=20" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    sigs = json.loads(r5)
    for s in sigs:
        print(f"  {s.get('action')} | {s.get('label')} | {s.get('symbol','?')} | {s.get('mint','')[:14]} | {s.get('amount_sol')} SOL | processed={s.get('live_processed')} | {str(s.get('created_at',''))[:19]}")
except: print(r5[:300])

# Get executor logs to see what it did
print("\n=== EXECUTOR RECENT LOGS ===")
print(run("pm2 logs shreem-brzee --lines 50 --nostream 2>/dev/null | tail -60"))

print("\n=== PM2 STATUS ===")
print(run("pm2 list --no-color 2>/dev/null"))

client.close()
print("\n=== EMERGENCY STOP COMPLETE ===")
