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
wr   = len(won)/(len(won)+len(lost))*100 if (len(won)+len(lost))>0 else 0

# Avg win / avg loss
avg_win  = sum(float(t.get('pnl_usdc') or 0) for t in won)  / len(won)  if won  else 0
avg_loss = sum(float(t.get('pnl_usdc') or 0) for t in lost) / len(lost) if lost else 0

# Trades per day
if trades:
    first = datetime.datetime.fromisoformat(trades[0]['created_at'].replace('Z','+00:00'))
    last  = datetime.datetime.fromisoformat(trades[-1]['created_at'].replace('Z','+00:00'))
    hours = (last - first).total_seconds() / 3600
    tpd   = len(trades) / (hours / 24) if hours > 0 else 0
else:
    tpd = 0

print(f'=== 48H REAL PERFORMANCE ===')
print(f'Total trades:  {len(trades)}')
print(f'Won:           {len(won)}')
print(f'Lost:          {len(lost)}')
print(f'Win rate:      {wr:.1f}%')
print(f'Avg win:       +${avg_win:.2f}')
print(f'Avg loss:       ${avg_loss:.2f}')
print(f'Trades/day:    {tpd:.0f}')
print(f'Hours tracked: {hours:.1f}h')
print()

# Calculate real daily return % using actual trade data
# Simulate compounding from $100
balance = 100.0
for t in trades:
    p = float(t.get('pnl_usdc') or 0)
    # Scale to percentage of position
    sz = float(t.get('size_usd') or 0)
    if sz > 0:
        pct = p / sz  # win/loss as % of position
        pos = balance * 0.15  # 15% position
        balance += pos * pct
balance = max(balance, 0)
actual_growth_pct = (balance - 100) / 100 * 100
actual_daily_pct  = actual_growth_pct / (hours / 24) if hours > 0 else 0

print(f'Simulated $100 growth over {hours:.0f}h: ${balance:.2f}')
print(f'Total growth: {actual_growth_pct:.1f}%')
print(f'Daily growth rate: {actual_daily_pct:.1f}%/day')
