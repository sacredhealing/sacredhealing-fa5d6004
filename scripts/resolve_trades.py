import urllib.request, json, os

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

req = urllib.request.Request(
    f'{BASE}/delta_arb_trades?select=status,pnl_usdc,size_usd,mode,created_at&order=created_at.desc&limit=10',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
with urllib.request.urlopen(req, timeout=15) as r:
    trades = json.loads(r.read())

print('Last 10 trades:')
for t in trades:
    print(f'  {t.get("created_at","")[:16]} | {t.get("mode","?"):5} | {t.get("status","?"):5} | ${float(t.get("size_usd") or 0):.2f} | {float(t.get("pnl_usdc") or 0):+.2f}')

live = [t for t in trades if t.get('mode')=='LIVE']
print(f'\nLIVE trades: {len(live)}')
if live:
    print('✅ BOT IS LIVE!')
else:
    print('Still PAPER mode')
