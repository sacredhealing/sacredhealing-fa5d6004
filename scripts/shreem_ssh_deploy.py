#!/usr/bin/env python3
"""Read bot wallet token accounts and DB state, write to _shreem_state.txt"""
import os, paramiko, json, re

HP = os.environ["HP"]
GH = os.environ["GH"]

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
BOT_WALLET = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"

lines = ["=== SHREEM STATE REPORT ==="]

# Session
r = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    sess = json.loads(r)
    s = sess[0] if sess else {}
    lines.append(f"\nSESSION: mode={s.get('mode')} portfolio={s.get('portfolio')} start={s.get('start_balance')} started={str(s.get('started_at',''))[:19]} stopped={s.get('stopped_at')} wins={s.get('wins')} losses={s.get('losses')}")
except: lines.append(f"SESSION ERROR: {r[:200]}")

# Live trades
r2 = run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}"')
try:
    trades = json.loads(r2)
    lines.append(f"\nLIVE TRADES ({len(trades)} total):")
    for t in trades:
        lines.append(f"  [{t.get('status')}] {t.get('symbol')} | {t.get('mint','')[:16]} | {t.get('amount_sol')} SOL | tokens={t.get('tokens_received')} | opened={str(t.get('opened_at',''))[:19]} | tx={str(t.get('tx_sig',''))[:20]}")
except: lines.append(f"TRADES ERROR: {r2[:200]}")

# Bot wallet token accounts (on-chain)
r3 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getTokenAccountsByOwner","params":["{BOT_WALLET}",{{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}},{{"encoding":"jsonParsed"}}]}}'""")
try:
    rpc = json.loads(r3)
    accounts = rpc.get('result',{}).get('value',[])
    lines.append(f"\nBOT WALLET TOKENS ({len(accounts)} accounts):")
    for a in accounts:
        info = a.get('account',{}).get('data',{}).get('parsed',{}).get('info',{})
        ta = info.get('tokenAmount',{})
        lines.append(f"  mint={info.get('mint','')} amount={ta.get('uiAmount',0)} decimals={ta.get('decimals',6)} raw={ta.get('amount','0')}")
except: lines.append(f"RPC ERROR: {r3[:200]}")

# SOL balance
r4 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["{BOT_WALLET}"]}}'""")
try:
    sol = json.loads(r4).get('result',{}).get('value',0) / 1e9
    lines.append(f"\nBOT WALLET SOL: {sol}")
except: lines.append(f"SOL ERROR: {r4[:100]}")

# PM2 worker info
lines.append(f"\nPM2:")
lines.append(run("pm2 list --no-color 2>/dev/null | grep -v 'namespace\\|Applying\\|──'"))
lines.append("\nRUNNING SCRIPT:")
lines.append(run("pm2 describe shreem-brzee --no-color 2>/dev/null | grep 'script path'"))

output = "\n".join(lines)
print(output)

# Write to _shreem_state.txt in repo
import base64, urllib.request
encoded = base64.b64encode(output.encode()).decode()

# Get current SHA of _shreem_state.txt if exists
try:
    req = urllib.request.Request(
        f"https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/_shreem_state.txt",
        headers={"Authorization": f"token {GH}", "Accept": "application/vnd.github.v3+json"}
    )
    with urllib.request.urlopen(req) as r:
        old_sha = json.loads(r.read())['sha']
    payload = {"message": "data: shreem state", "content": encoded, "sha": old_sha, "branch": "main"}
except:
    payload = {"message": "data: shreem state", "content": encoded, "branch": "main"}

put_req = urllib.request.Request(
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/_shreem_state.txt",
    data=json.dumps(payload).encode(), method="PUT",
    headers={"Authorization": f"token {GH}", "Accept": "application/vnd.github.v3+json", "Content-Type": "application/json"}
)
try:
    with urllib.request.urlopen(put_req) as r:
        print("\n✅ Saved to _shreem_state.txt")
except Exception as e:
    print(f"\n❌ Save failed: {e}")

client.close()
