import urllib.request, json, os, sys

KEY  = os.environ.get('SK') or os.environ.get('SK2','')
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

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

# Fix ALL trades that have pnl=NULL regardless of status
trades = get('/delta_arb_trades?pnl_usdc=is.null&select=id,delta,size_usd,entry_price,status&limit=200')
print(f'Found {len(trades)} trades with pnl=NULL')

for t in trades:
    try: dv = abs(float(t.get('delta','+0%').replace('%',''))/100)
    except: dv = 0.0
    sz  = float(t.get('size_usd') or 10)
    ep  = float(t.get('entry_price') or 0.62)
    sh  = sz / max(ep, 0.01)
    win = t.get('status') == 'won'
    pnl = round((sh * 1.0 - sz) if win else -sz, 4)
    try:
        patch(f'/delta_arb_trades?id=eq.{t["id"]}',
              {'pnl_usdc': pnl, 'net_pnl_usdc': pnl})
        print(f'  {t["id"][:8]} {t.get("asset","?")} {t.get("status","?")} -> pnl={pnl}')
    except Exception as e:
        print(f'  ERROR {t["id"][:8]}: {e}')

# Final summary
all_t = get('/delta_arb_trades?select=status,pnl_usdc&limit=500')
total = len(all_t)
won   = [t for t in all_t if t.get('status')=='won']
lost  = [t for t in all_t if t.get('status')=='lost']
open_ = [t for t in all_t if t.get('status') not in ['won','lost']]
total_pnl = sum(float(t.get('pnl_usdc') or 0) for t in all_t)
print(f'\n=== SUMMARY ===')
print(f'Total: {total} | Won: {len(won)} | Lost: {len(lost)} | Open: {len(open_)}')
print(f'Total PnL: +${total_pnl:.2f} USDC')
print(f'Balance: ${100 + total_pnl:.2f}')
