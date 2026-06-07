import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def patch(path, data):
    req = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    with urllib.request.urlopen(req, timeout=10): pass

trades = get('/delta_arb_trades?select=id,status,pnl_usdc,size_usd,entry_price&limit=200&order=created_at.asc')
print(f'Total trades: {len(trades)}')

won  = [t for t in trades if t.get('status')=='won']
lost = [t for t in trades if t.get('status')=='lost']
null_pnl = [t for t in trades if t.get('pnl_usdc') is None]

print(f'Won: {len(won)} | Lost: {len(lost)} | Null pnl: {len(null_pnl)}')

fixed = 0
for t in null_pnl:
    sz = float(t.get('size_usd') or 10)
    ep = float(t.get('entry_price') or 0.54)
    if ep <= 0 or ep >= 1: ep = 0.54
    win = t.get('status') == 'won'
    # Correct formula: shares * $1 payout - position - fee
    shares = sz / ep
    pnl = round((shares * 1.0 - sz - sz*0.008) if win else -(sz + sz*0.008), 4)
    try:
        patch(f'/delta_arb_trades?id=eq.{t["id"]}',
              {'pnl_usdc': pnl, 'net_pnl_usdc': pnl})
        fixed += 1
    except Exception as e:
        print(f'Error: {e}')

print(f'Fixed pnl on {fixed} trades')

# Final summary
all_t = get('/delta_arb_trades?select=status,pnl_usdc&limit=500')
won2  = [t for t in all_t if t.get('status')=='won']
lost2 = [t for t in all_t if t.get('status')=='lost']
total_pnl = sum(float(t.get('pnl_usdc') or 0) for t in all_t)
print(f'Won={len(won2)} Lost={len(lost2)} Total PnL={total_pnl:+.2f}')
print(f'BALANCE: ${100+total_pnl:.2f}')
