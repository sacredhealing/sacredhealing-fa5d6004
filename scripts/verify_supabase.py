import urllib.request, json, os, ssl

SUPA_URL = "https://fjdzhrdpioxdeyyfogep.supabase.co"
# Use service key from env var VITE_SUPABASE_ANON_KEY + SUPABASE_SERVICE_KEY
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
ANON_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')

# Try service key first, fall back to anon
KEY = SERVICE_KEY or ANON_KEY
LOG = []

ctx = ssl.create_default_context()

def rest(table, query="select=id&limit=0"):
    req = urllib.request.Request(
        SUPA_URL + "/rest/v1/" + table + "?" + query,
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY}
    )
    resp = urllib.request.urlopen(req, context=ctx, timeout=10)
    return json.loads(resp.read())

def rpc(fn, body={}):
    req = urllib.request.Request(
        SUPA_URL + "/rest/v1/rpc/" + fn,
        data=json.dumps(body).encode(),
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, context=ctx, timeout=10)
    return json.loads(resp.read())

def log(msg):
    print(msg, flush=True)
    LOG.append(str(msg))

log("=== SUPABASE TABLE VERIFICATION ===")
log("Using key: " + KEY[:20] + "..." if KEY else "NO KEY SET")

tables = [
    "clawbot_members",
    "clawbot_fee_ledger",
    "clawbot_platform_config",
    "clawbot_affiliate_rates",
    "polymarket_trades",
    "affiliate_profiles",
    "affiliate_commissions",
]

for t in tables:
    try:
        data = rest(t, "limit=0")
        log("  PASS: " + t)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "42P01" in body or "does not exist" in body:
            log("  FAIL: " + t + " — TABLE MISSING")
        elif e.code == 406:
            log("  PASS: " + t + " (exists, RLS blocks anon)")
        else:
            log("  WARN: " + t + " HTTP " + str(e.code) + " " + body[:80])
    except Exception as e:
        log("  ERROR: " + t + " " + str(e))

# Check specific columns by querying them
log("")
log("=== COLUMN CHECKS ===")
col_checks = [
    ("profiles", "referred_by"),
    ("affiliate_commissions", "source"),
    ("affiliate_commissions", "level"),
]
for t, c in col_checks:
    try:
        data = rest(t, "select=" + c + "&limit=1")
        log("  PASS: " + t + "." + c)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if "column" in body.lower() and ("does not exist" in body or "unknown" in body.lower()):
            log("  FAIL: " + t + "." + c + " — COLUMN MISSING")
        elif e.code in [406, 200]:
            log("  PASS: " + t + "." + c + " (exists)")
        else:
            log("  WARN: " + t + "." + c + " HTTP " + str(e.code) + " " + body[:80])

# Get platform config
log("")
log("=== PLATFORM CONFIG ===")
try:
    data = rest("clawbot_platform_config", "select=*")
    log("  Config: " + json.dumps(data))
except Exception as e:
    log("  Error: " + str(e))

# Get affiliate rates
log("")
log("=== AFFILIATE RATES ===")
try:
    data = rest("clawbot_affiliate_rates", "select=*&order=tier")
    for row in data:
        log("  " + row.get("tier","?") + ": L1=" + str(row.get("l1_pct","?")) + "% L2=" + str(row.get("l2_pct","?")) + "% Platform=" + str(row.get("platform_pct","?")) + "%")
except Exception as e:
    log("  Error: " + str(e))

with open("_supabase_verify.txt", "w") as f:
    f.write("\n".join(LOG))
print("Verification complete")
