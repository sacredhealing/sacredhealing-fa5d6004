#!/bin/bash
for SYM in KORUUSDT MVLLUSDT CRCLUSDT MSTRUSDT AKEUSDT; do
  echo "### $SYM (last 21 periods = 7 days) ###"
  curl -s "https://fapi.binance.com/fapi/v1/fundingRate?symbol=${SYM}&limit=21"
  echo ""
done
