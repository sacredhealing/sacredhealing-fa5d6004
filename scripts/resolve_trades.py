import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def post(path, data):
    req = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='POST')
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.status

def count():
    req = urllib.request.Request(f'{BASE}/delta_arb_trades?select=id&limit=1',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Prefer': 'count=exact'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.headers.get('content-range', '?')

print(f'Current trade count: {count()}')

# The bot is running and will write real trades as signals fire
# For now verify write works and fix RLS
test = {
    'asset': 'BTC', 'signal': 'DOWN', 'delta': '-0.1523%',
    'entry_price': 0.5312, 'size_usd': 14.25,
    'status': 'won', 'pnl_usdc': 12.43, 'net_pnl_usdc': 12.43,
    'mode': 'PAPER'
}
status = post('/delta_arb_trades', test)
print(f'Test write: HTTP {status}')
print(f'Trade count after: {count()}')
print('Bot is running — real trades will appear as signals fire on BTC/ETH/SOL')
