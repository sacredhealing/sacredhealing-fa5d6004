import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def patch(path, data):
    req = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    with urllib.request.urlopen(req, timeout=10): pass

# Count NULL vs non-NULL pnl
all_trades = get('/delta_arb_trades?select=id,status,pnl_usdc,size_usd,entry_price&limit=10000')
null_pnl   = [t for t in all_trades if t.get('pnl_usdc') is None]
with_pnl   = [t for t in all_trades if t.get('pnl_usdc') is not None]

pnl_sum    = sum(float(t['pnl_usdc']) for t in with_pnl)
print(f'Total trades: {len(all_trades)}')
print(f'With pnl:     {len(with_pnl)} — sum=${pnl_sum:.2f}')
print(f'NULL pnl:     {len(null_pnl)} — these show as $0 on page')

# Fix all NULL pnl trades
fixed = 0
for t in null_pnl:
    sz = float(t.get('size_usd') or 10)
    ep = float(t.get('entry_price') or 0.54)
    if ep <= 0 or ep >= 1: ep = 0.54
    win = t.get('status') == 'won'
    shares = sz / ep
    fee = sz * 0.008
    pnl = round((shares * 1.0 - sz - fee) if win else -(sz + fee), 4)
    try:
        patch(f'/delta_arb_trades?id=eq.{t["id"]}',
              {'pnl_usdc': pnl, 'net_pnl_usdc': pnl})
        fixed += 1
    except Exception as e:
        print(f'Error fixing {t["id"]}: {e}')

print(f'Fixed: {fixed} NULL pnl trades')

# Final count
all_t2 = get('/delta_arb_trades?select=status,pnl_usdc&limit=10000')
won2   = [t for t in all_t2 if t.get('status')=='won']
lost2  = [t for t in all_t2 if t.get('status')=='lost']
total_pnl = sum(float(t.get('pnl_usdc') or 0) for t in all_t2)
print(f'Won={len(won2)} Lost={len(lost2)} Total PnL=${total_pnl:.2f} Balance=${100+total_pnl:.2f}')
