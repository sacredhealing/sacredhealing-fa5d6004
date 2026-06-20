#!/usr/bin/env python3
"""
setup-shreem-ecosystem.py
Writes PM2 ecosystem config with both keys and restarts shreem-live.
Reads SUPABASE_SERVICE_ROLE_KEY from PM2 dump or env.
"""
import os, json, subprocess, re, glob

HELIUS_KEY = "6db37a31-beea-4c43-924d-87f4867fa5f0"
SB_KEY = ""

# 1. Try environment variable
SB_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# 2. Try PM2 dump.pm2 — look in list of apps
if not SB_KEY:
    for dump_path in ["/root/.pm2/dump.pm2", "/root/.pm2/dump.pm2.bak"]:
        try:
            with open(dump_path) as f:
                dump = json.load(f)
            for app in dump.get("apps", []):
                env = app.get("pm2_env", {}).get("env", {}) or app.get("env", {})
                val = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
                if val and len(val) > 20:
                    SB_KEY = val
                    print(f"Found SB key in PM2 dump ({dump_path})")
                    break
            if SB_KEY:
                break
        except Exception as e:
            pass

# 3. Try current ecosystem config (JSON format)
if not SB_KEY:
    try:
        with open("/root/shreem-ecosystem.config.js") as f:
            raw = f.read()
        # Strip "module.exports = " prefix and trailing ";"
        raw = raw.strip()
        if raw.startswith("module.exports"):
            raw = raw[raw.index("=") + 1:].strip().rstrip(";")
        cfg = json.loads(raw)
        for app in cfg.get("apps", []):
            val = app.get("env", {}).get("SUPABASE_SERVICE_ROLE_KEY", "")
            if val and len(val) > 20:
                SB_KEY = val
                print("Found SB key in ecosystem config")
                break
    except Exception as e:
        print(f"Ecosystem parse error: {e}")

# 4. Try PM2 process list JSON
if not SB_KEY:
    try:
        r = subprocess.run(["pm2", "jlist"], capture_output=True, text=True, timeout=10)
        procs = json.loads(r.stdout)
        for p in procs:
            env = p.get("pm2_env", {}).get("env", {})
            val = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
            if val and len(val) > 20:
                SB_KEY = val
                print("Found SB key in pm2 jlist")
                break
    except Exception as e:
        print(f"pm2 jlist error: {e}")

if not SB_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not found in any source")
    print("Please set it: export SUPABASE_SERVICE_ROLE_KEY=your_key && python3 this_script.py")
    exit(1)

print(f"HELIUS prefix: {HELIUS_KEY[:8]}")
print(f"SB prefix: {SB_KEY[:8]} (len={len(SB_KEY)})")

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

eco_path = "/root/shreem-ecosystem.config.js"
with open(eco_path, "w") as f:
    f.write("module.exports = " + json.dumps(config, indent=2) + ";\n")
print(f"Ecosystem written to {eco_path}")

# Stop and delete old process
subprocess.run(["pm2", "stop", "shreem-live"], capture_output=True)
subprocess.run(["pm2", "delete", "shreem-live"], capture_output=True)

# Start fresh from ecosystem
result = subprocess.run(["pm2", "start", eco_path], capture_output=True, text=True)
print(result.stdout[-800:] if result.stdout else "(no stdout)")
if result.returncode != 0:
    print("STDERR:", result.stderr[-300:])
    exit(1)

# Save
subprocess.run(["pm2", "save", "--force"], capture_output=True)
print("DONE - shreem-live started with both keys and saved")
