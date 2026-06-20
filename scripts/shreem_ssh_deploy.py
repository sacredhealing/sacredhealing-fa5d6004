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
WEBHOOK_URL = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook"

WALLETS = json.dumps([
    "Fp1npp7sCi5h26oTrPg23dGRXLnZSL3wcsoyVMquVMaB",
    "Av3xWHJ5EsoLZag6pr7LKbrGgLRTaykXomDD5kBhL9YQ",
    "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",
    "DNfuF1L62WWyW3pNakVkyGGFzVVhj4Yr52jSmdTyeBHm",
    "HdxkiXqeN6qpK2YbG51W23QSWj3Yygc1eEk2zwmKJExp",
    "AgmLJBMDCqWynYnQiPCuj9ewsNNsBJXyzoUhD9LJzN51",
    "EqgZsS7GhtW9swJt1C4iYy5GVZgvsMVQK6nvBdPhRBmS",
    "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",
    "Gygj9QQby4j2jryqyqBHvLP7ctv2SaANgh4sCb69BUpA",
    "JDd3hy3gQn2V982mi1zqhNqUw1GfV2UL6g76STojCJPN",
    "5B52w1ZW9tuwUduueP5J7HXz5AcGfruGoX6YoAudvyxG",
    "5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg",
    "Hw5UKBU5k3YudnGwaykj5E8cYUidNMPuEewRRar5Xoc7",
    "215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP",
    "BTf4A2exGK9BCVDNzy65b9dUzXgMqB4weVkvTMFQsadd",
    "4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9",
    "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT",
    "G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC",
    "BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB",
])

# Check existing
print("=== EXISTING WEBHOOKS ===")
r = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={KEY}"')
try:
    hooks = json.loads(r)
    print(f"Found: {len(hooks)}")
    for h in hooks:
        print(f"  {h.get('webhookID')} | {h.get('webhookType')} | {len(h.get('accountAddresses',[]))} wallets")
except: print(f"Response: {r[:200]}")

# Write payload to file and curl it
payload = json.dumps({
    "webhookURL": WEBHOOK_URL,
    "transactionTypes": ["SWAP"],
    "accountAddresses": json.loads(WALLETS),
    "webhookType": "enhanced",
    "txnStatus": "success"
})
run(f"echo '{payload}' > /tmp/wh_payload.json")

print("\n=== REGISTERING WEBHOOK ===")
r2 = run(f'curl -sf -X POST "https://api.helius.xyz/v0/webhooks?api-key={KEY}" -H "Content-Type: application/json" -d @/tmp/wh_payload.json')
try:
    result = json.loads(r2)
    if result.get("webhookID"):
        print(f"✅ Created: {result['webhookID']}")
        print(f"   Wallets: {len(result.get('accountAddresses',[]))}")
        print(f"   Type: {result.get('webhookType')}")
    else:
        print(f"❌ {r2[:300]}")
except: print(f"Response: {r2[:300]}")

# Update Hetzner ecosystem config with new key
print("\n=== UPDATE HELIUS KEY ON HETZNER ===")
print(run("grep -n 'HELIUS' /root/shreem-ecosystem.config.js 2>/dev/null | head -5 || echo 'No ecosystem config'"))
run(f"""sed -i "s/HELIUS_API_KEY:.*/HELIUS_API_KEY: '{KEY}',/" /root/shreem-ecosystem.config.js 2>/dev/null""")
print(run("grep 'HELIUS' /root/shreem-ecosystem.config.js 2>/dev/null | head -3 || echo 'Done'"))

client.close()
print("\n=== DONE ===")
