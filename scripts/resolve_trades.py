import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

req = urllib.request.Request(
    f'{BASE}/delta_arb_trades?select=mode,status,pnl_usdc,size_usd,asset,signal,created_at&order=created_at.desc&limit=10',
    headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
with urllib.request.urlopen(req, timeout=15) as r:
    trades = json.loads(r.read())

now = datetime.datetime.now(datetime.timezone.utc)
live  = [t for t in trades if t.get('mode') == 'LIVE']
paper = [t for t in trades if t.get('mode') == 'PAPER']

if live:
    print('🔴 LIVE TRADES FOUND:')
    for t in live:
        dt = datetime.datetime.fromisoformat(t['created_at'].replace('Z','+00:00'))
        ago = round((now-dt).total_seconds()/60, 1)
        p = float(t.get('pnl_usdc') or 0)
        print(f'  {ago}min ago | {t.get("asset","?")} {t.get("signal","?")} | {t.get("status","?")} | ${float(t.get("size_usd") or 0):.2f} | {p:+.4f}')
    total = sum(float(t.get('pnl_usdc') or 0) for t in live)
    print(f'Live PnL: {total:+.4f} USDC | Balance: ${10+total:.4f}')
else:
    last = trades[0] if trades else {}
    dt = datetime.datetime.fromisoformat(last.get('created_at','2026-01-01T00:00:00Z').replace('Z','+00:00'))
    ago = round((now-dt).total_seconds()/60, 1)
    print(f'No LIVE trades yet')
    print(f'Last trade: {ago:.0f} min ago (mode={last.get("mode","?")})')
    print(f'Bot IS live — waiting for 0.12% delta signal on BTC/ETH/SOL')
