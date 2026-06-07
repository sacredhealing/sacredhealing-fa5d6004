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

# Fix pnl on ALL won/lost trades that have pnl=NULL
trades = get('/delta_arb_trades?pnl_usdc=is.null&select=id,delta,size_usd,entry_price,status&limit=100')
print(f'Found {len(trades)} trades with pnl=NULL')

for t in trades:
    try: dv = abs(float(t.get('delta','+0%').replace('%',''))/100)
    except: dv = 0.0

    sz  = float(t.get('size_usd') or 10)
    ep  = float(t.get('entry_price') or 0.58)
    sh  = sz / max(ep, 0.01)
    win = t.get('status') == 'won'
    pnl = round((sh * 1.0 - sz) if win else -sz, 4)

    try:
        patch(f'/delta_arb_trades?id=eq.{t["id"]}',
              {'pnl_usdc': pnl, 'net_pnl_usdc': pnl})
        print(f'  {t["id"][:8]} {t.get("asset","?")} {t.get("status")} -> pnl={pnl}')
    except Exception as e:
        print(f'  ERROR {t["id"][:8]}: {e}')

# Show summary
all_t = get('/delta_arb_trades?select=asset,signal,delta,size_usd,entry_price,status,pnl_usdc&order=created_at.desc&limit=20')
total_pnl = sum(float(t.get('pnl_usdc') or 0) for t in all_t)
wins = sum(1 for t in all_t if t.get('status') == 'won')
losses = sum(1 for t in all_t if t.get('status') == 'lost')
print(f'\n=== SUMMARY ===')
print(f'Trades: {len(all_t)} | Wins: {wins} | Losses: {losses}')
print(f'Total PnL: ${total_pnl:.2f}')
print()
for t in all_t:
    print(f'  {t.get("asset","?"):4} {t.get("signal","?"):4} {t.get("delta","?"):12} {t.get("status","?"):6} pnl=${t.get("pnl_usdc","?")}')
