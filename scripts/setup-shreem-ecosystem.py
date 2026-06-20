#!/usr/bin/env python3
import os, json, subprocess, re

HELIUS_KEY = "6db37a31-beea-4c43-924d-87f4867fa5f0"
SB_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Read SB key from existing ecosystem if not in env
if not SB_KEY:
    try:
        with open("/root/shreem-ecosystem.config.js") as f:
            content = f.read()
            m = re.search(r'SUPABASE_SERVICE_ROLE_KEY["\s:]+([^"\']{20,})["\']', content)
            if m:
                SB_KEY = m.group(1).strip()
    except Exception as e:
        print("Could not read existing ecosystem:", e)

if not SB_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found anywhere")
    exit(1)

config = {
    "apps": [{
        "name": "shreem-live",
        "script": "/root/shreem-live-worker.js",
        "cwd": "/root/shreem-brzee",
        "restart_delay": 5000,
        "max_restarts": 10,
        "env": {
            "HELIUS_API_KEY": HELIUS_KEY,
            "SUPABASE_SERVICE_ROLE_KEY": SB_KEY,
            "NODE_ENV": "production"
        }
    }]
}

with open("/root/shreem-ecosystem.config.js", "w") as f:
    f.write("module.exports = " + json.dumps(config, indent=2) + ";\n")

print("Ecosystem written OK")
print("HELIUS prefix:", HELIUS_KEY[:8])
print("SB prefix:", SB_KEY[:8])

subprocess.run(["pm2", "stop", "shreem-live"], capture_output=True)
subprocess.run(["pm2", "delete", "shreem-live"], capture_output=True)
result = subprocess.run(["pm2", "start", "/root/shreem-ecosystem.config.js"], capture_output=True, text=True)
print(result.stdout[-500:] if result.stdout else "")
if result.returncode == 0:
    subprocess.run(["pm2", "save"])
    print("DONE - shreem-live started with both keys")
else:
    print("PM2 start failed:", result.stderr[-200:])
