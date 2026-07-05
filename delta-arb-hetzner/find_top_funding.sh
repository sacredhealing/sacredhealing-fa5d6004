#!/bin/bash
echo "=== ALL CURRENT FUNDING RATES (sorted, top/bottom 15) ==="
curl -s "https://fapi.binance.com/fapi/v1/premiumIndex" > /tmp/all_rates.json
python3 - <<'PYEOF'
import json
data = json.load(open('/tmp/all_rates.json'))
rows = [(d['symbol'], float(d['lastFundingRate'])) for d in data if d.get('lastFundingRate') is not None]
rows.sort(key=lambda x: x[1], reverse=True)
print(f"Total perpetual symbols: {len(rows)}")
print("\n--- TOP 15 HIGHEST current funding rates ---")
for sym, rate in rows[:15]:
    print(f"{sym:15} {rate*100:8.4f}%  (annualized ~{rate*3*365*100:.1f}%)")
print("\n--- TOP 15 LOWEST (most negative) current funding rates ---")
for sym, rate in rows[-15:]:
    print(f"{sym:15} {rate*100:8.4f}%  (annualized ~{rate*3*365*100:.1f}%)")
PYEOF
