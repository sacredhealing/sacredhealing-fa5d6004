#!/usr/bin/env python3
# shreem_inject_keypair.py
# Run by GitHub Actions via shreem-deploy-live.yml SSH step
# Rewrites /root/shreem-ecosystem.config.js to include BOT_WALLET_PRIVATE_KEY
import os, sys

sb_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
bot_kp = os.environ.get("BOT_WALLET_PRIVATE_KEY", "")

if not bot_kp:
    print("ERROR: BOT_WALLET_PRIVATE_KEY env not set")
    sys.exit(1)

ecosystem = f"""module.exports={{apps:[{{
  name:"shreem-live",
  script:"/root/shreem-live-worker.js",
  restart_delay:5000,
  max_restarts:10,
  env:{{
    SUPABASE_SERVICE_ROLE_KEY:"{sb_key}",
    SHREEM_BOT_KEYPAIR:"{bot_kp}",
    BOT_WALLET_PRIVATE_KEY:"{bot_kp}",
    HELIUS_API_KEY:"7de253c3-49e2-42be-9672-23a761260f86"
  }}
}}]}};"""

with open("/root/shreem-ecosystem.config.js", "w") as f:
    f.write(ecosystem)

print("✅ Ecosystem written with SHREEM_BOT_KEYPAIR")
