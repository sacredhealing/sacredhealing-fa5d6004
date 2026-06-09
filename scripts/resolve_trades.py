import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

trades = get('/delta_arb_trades?select=status,pnl_usdc,size_usd,mode,created_at&order=created_at.desc&limit=10')

live_trades  = [t for t in trades if t.get('mode') == 'LIVE']
paper_trades = [t for t in trades if t.get('mode') == 'PAPER']

print(f'Last 10 trades:')
for t in trades:
    mode = t.get('mode','?')
    sz   = float(t.get('size_usd') or 0)
    p    = float(t.get('pnl_usdc') or 0)
    dt   = t.get('created_at','')[:16]
    print(f'  {dt} | {mode:5} | {t.get("status","?"):5} | size=${sz:.2f} | pnl={p:+.2f}')

print()
print(f'LIVE trades found: {len(live_trades)}')
print(f'PAPER trades found: {len(paper_trades)}')

if live_trades:
    print()
    print('✅ BOT IS LIVE — REAL MONEY TRADING')
    live_pnl = sum(float(t.get('pnl_usdc') or 0) for t in live_trades)
    print(f'Live PnL so far: {live_pnl:+.2f} USDC')
else:
    print()
    print('⏳ No LIVE trades yet — bot may still be restarting')
    print('Check again in 2 minutes')
