#!/usr/bin/env python3
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
H_AUTH = f'apikey: {sb_key}'
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"

print("=== SESSION ===")
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "{H_AUTH}" -H "Authorization: Bearer {sb_key}"')
try:
    s = json.loads(r)[0]
    print(f"mode={s.get('mode')} portfolio={s.get('portfolio')} wins={s.get('wins')} losses={s.get('losses')}")
except: print(r[:200])

print("\n=== ALL LIVE TRADES ===")
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc&limit=20" -H "{H_AUTH}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r2)
    print(f"Total: {len(trades)}")
    for t in trades:
        print(f"  [{t.get('status')}] {t.get('symbol','?')} | {t.get('mint','')[:14]} | {t.get('amount_sol')} SOL | tokens={t.get('tokens_received')} | decimals={t.get('token_decimals')} | tx={str(t.get('tx_sig',''))[:20]} | opened={str(t.get('opened_at',''))[:19]}")
except: print(r2[:300])

print("\n=== BOT WALLET ===")
r3 = run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"{BOT}\"]}}'")
try: print(f"SOL: {json.loads(r3).get('result',{}).get('value',0)/1e9}")
except: print(r3[:100])

r4 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"{BOT}\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}'""")
try:
    accts = json.loads(r4).get('result',{}).get('value',[])
    non_zero = [(a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})) for a in accts]
    non_zero = [i for i in non_zero if float(i.get('tokenAmount',{}).get('uiAmount') or 0) > 0]
    print(f"Tokens with balance: {len(non_zero)}")
    for i in non_zero:
        ta = i.get('tokenAmount',{})
        print(f"  {i.get('mint','')} | {ta.get('uiAmount')} tokens")
except: print(r4[:200])

print("\n=== RECENT SIGNALS (last 5) ===")
r5 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_signals?order=created_at.desc&limit=5" -H "{H_AUTH}" -H "Authorization: Bearer {sb_key}"')
try:
    for s in json.loads(r5):
        print(f"  {s.get('action')} | {s.get('label')} | {s.get('symbol','?')} | processed={s.get('live_processed')} | {str(s.get('created_at',''))[:19]}")
except: print(r5[:200])

# Write summary to /tmp/sqi_state.txt on Hetzner
run("cat /tmp/sqi_state.txt 2>/dev/null || true")

client.close()
print("\n=== DONE ===")
