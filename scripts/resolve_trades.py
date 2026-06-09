import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

trades = get('/delta_arb_trades?select=status,pnl_usdc,size_usd,mode,created_at&order=created_at.desc&limit=10')

print('Last 10 trades:')
for t in trades:
    mode = t.get('mode','?')
    sz   = float(t.get('size_usd') or 0)
    p    = float(t.get('pnl_usdc') or 0)
    dt   = t.get('created_at','')[:16]
    print(f'  {dt} | {mode:5} | {t.get("status","?"):5} | size=${sz:.2f} | pnl={p:+.2f}')

live = [t for t in trades if t.get('mode')=='LIVE']
print()
if live:
    print(f'✅ BOT IS LIVE! {len(live)} real trades found')
    pnl = sum(float(t.get('pnl_usdc') or 0) for t in live)
    print(f'Live PnL: {pnl:+.4f} USDC')
else:
    print('⏳ No LIVE trades yet — bot still starting up')
