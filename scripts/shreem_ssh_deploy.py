#!/usr/bin/env python3
import os, paramiko, json, re

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=25)
    return out.read().decode().strip()

KEY = "6db37a31-beea-4c43-924d-87f4867fa5f0"

# 1. Update key in ecosystem config
print("=== UPDATE HELIUS KEY ON HETZNER ===")
result = run(f"""sed -i "s/HELIUS_API_KEY:.*/HELIUS_API_KEY: '{KEY}',/" /root/shreem-ecosystem.config.js 2>/dev/null && echo OK || echo MISSING""")
print(result)
print(run("grep 'HELIUS' /root/shreem-ecosystem.config.js 2>/dev/null | head -3"))

# 2. Verify webhook is live
print("\n=== VERIFY WEBHOOK ===")
r = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={KEY}"')
try:
    hooks = json.loads(r)
    print(f"Webhooks: {len(hooks)}")
    for h in hooks:
        print(f"  ID: {h.get('webhookID')}")
        print(f"  Type: {h.get('webhookType')}")
        print(f"  Wallets: {len(h.get('accountAddresses',[]))}")
        print(f"  URL: {h.get('webhookURL','')[:60]}")
except:
    print(f"Response: {r[:300]}")

# 3. Stop old shreem-brzee if still somehow running
print("\n=== STOP OLD BOT ===")
print(run("pm2 delete shreem-brzee 2>/dev/null || echo already gone"))
print(run("pm2 save --force 2>/dev/null"))

# 4. PM2 status
print("\n=== PM2 STATUS ===")
print(run("pm2 list --no-color 2>/dev/null | grep -v namespace | grep -v '──'"))

# 5. Wallet balance
BOT = "Fpnv12A17d3bVWjiaVqJNrvtv5L7enuuh4ZYNEwf5CZA"
print("\n=== BOT WALLET ===")
r2 = run(f"""curl -sf 'https://api.mainnet-beta.solana.com' --max-time 10 -X POST -H 'Content-Type: application/json' -d '{{"jsonrpc":"2.0","id":1,"method":"getBalance","params":["{BOT}"]}}'""")
try:
    sol = json.loads(r2).get('result',{}).get('value',0)/1e9
    print(f"SOL balance: {sol}")
except: print(r2[:100])

client.close()
print("\n=== DONE ===")
