#!/bin/bash
set -e

echo "=== Fetching Supabase API keys ==="
curl -s -H "Authorization: Bearer ${SUPA_PAT}" \
  "https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/api-keys" \
  > /tmp/keys.json

echo "Response (${#RESPONSE} bytes):"
cat /tmp/keys.json | head -c 500
echo ""

SERVICE_KEY=$(cat /tmp/keys.json | python3 -c "
import json,sys
data=json.load(sys.stdin)
if isinstance(data,list):
    for k in data:
        if k.get('name')=='service_role':
            print(k.get('api_key') or k.get('apiKey',''))
            break
else:
    print('NOT_A_LIST:', json.dumps(data)[:200], file=sys.stderr)
" 2>/tmp/parse_err.txt)

if [ -z "$SERVICE_KEY" ]; then
  echo "Parse error: $(cat /tmp/parse_err.txt)"
  echo "Full response:"
  cat /tmp/keys.json
  exit 1
fi

echo "Key found: ${SERVICE_KEY:0:30}..."

echo "=== Getting GitHub public key ==="
curl -s -H "Authorization: token ${GH_PAT}" \
  "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/actions/secrets/public-key" \
  > /tmp/pubkey.json

pip install PyNaCl -q 2>/dev/null

python3 - <<PYEOF
import json, base64, sys
from nacl import encoding, public

with open('/tmp/pubkey.json') as f:
    pk_data = json.load(f)

import os
service_key = os.environ['SERVICE_KEY']
pk = public.PublicKey(pk_data['key'].encode(), encoding.Base64Encoder())
box = public.SealedBox(pk)
encrypted = base64.b64encode(box.encrypt(service_key.encode())).decode()

import urllib.request, json as json2
payload = json2.dumps({"encrypted_value": encrypted, "key_id": pk_data["key_id"]}).encode()
req = urllib.request.Request(
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/actions/secrets/NEW_SERVICE_ROLE",
    data=payload,
    method="PUT",
    headers={
        "Authorization": f"token {os.environ['GH_PAT']}",
        "Content-Type": "application/json"
    }
)
try:
    resp = urllib.request.urlopen(req)
    print(f"SUCCESS: HTTP {resp.status}")
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)
PYEOF
