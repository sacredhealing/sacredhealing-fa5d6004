#!/bin/bash
set -e
pip install PyNaCl -q 2>/dev/null

python3 - <<PYEOF
import json, base64, os, urllib.request
from nacl import encoding, public

GH_PAT = os.environ['GH_PAT']
REPO = "sacredhealing/sacredhealing-fa5d6004"

def store_secret(name, value):
    # Get public key
    req = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/actions/secrets/public-key",
        headers={"Authorization": f"token {GH_PAT}"}
    )
    pk_data = json.loads(urllib.request.urlopen(req).read())
    
    pk = public.PublicKey(pk_data['key'].encode(), encoding.Base64Encoder())
    box = public.SealedBox(pk)
    encrypted = base64.b64encode(box.encrypt(value.encode())).decode()
    
    payload = json.dumps({"encrypted_value": encrypted, "key_id": pk_data["key_id"]}).encode()
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/actions/secrets/{name}",
        data=payload, method="PUT",
        headers={"Authorization": f"token {GH_PAT}", "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req2)
        print(f"  {name}: HTTP {resp.status}")
    except Exception as e:
        print(f"  {name}: FAILED {e}")

print("Storing secrets...")
store_secret("NEW_SERVICE_ROLE", os.environ["SERVICE_ROLE"])
store_secret("RAILWAY_TOKEN", os.environ["RAILWAY_TOKEN"])
print("Done.")
PYEOF
