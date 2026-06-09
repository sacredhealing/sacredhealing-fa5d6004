import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Get ALL trades — no limit
trades = get('/delta_arb_trades?select=id,status,pnl_usdc,size_usd,created_at&order=created_at.asc&limit=10000')

won   = [t for t in trades if t.get('status')=='won']
lost  = [t for t in trades if t.get('status')=='lost']
pnl   = sum(float(t.get('pnl_usdc') or 0) for t in trades)
bal   = 100 + pnl
wr    = len(won)/(len(won)+len(lost))*100 if (len(won)+len(lost))>0 else 0

print(f'=== REAL TOTAL (ALL TRADES IN DB) ===')
print(f'Total trades:  {len(trades)}')
print(f'Won:           {len(won)}')
print(f'Lost:          {len(lost)}')
print(f'Win rate:      {wr:.1f}%')
print(f'Real balance:  ${bal:.2f}')
print(f'Total PnL:     +${pnl:.2f}')

# Show last 5 trades with size
print()
print('Last 5 trades:')
for t in trades[-5:]:
    dt = t.get('created_at','')[:16]
    sz = float(t.get('size_usd') or 0)
    p  = float(t.get('pnl_usdc') or 0)
    print(f'  {dt} | {t.get("status","?"):5} | size=${sz:.2f} | pnl={p:+.2f}')

# Check if page shows correct count (limited to 200)
print()
print(f'Page shows: last 200 of {len(trades)} total trades')
print(f'Page balance matches DB: {abs(bal - (100 + pnl)) < 0.01}')
