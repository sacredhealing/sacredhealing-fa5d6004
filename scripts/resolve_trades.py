import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def req(path, method='GET', data=None):
    r = urllib.request.Request(f'{BASE}{path}',
        data=data, method=method,
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
    with urllib.request.urlopen(r, timeout=10) as resp:
        try: return json.loads(resp.read())
        except: return {}

# Delete ALL trades - fresh start
print("Deleting all trades...")
req('/delta_arb_trades?id=neq.00000000-0000-0000-0000-000000000000', method='DELETE')
print("Done")

# Verify
count = req('/delta_arb_trades?select=id&limit=1')
print(f"Remaining: {len(count) if isinstance(count, list) else 0}")
print("Clean slate - balance resets to $100")
