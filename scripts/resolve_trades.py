import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

trades = get('/delta_arb_trades?select=status,pnl_usdc,size_usd,created_at&order=created_at.asc&limit=500')

won  = [t for t in trades if t.get('status')=='won']
lost = [t for t in trades if t.get('status')=='lost']
pnl  = sum(float(t.get('pnl_usdc') or 0) for t in trades)
bal  = 10 + pnl
wr   = len(won)/(len(won)+len(lost))*100 if (len(won)+len(lost))>0 else 0

if trades:
    first = datetime.datetime.fromisoformat(trades[0]['created_at'].replace('Z','+00:00'))
    last  = datetime.datetime.fromisoformat(trades[-1]['created_at'].replace('Z','+00:00'))
    hours = (last - first).total_seconds() / 3600
else:
    hours = 0

avg_win  = sum(float(t.get('pnl_usdc') or 0) for t in won)  / len(won)  if won  else 0
avg_loss = sum(float(t.get('pnl_usdc') or 0) for t in lost) / len(lost) if lost else 0

print(f'=== LIVE SIM RESULTS (€10 start) ===')
print(f'Total trades: {len(trades)}')
print(f'Won:          {len(won)}')
print(f'Lost:         {len(lost)}')
print(f'Win rate:     {wr:.1f}%')
print(f'Balance:      ${bal:.2f}')
print(f'Total PnL:    +${pnl:.2f}')
print(f'Running for:  {hours:.1f} hours')
print(f'Avg win:      +${avg_win:.2f}')
print(f'Avg loss:     ${avg_loss:.2f}')
if hours > 0:
    print(f'Trades/hour:  {len(trades)/hours:.1f}')
    print(f'Return/hour:  {(pnl/hours):.2f} USDC/hr')
print()
print('Last 5 trades:')
for t in trades[-5:]:
    sz = float(t.get('size_usd') or 0)
    p  = float(t.get('pnl_usdc') or 0)
    print(f'  {t["status"]:5} size=${sz:.2f} pnl={p:+.2f}')
