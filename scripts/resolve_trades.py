import urllib.request, json, os, datetime

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey': KEY, 'Authorization': f'Bearer {KEY}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

trades = get('/delta_arb_trades?select=id,asset,signal,delta,status,pnl_usdc,size_usd,entry_price,created_at&order=created_at.desc&limit=500')

won   = [t for t in trades if t.get('status')=='won']
lost  = [t for t in trades if t.get('status')=='lost']
open_ = [t for t in trades if t.get('status') not in ['won','lost']]
pnl   = sum(float(t.get('pnl_usdc') or 0) for t in trades)
bal   = 100 + pnl
wr    = (len(won)/(len(won)+len(lost))*100) if (len(won)+len(lost)) > 0 else 0

print(f'=== OVERNIGHT RESULTS ===')
print(f'Total trades:  {len(trades)}')
print(f'Won:           {len(won)}')
print(f'Lost:          {len(lost)}')
print(f'Open:          {len(open_)}')
print(f'Win rate:      {wr:.1f}%')
print(f'Total PnL:     +${pnl:.2f} USDC')
print(f'Balance:       ${bal:.2f}')
print()

# Last trade time
if trades:
    last = trades[0].get('created_at','')[:16]
    now  = datetime.datetime.now(datetime.timezone.utc)
    last_dt = datetime.datetime.fromisoformat(trades[0]['created_at'].replace('Z','+00:00'))
    ago = (now - last_dt).total_seconds() / 60
    print(f'Last trade:    {last} UTC ({ago:.0f} min ago)')

# Avg win/loss
if won:
    avg_win = sum(float(t.get('pnl_usdc') or 0) for t in won) / len(won)
    print(f'Avg win:       +${avg_win:.2f}')
if lost:
    avg_loss = sum(float(t.get('pnl_usdc') or 0) for t in lost) / len(lost)
    print(f'Avg loss:      ${avg_loss:.2f}')

print()
print('Last 5 trades:')
for t in trades[:5]:
    print(f'  {t.get("asset","?"):4} {t.get("signal","?"):5} {t.get("delta","?"):12} {t.get("status","?"):6} pnl={t.get("pnl_usdc","NULL")}')
