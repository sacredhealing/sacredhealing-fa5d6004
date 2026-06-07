import urllib.request, json, os, datetime

SK   = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

# 1. Check last trade timestamp
req = urllib.request.Request(
    f'{BASE}/delta_arb_trades?select=created_at&order=created_at.desc&limit=1',
    headers={'apikey': SK, 'Authorization': f'Bearer {SK}'}
)
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read())
    if data:
        last = data[0]['created_at']
        print(f'Last trade: {last}')
        from datetime import datetime, timezone
        last_dt = datetime.fromisoformat(last.replace('Z','+00:00'))
        ago = (datetime.now(timezone.utc) - last_dt).total_seconds() / 60
        print(f'That was {ago:.1f} minutes ago')
    else:
        print('No trades found')

# 2. Check total count
req2 = urllib.request.Request(
    f'{BASE}/delta_arb_trades?select=id',
    headers={'apikey': SK, 'Authorization': f'Bearer {SK}', 'Prefer': 'count=exact'},
)
with urllib.request.urlopen(req2, timeout=10) as r:
    cr = r.headers.get('content-range','?')
    print(f'Total trades: {cr}')

# 3. Write a test trade to verify Supabase write works
print('Writing test trade...')
payload = json.dumps({
    'asset': 'TEST', 'signal': 'UP', 'delta': '+0.9999%',
    'size_usd': 0.01, 'status': 'won', 'pnl_usdc': 0.001, 'mode': 'PAPER'
}).encode()
req3 = urllib.request.Request(
    f'{BASE}/delta_arb_trades',
    data=payload,
    headers={
        'apikey': SK, 'Authorization': f'Bearer {SK}',
        'Content-Type': 'application/json', 'Prefer': 'return=minimal'
    },
    method='POST'
)
try:
    with urllib.request.urlopen(req3, timeout=10) as r:
        print(f'Test write: HTTP {r.status} — Supabase write works!')
except Exception as e:
    print(f'Test write FAILED: {e}')
    print('This means bot cannot write trades — SUPABASE_SERVICE_KEY missing or wrong')
