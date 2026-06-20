#!/usr/bin/env python3
"""Insert existing Phantom tokens as open live trades so auto-sell works"""
import os, paramiko, json, re, uuid
from datetime import datetime, timezone

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd)
    return out.read().decode().strip()

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"
H = f'-H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json" -H "Prefer: return=representation"'

print("SB key:", "OK" if sb_key else "MISSING")

# Check what's already in live_trades
print("\n=== CURRENT LIVE TRADES ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" {H}')
try:
    trades = json.loads(r)
    print(f"Count in DB: {len(trades)}")
    for t in trades:
        print(f"  [{t.get('status')}] {t.get('symbol')} mint={t.get('mint','')[:16]}")
except Exception as e:
    print("Error parsing:", r[:200])

# Check bot wallet token accounts to get exact mint addresses and amounts
print("\n=== BOT WALLET TOKEN ACCOUNTS ===")
BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
# Use mainnet-beta public RPC - no credits needed
r2 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["{BOT_WALLET}",{{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}},{{"encoding":"jsonParsed"}}]}}'""")
try:
    rpc_data = json.loads(r2)
    accounts = rpc_data.get('result',{}).get('value',[])
    print(f"Token accounts found: {len(accounts)}")
    for acct in accounts:
        info = acct.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        mint = info.get('mint','')
        ta = info.get('tokenAmount',{})
        amount = ta.get('uiAmount', 0)
        decimals = ta.get('decimals', 6)
        raw = ta.get('amount', '0')
        print(f"  mint={mint} amount={amount} decimals={decimals} raw={raw}")
except Exception as e:
    print("Error:", e, r2[:200])

# Get SOL balance
print("\n=== BOT WALLET SOL BALANCE ===")
r3 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["{BOT_WALLET}"]}}'""")
try:
    bal_data = json.loads(r3)
    sol_bal = bal_data.get('result',{}).get('value',0) / 1e9
    print(f"SOL balance: {sol_bal}")
except: print(r3[:200])

client.close()
print("\n=== DONE ===")
