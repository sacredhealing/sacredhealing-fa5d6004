import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def req(path, method='GET', data=None):
    headers = {
        'apikey': KEY, 'Authorization': f'Bearer {KEY}',
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    }
    r = urllib.request.Request(f'{BASE}{path}', data=data, headers=headers, method=method)
    with urllib.request.urlopen(r, timeout=10) as resp:
        try: return json.loads(resp.read())
        except: return {}

# Delete all old trades (fresh start)
print("Deleting all old trades...")
req('/delta_arb_trades?id=neq.00000000-0000-0000-0000-000000000000', method='DELETE')
print("Done — trades cleared")

# Verify
trades = req('/delta_arb_trades?select=id&limit=1')
print(f"Trades remaining: {len(trades) if isinstance(trades, list) else 0}")

# Fix RLS — ensure public read works
print("Checking RLS...")
