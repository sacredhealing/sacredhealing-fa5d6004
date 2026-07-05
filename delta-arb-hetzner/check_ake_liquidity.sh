#!/bin/bash
echo "=== Does AKEUSDT have a SPOT market? ==="
curl -s "https://api.binance.com/api/v3/exchangeInfo?symbol=AKEUSDT" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
    if d.get('symbols'):
        s = d['symbols'][0]
        print('SPOT EXISTS:', s['symbol'], 'status:', s['status'])
    else:
        print('NO SPOT MARKET FOUND')
except Exception as e:
    print('ERROR/NOT FOUND:', e)
"
echo "=== SPOT 24h volume ==="
curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=AKEUSDT"
echo ""
echo "=== FUTURES 24h volume ==="
curl -s "https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=AKEUSDT"
echo ""
echo "=== FUTURES order book depth (top 5) ==="
curl -s "https://fapi.binance.com/fapi/v1/depth?symbol=AKEUSDT&limit=5"
