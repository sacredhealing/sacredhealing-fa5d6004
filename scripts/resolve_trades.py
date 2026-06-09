import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

# Delete ALL trades
req = urllib.request.Request(
    f'{BASE}/delta_arb_trades?id=neq.00000000-0000-0000-0000-000000000000',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'},
    method='DELETE'
)
with urllib.request.urlopen(req, timeout=15): pass

# Verify count
req2 = urllib.request.Request(
    f'{BASE}/delta_arb_trades?select=id&limit=1',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Prefer': 'count=exact'}
)
with urllib.request.urlopen(req2, timeout=10) as r:
    count = r.headers.get('content-range','?').split('/')[-1]

print(f'Trades in DB: {count}')
print('Done — bot will show $10 on next refresh')
