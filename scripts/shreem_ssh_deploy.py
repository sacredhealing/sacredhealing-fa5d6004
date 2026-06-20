#!/usr/bin/env python3
import os, paramiko, json, re

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    o = out.read().decode().strip()
    print(o)
    return o

eco = run("cat /root/shreem-ecosystem.config.js")
m = re.search(r'SUPABASE_SERVICE_ROLE_KEY[^"\']*["\']([^"\']{20,})["\']', eco)
sb_key = m.group(1) if m else ""
SB = "https://ssygukfdbtehvtndandn.supabase.co"
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"

print("\n\n=== LIVE TRADES ===")
run(f'curl -sf "{SB}/rest/v1/shreem_brzee_live_trades?order=opened_at.desc&limit=20" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" | python3 -c "import sys,json; trades=json.load(sys.stdin); print(f\'Total: {{len(trades)}}\'); [print(f\'  [{{t.get(chr(115)+chr(116)+chr(97)+chr(116)+chr(117)+chr(115))}}] {{t.get(chr(115)+chr(121)+chr(109)+chr(98)+chr(111)+chr(108),chr(63))}} | {{t.get(chr(109)+chr(105)+chr(110)+chr(116),chr(32))[:14]}} | {{t.get(chr(97)+chr(109)+chr(111)+chr(117)+chr(110)+chr(116)+chr(95)+chr(115)+chr(111)+chr(108))}} SOL | tx={{str(t.get(chr(116)+chr(120)+chr(95)+chr(115)+chr(105)+chr(103),chr(32)))[:20]}} | {{str(t.get(chr(111)+chr(112)+chr(101)+chr(110)+chr(101)+chr(100)+chr(95)+chr(97)+chr(116),chr(32)))[:19]}}\') for t in trades]"')

print("\n=== SESSION ===")
run(f'curl -sf "{SB}/rest/v1/shreem_brzee_session?id=eq.default" -H "apikey: {sb_key}" -H "Authorization: Bearer {sb_key}" | python3 -c "import sys,json; s=json.load(sys.stdin); print(s[0] if s else s)"')

print("\n=== BOT SOL BALANCE ===")
run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBalance\",\"params\":[\"{BOT}\"]}}' | python3 -c \"import sys,json; print('SOL:', json.load(sys.stdin).get('result',{{}}).get('value',0)/1e9)\"")

print("\n=== BOT TOKENS ===")
run(f"curl -sf 'https://api.mainnet-beta.solana.com' --max-time 15 -X POST -H 'Content-Type: application/json' -d '{{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTokenAccountsByOwner\",\"params\":[\"{BOT}\",{{\"programId\":\"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA\"}},{{\"encoding\":\"jsonParsed\"}}]}}' | python3 -c \"import sys,json; accts=json.load(sys.stdin).get('result',{{}}).get('value',[]); [print(f'  {{i.get(chr(109)+chr(105)+chr(110)+chr(116))}} amount={{i.get(chr(116)+chr(111)+chr(107)+chr(101)+chr(110)+chr(65)+chr(109)+chr(111)+chr(117)+chr(110)+chr(116),{{}}).get(chr(117)+chr(105)+chr(65)+chr(109)+chr(111)+chr(117)+chr(110)+chr(116),0)}}') for a in accts for i in [a.get('account',{{}}).get('data',{{}}).get('parsed',{{}}).get('info',{{}})] if float(i.get('tokenAmount',{{}}).get('uiAmount') or 0)>0]\"")

client.close()
