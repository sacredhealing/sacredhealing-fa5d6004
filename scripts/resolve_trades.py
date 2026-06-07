import urllib.request, json, os, sys

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

if not KEY:
    print('No service key found'); sys.exit(1)

def get(path):
    req = urllib.request.Request(f'{BASE}{path}',
        headers={'apikey':KEY,'Authorization':f'Bearer {KEY}'})
    with urllib.request.urlopen(req,timeout=10) as r:
        return json.loads(r.read())

def patch(path, data):
    req = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'apikey':KEY,'Authorization':f'Bearer {KEY}',
                 'Content-Type':'application/json','Prefer':'return=minimal'},
        method='PATCH')
    with urllib.request.urlopen(req,timeout=10): pass

THRESHOLD = 0.0015

# Get all open trades
trades = get('/delta_arb_trades?status=eq.open&select=id,delta,size_usd,entry_price&limit=50')
print(f'Found {len(trades)} open trades')

wins = losses = 0
for t in trades:
    try: dv = abs(float(t.get('delta','+0%').replace('%',''))/100)
    except: dv = 0.0

    sz = float(t.get('size_usd') or 10)
    ep = float(t.get('entry_price') or 0.58)
    sh = sz / max(ep, 0.01)
    win = dv >= THRESHOLD
    st  = 'won' if win else 'lost'
    pnl = round((sh * 1.0 - sz) if win else -sz, 4)

    try:
        patch(f'/delta_arb_trades?id=eq.{t["id"]}',
              {'status':st, 'pnl_usdc':pnl, 'net_pnl_usdc':pnl})
        print(f'  {t["id"][:8]} delta={t.get("delta")} -> {st} pnl={pnl}')
        if win: wins += 1
        else: losses += 1
    except Exception as e:
        print(f'  ERROR {t["id"][:8]}: {e}')

print(f'Done: {wins} wins, {losses} losses')

# Show final state
all_trades = get('/delta_arb_trades?select=asset,signal,delta,status,pnl_usdc&order=created_at.desc&limit=20')
print()
print('Final state:')
for t in all_trades:
    print(f'  {t["asset"]:4} {t["signal"]:4} {t["delta"]:12} -> {t["status"]:6} pnl={t.get("pnl_usdc","?")}')
