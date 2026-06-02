
import json, urllib.request, urllib.error, os, sys

sk = os.environ["SK"]
base = "https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1"
batch_file = sys.argv[1]

with open(batch_file) as f:
    payload = json.load(f)

data = json.dumps(payload).encode()
req = urllib.request.Request(
    f"{base}/ayurveda_courses",
    data=data,
    headers={
        "apikey": sk,
        "Authorization": f"Bearer {sk}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
    },
    method="POST"
)
try:
    resp = urllib.request.urlopen(req)
    print(f"OK {resp.status} — {len(payload)} modules upserted")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ERROR {e.code}: {body}")
    sys.exit(1)
