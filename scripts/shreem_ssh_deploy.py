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
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^\"\']*([\"\'])([^\"\']{{20,}})\1', eco)
if not m:
    m = re.search(r'SUPABASE_SERVICE_ROLE_KEY.{{0,5}}["\'](\S{{20,}})["\'\s]', eco)
sb_key = m.group(2) if m and m.lastindex >= 2 else (m.group(1) if m else "")

# Try simpler extraction
if not sb_key or len(sb_key) < 20:
    for line in eco.split("\n"):
        if "SUPABASE_SERVICE_ROLE_KEY" in line:
            parts = line.split(":")
            if len(parts) > 1:
                val = parts[-1].strip().strip('"').strip("'").strip(",").strip()
                if len(val) > 20:
                    sb_key = val
                    break

print("SB key found:", bool(sb_key), "len:", len(sb_key))
SB = "https://ssygukfdbtehvtndandn.supabase.co"
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
now = datetime.now(timezone.utc).isoformat()

print("\n=== 1. STOP ALL PM2 ===")
print(run("pm2 stop all 2>/dev/null && echo STOPPED"))

print("\n=== 2. STOP SESSION IN DB ===")
stop_cmd = f'curl -sf -X PATCH "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" -H "Content-Type: application/json" -H "Prefer: return=representation" -d \'{{"stopped_at": "{now}", "mode": "paper", "updated_at": "{now}"}}\'  '
r = run(stop_cmd)
print("Stop result:", r[:200])

print("\n=== 3. WALLET SOL ===")
r2 = run(f"curl -sf https://api.mainnet-beta.solana.com --max-time 10 -X POST -H Content-Type:application/json -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"" + BOT + "\"]}}'")
try: print("SOL:", json.loads(r2).get("result",{}).get("value",0)/1e9)
except: print(r2[:100])

print("\n=== 4. ALL LIVE TRADES ===")
r3 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.asc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r3)
    total = sum(float(t.get("amount_sol") or 0) for t in trades)
    print(f"Trades: {len(trades)} | Total SOL: {total}")
    for t in trades:
        print(f"  [{t.get('status')}] {t.get('symbol','?')} | {t.get('amount_sol')} SOL | {t.get('mint','')[:14]} | {str(t.get('opened_at',''))[:19]}")
except: print(r3[:400])

print("\n=== 5. WALLET TOKENS ===")
r4 = run(f"curl -sf https://api.mainnet-beta.solana.com --max-time 15 -X POST -H Content-Type:application/json -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"" + BOT + "\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}'")
try:
    accts = json.loads(r4).get("result",{}).get("value",[])
    found = 0
    for a in accts:
        info = a.get("account",{}).get("data",{}).get("parsed",{}).get("info",{})
        ta = info.get("tokenAmount",{})
        amt = float(ta.get("uiAmount") or 0)
        if amt > 0:
            found += 1
            print(f"  {info.get('mint','')} | {amt} tokens | raw={ta.get('amount','0')} dec={ta.get('decimals',6)}")
    if not found: print("  NO TOKENS HELD")
except: print(r4[:200])

print("\n=== 6. RESTART CLAWBOT ONLY ===")
print(run("pm2 start clawbot 2>/dev/null && pm2 list --no-color 2>/dev/null | grep -E 'clawbot|shreem' | grep -v namespace"))

client.close()
print("\n=== DONE ===")
