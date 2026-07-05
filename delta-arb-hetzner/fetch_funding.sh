#!/bin/bash
for SYM in BTCUSDT ETHUSDT SOLUSDT DOGEUSDT XRPUSDT ADAUSDT; do
  echo "### $SYM ###"
  curl -s "https://fapi.binance.com/fapi/v1/fundingRate?symbol=${SYM}&limit=270"
  echo ""
done
