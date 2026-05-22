#!/usr/bin/env python3
"""
Fetch Supabase JWT secret via Management API database query,
construct the service_role JWT, store as NEW_SERVICE_ROLE secret.
"""
import os, sys, json, base64, hmac, hashlib, time, struct
import requests
from nacl import encoding, public

SUPA_PAT = os.environ["SUPA_PAT"]
GH_PAT   = os.environ["GH_PAT"]
PROJECT  = "fjdzhrdpioxdeyyfogep"
REPO     = "sacredhealing/sacredhealing-fa5d6004"
DB_URL   = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"
HEADERS  = {"Authorization": f"Bearer {SUPA_PAT}", "Content-Type": "application/json"}

def run_sql(q):
    r = requests.post(DB_URL, headers=HEADERS, json={"query": q})
    print(f"  SQL HTTP {r.status_code}: {r.text[:200]}", flush=True)
    return r

# Strategy 1: try api-keys endpoint directly
print("=== Strategy 1: api-keys endpoint ===", flush=True)
r1 = requests.get(f"https://api.supabase.com/v1/projects/{PROJECT}/api-keys", headers=HEADERS)
print(f"HTTP {r1.status_code}: {r1.text[:300]}", flush=True)

service_role_key = None
if r1.status_code == 200:
    keys = r1.json()
    for k in keys:
        print(f"  Key: {k}", flush=True)
        if k.get("name") == "service_role":
            service_role_key = k.get("api_key") or k.get("apiKey") or k.get("key")

# Strategy 2: get JWT secret from DB and mint a service_role JWT
if not service_role_key:
    print("\n=== Strategy 2: extract JWT secret from DB ===", flush=True)
    queries = [
        "SELECT current_setting('app.settings.jwt_secret', true) AS jwt_secret;",
        "SELECT value FROM vault.decrypted_secrets WHERE name = 'jwt_secret' LIMIT 1;",
        "SELECT key_id, secret FROM pgsodium.valid_key WHERE name = 'jwt_secret' LIMIT 1;",
    ]
    jwt_secret = None
    for q in queries:
        r = run_sql(q)
        if r.status_code == 200:
            rows = r.json()
            if rows and isinstance(rows, list) and rows[0]:
                val = list(rows[0].values())[0]
                if val and len(str(val)) > 10:
                    jwt_secret = str(val)
                    print(f"  JWT secret found via SQL: {jwt_secret[:15]}...", flush=True)
                    break

    if jwt_secret:
        # Build service_role JWT (HS256)
        header  = base64.urlsafe_b64encode(json.dumps({"alg":"HS256","typ":"JWT"}).encode()).rstrip(b"=").decode()
        payload = base64.urlsafe_b64encode(json.dumps({
            "role": "service_role",
            "iss":  "supabase",
            "iat":  int(time.time()),
            "exp":  int(time.time()) + 3600*24*365*10  # 10 years
        }).encode()).rstrip(b"=").decode()
        
        sig_input = f"{header}.{payload}".encode()
        sig = hmac.new(jwt_secret.encode(), sig_input, hashlib.sha256).digest()
        sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
        service_role_key = f"{header}.{payload}.{sig_b64}"
        print(f"  Minted service_role JWT: {service_role_key[:40]}...", flush=True)

# Strategy 3: try config endpoint
if not service_role_key:
    print("\n=== Strategy 3: project config endpoint ===", flush=True)
    r3 = requests.get(f"https://api.supabase.com/v1/projects/{PROJECT}/config/auth", headers=HEADERS)
    print(f"HTTP {r3.status_code}: {r3.text[:400]}", flush=True)

if not service_role_key:
    print("\nERROR: Could not obtain service_role key via any strategy", flush=True)
    sys.exit(1)

# Store in GitHub secret
print(f"\n=== Storing in GitHub secret NEW_SERVICE_ROLE ===", flush=True)
pk = requests.get(
    f"https://api.github.com/repos/{REPO}/actions/secrets/public-key",
    headers={"Authorization": f"token {GH_PAT}"}
).json()

pub_key = public.PublicKey(pk["key"].encode(), encoding.Base64Encoder())
box = public.SealedBox(pub_key)
encrypted = base64.b64encode(box.encrypt(service_role_key.encode())).decode()

r = requests.put(
    f"https://api.github.com/repos/{REPO}/actions/secrets/NEW_SERVICE_ROLE",
    headers={"Authorization": f"token {GH_PAT}", "Content-Type": "application/json"},
    json={"encrypted_value": encrypted, "key_id": pk["key_id"]}
)
print(f"GitHub secret update: HTTP {r.status_code}", flush=True)
if r.status_code in (201, 204):
    print("SUCCESS - NEW_SERVICE_ROLE is set!", flush=True)
else:
    print(f"FAILED: {r.text}")
    sys.exit(1)
