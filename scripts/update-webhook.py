import urllib.request, json

HELIUS_KEY = "6db37a31-beea-4c43-924d-87f4867fa5f0"
WEBHOOK_ID = "65fbcfbb-9c9f-46e3-bae8-b1f964dd9d0b"

# Only the top 5 whales
WALLETS = [
    "CyaE1VxvBrahnPWkqm5VsdCvyS2QmNht2UFrKJHga54o",  # Cented
    "5ZuV8eqkvzYFVEKbLvGBdexL2tFv7E5BCd2HZpjqbdg",   # Doji
    "BCrTEXmWutwPz8qv6w1S5gDbaLnSLpXKM5kSGVWyyfxu",  # Remusofmars
    "ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT",   # trunoest
    "G6fUXjMKPJzCY1rveAE6Qm7wy5U3vZgKDJmN1VPAdiZC",  # clukz
]

WEBHOOK_URL = "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/shreem-helius-webhook"

payload = {
    "webhookURL": WEBHOOK_URL,
    "transactionTypes": ["SWAP"],
    "accountAddresses": WALLETS,
    "webhookType": "enhanced",
    "txnStatus": "success"
}

data = json.dumps(payload).encode()
req = urllib.request.Request(
    f"https://api.helius.xyz/v0/webhooks/{WEBHOOK_ID}?api-key={HELIUS_KEY}",
    data=data,
    method="PUT",
    headers={"Content-Type": "application/json"}
)

try:
    resp = urllib.request.urlopen(req, timeout=15)
    result = json.loads(resp.read())
    print("SUCCESS")
    print("Webhook ID:", result.get("webhookID"))
    print("Accounts:", len(result.get("accountAddresses", [])))
    print("Wallets:", result.get("accountAddresses"))
except urllib.error.HTTPError as e:
    print("ERROR:", e.code, e.read().decode()[:300])
except Exception as e:
    print("ERROR:", e)
