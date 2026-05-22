#!/usr/bin/env python3
import sys, json, base64, os, requests
from nacl import encoding, public

supa_pat = os.environ["SUPA_PAT"]
gh_pat   = os.environ["GH_PAT"]
project  = "fjdzhrdpioxdeyyfogep"
repo     = "sacredhealing/sacredhealing-fa5d6004"

# Get API keys
resp = requests.get(
    f"https://api.supabase.com/v1/projects/{project}/api-keys",
    headers={"Authorization": f"Bearer {supa_pat}"}
)
print(f"[Supabase] HTTP {resp.status_code}", flush=True)
if resp.status_code != 200:
    print(f"[Supabase] Error: {resp.text[:300]}")
    sys.exit(1)

keys = resp.json()
print(f"[Supabase] Keys returned: {[k.get('name') for k in keys]}", flush=True)

service_role_key = None
for k in keys:
    if k.get("name") == "service_role":
        service_role_key = k.get("api_key") or k.get("apiKey") or k.get("key")

if not service_role_key:
    # Try alternate structure
    print(f"[Supabase] Raw response: {json.dumps(keys)[:500]}")
    sys.exit(1)

print(f"[Supabase] service_role found: {service_role_key[:25]}...", flush=True)

# Get GitHub public key
pk = requests.get(
    f"https://api.github.com/repos/{repo}/actions/secrets/public-key",
    headers={"Authorization": f"token {gh_pat}"}
).json()

# Encrypt
pub_key = public.PublicKey(pk["key"].encode(), encoding.Base64Encoder())
box = public.SealedBox(pub_key)
encrypted = base64.b64encode(box.encrypt(service_role_key.encode())).decode()

# Store
r = requests.put(
    f"https://api.github.com/repos/{repo}/actions/secrets/NEW_SERVICE_ROLE",
    headers={"Authorization": f"token {gh_pat}", "Content-Type": "application/json"},
    json={"encrypted_value": encrypted, "key_id": pk["key_id"]}
)
print(f"[GitHub] NEW_SERVICE_ROLE update: HTTP {r.status_code}", flush=True)
if r.status_code in (201, 204):
    print("SUCCESS", flush=True)
else:
    print(f"FAILED: {r.text}")
    sys.exit(1)
