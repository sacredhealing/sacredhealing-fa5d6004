#!/usr/bin/env python3
"""
Insert existing Phantom token positions as open live trades.
Also read actual mint addresses from on-chain.
"""
import os, paramiko, json, re

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
BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
H = f'-H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json"'

print("=== 1. CURRENT DB STATE ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" {H}')
try:
    trades = json.loads(r)
    print(f"Live trades in DB: {len(trades)}")
    for t in trades: print(f"  [{t.get('status')}] {t.get('symbol')} {t.get('mint','')[:16]} {t.get('amount_sol')} SOL tx={str(t.get('tx_sig',''))[:20]}")
except: print(f"Error: {r[:200]}")

print("\n=== 2. ON-CHAIN TOKEN ACCOUNTS ===")
rpc_r = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["{BOT_WALLET}",{{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}},{{"encoding":"jsonParsed"}}]}}'""")
token_accounts = []
try:
    rpc_data = json.loads(rpc_r)
    accounts = rpc_data.get('result',{}).get('value',[])
    print(f"Token accounts: {len(accounts)}")
    for a in accounts:
        info = a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        ta = info.get('tokenAmount',{})
        amt = float(ta.get('uiAmount') or 0)
        dec = int(ta.get('decimals',6))
        raw = ta.get('amount','0')
        mint = info.get('mint','')
        print(f"  {mint} | amount={amt} decimals={dec} raw={raw}")
        if amt > 0:
            token_accounts.append({'mint': mint, 'amount': amt, 'decimals': dec, 'raw': raw})
except Exception as e:
    print(f"RPC error: {e} | {rpc_r[:200]}")

print(f"\nTokens with balance: {len(token_accounts)}")

print("\n=== 3. SESSION ===")
r_sess = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" {H}')
try:
    sess = json.loads(r_sess)
    s = sess[0] if sess else {}
    print(f"mode={s.get('mode')} portfolio={s.get('portfolio')} started={str(s.get('started_at',''))[:19]}")
except: print(r_sess[:200])

print("\n=== 4. INSERT MISSING POSITIONS ===")
# For each token with balance, check if it's already in DB
for tok in token_accounts:
    mint = tok['mint']
    # Check if already in DB
    r_check = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?status=eq.open&mint=eq.{mint}" {H}')
    try:
        existing = json.loads(r_check)
        if existing:
            print(f"  {mint[:12]}: already in DB ({existing[0].get('symbol')})")
            continue
    except: pass
    
    # Get price from DexScreener
    price_r = run(f"curl -sf 'https://api.dexscreener.com/latest/dex/tokens/{mint}' --max-time 8")
    entry_price = None
    symbol = None
    try:
        ds = json.loads(price_r)
        pairs = [p for p in (ds.get('pairs') or []) if p.get('priceUsd')]
        if pairs:
            pairs.sort(key=lambda p: float(p.get('liquidity',{}).get('usd',0) or 0), reverse=True)
            entry_price = float(pairs[0]['priceUsd'])
            symbol = pairs[0].get('baseToken',{}).get('symbol','')
            print(f"  {mint[:12]}: symbol={symbol} current_price=${entry_price}")
    except: print(f"  {mint[:12]}: price fetch failed")
    
    # Insert as open position
    # Use tokens_received as the raw amount (will be used for sell)
    # amount_sol: estimate based on 0.479 SOL / num_tokens
    num_tokens = len(token_accounts) if token_accounts else 1
    est_sol = 0.479 / num_tokens
    
    trade_row = {
        "session_id": "default",
        "sig": f"phantom_recovery_{mint[:12]}",
        "mint": mint,
        "symbol": symbol or "UNKNOWN",
        "label": "recovered",
        "wallet": "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA",
        "action": "BUY",
        "amount_sol": round(est_sol, 6),
        "entry_price": entry_price,
        "tokens_received": tok['amount'],
        "token_decimals": tok['decimals'],
        "status": "open",
        "opened_at": "2026-06-20T16:00:00+00:00",
        "slippage_pct": 3.0
    }
    
    row_json = json.dumps(trade_row).replace("'", '"')
    ins_r = run(f"curl -sf '{SB}/rest/v1/shreem_brzee_live_trades' {H} -H 'Prefer: return=representation' -X POST -d '{row_json}'")
    try:
        result = json.loads(ins_r)
        if isinstance(result, list) and result:
            print(f"  ✅ Inserted: {symbol} mint={mint[:12]} id={result[0].get('id','')[:8]}")
        else:
            print(f"  Result: {ins_r[:200]}")
    except: print(f"  Insert response: {ins_r[:200]}")

print("\n=== DONE ===")
client.close()
