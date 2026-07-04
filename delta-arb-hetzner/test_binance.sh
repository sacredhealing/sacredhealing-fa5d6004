#!/bin/bash
set -e
source <(grep -v '^#' /root/delta-arb/delta-arb-hetzner/.env | sed 's/^/export /')
TS=$(date +%s%N | cut -b1-13)
QS="timestamp=${TS}&recvWindow=10000"
SIG=$(echo -n "$QS" | openssl dgst -sha256 -hmac "$BINANCE_API_SECRET" | awk '{print $2}')
echo "=== BINANCE ACCOUNT CALL FROM HETZNER (Germany) ==="
echo "timestamp used: $TS"
curl -s -w ' HTTP_%{http_code}\n' "https://api.binance.com/api/v3/account?${QS}&signature=${SIG}" -H "X-MBX-APIKEY: $BINANCE_API_KEY"
