import urllib.request, json, os, ssl, sys

SUPA_URL = "https://fjdzhrdpioxdeyyfogep.supabase.co"
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
if not SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_KEY not set")
    sys.exit(1)

ctx = ssl.create_default_context()

def run_sql(sql, label):
    # Use Supabase Management API
    PAT = os.environ.get('SUPABASE_ACCESS_TOKEN', '')
    if not PAT:
        print(f"  SKIP {label}: no PAT")
        return False
    
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        result = resp.read().decode()
        print(f"  OK: {label} -> {result[:80]}")
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "already exists" in body:
            print(f"  SKIP: {label} (already exists)")
            return True
        print(f"  WARN: {label} HTTP {e.code}: {body[:100]}")
        return False

# Read all 3 migration files
import glob, os

LOG = []

def log(m):
    print(m, flush=True)
    LOG.append(m)

log("=== DIRECT MIGRATION APPLY ===")

# Split SQL into individual statements and run each
for fname in [
    "supabase/migrations/20260605000000_clawbot_profit_share.sql",
    "supabase/migrations/20260605100000_fix_clawbot_rls.sql",
    "supabase/migrations/20260605200000_clawbot_affiliate.sql",
]:
    log(f"\n--- {fname} ---")
    with open(fname) as f:
        sql = f.read()
    
    # Run as single query
    PAT = os.environ.get('SUPABASE_ACCESS_TOKEN', '')
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=60)
        result = resp.read().decode()
        log(f"  OK: {result[:100]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        log(f"  HTTP {e.code}: {body[:200]}")
    except Exception as e:
        log(f"  ERROR: {str(e)}")

with open("_migration_result.txt", "w") as f:
    f.write("\n".join(LOG))
