import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

trades = get('/delta_arb_trades?select=id,status,pnl_usdc,size_usd,created_at&limit=500&order=created_at.desc')

won   = [t for t in trades if t.get('status')=='won']
lost  = [t for t in trades if t.get('status')=='lost']
open_ = [t for t in trades if t.get('status') not in ['won','lost']]
pnl   = sum(float(t.get('pnl_usdc') or 0) for t in trades)
bal   = 100 + pnl
wr    = (len(won)/(len(won)+len(lost))*100) if (len(won)+len(lost))>0 else 0

print(f'Trades:    {len(trades)} total ({len(won)} won / {len(lost)} lost / {len(open_)} open)')
print(f'Win rate:  {wr:.1f}%')
print(f'Total PnL: +${pnl:.2f} USDC')
print(f'Balance:   ${bal:.2f}')
if won:
    print(f'Avg win:   +${sum(float(t.get("pnl_usdc") or 0) for t in won)/len(won):.2f}')
if lost:
    print(f'Avg loss:  ${sum(float(t.get("pnl_usdc") or 0) for t in lost)/len(lost):.2f}')
if trades:
    last = trades[0].get('created_at','')
    last_dt = datetime.datetime.fromisoformat(last.replace('Z','+00:00'))
    ago = (datetime.datetime.now(datetime.timezone.utc) - last_dt).total_seconds()/60
    print(f'Last trade: {ago:.0f} min ago')
