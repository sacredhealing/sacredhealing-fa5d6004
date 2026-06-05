import urllib.request, json, os, ssl

SUPA_URL = "https://fjdzhrdpioxdeyyfogep.supabase.co"
KEY = os.environ.get('SUPABASE_SERVICE_KEY') or "sb_publishable_H4AI2ZzqOL1Y7o6qRMr8ew_5-4pih8F"
LOG = []
ctx = ssl.create_default_context()

def rest(table, query="select=id&limit=0"):
    req = urllib.request.Request(
        SUPA_URL + "/rest/v1/" + table + "?" + query,
        headers={"apikey": KEY, "Authorization": "Bearer " + KEY}
    )
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=10)
        return json.loads(resp.read()), None
    except urllib.error.HTTPError as e:
        return None, (e.code, e.read().decode()[:150])

def log(msg):
    print(msg, flush=True)
    LOG.append(str(msg))

log("=== SUPABASE TABLE VERIFICATION ===")

tables = [
    "clawbot_members", "clawbot_fee_ledger",
    "clawbot_platform_config", "clawbot_affiliate_rates",
    "polymarket_trades", "affiliate_profiles", "affiliate_commissions",
]

for t in tables:
    data, err = rest(t)
    if data is not None:
        log("  PASS: " + t)
    elif err:
        code, body = err
        if "42P01" in body or "does not exist" in body:
            log("  FAIL: " + t + " TABLE MISSING")
        elif code in [406, 200]:
            log("  PASS: " + t + " (RLS blocks anon)")
        else:
            log("  STATUS: " + t + " HTTP " + str(code) + " " + body[:60])

log("")
log("=== COLUMNS ===")
for t, c in [("profiles","referred_by"),("affiliate_commissions","source"),("affiliate_commissions","level")]:
    data, err = rest(t, "select=" + c + "&limit=1")
    if data is not None:
        log("  PASS: " + t + "." + c)
    elif err:
        code, body = err
        if "column" in body.lower() and "does not exist" in body:
            log("  FAIL: " + t + "." + c + " MISSING")
        elif code in [406]:
            log("  PASS: " + t + "." + c + " (RLS)")
        else:
            log("  STATUS: " + t + "." + c + " HTTP " + str(code) + " " + body[:60])

log("")
log("=== RATES ===")
data, err = rest("clawbot_affiliate_rates", "select=*&order=tier")
if data:
    for row in data:
        log("  " + str(row.get("tier")) + ": L1=" + str(row.get("l1_pct")) + "% L2=" + str(row.get("l2_pct")) + "% Plat=" + str(row.get("platform_pct")) + "%")
elif err:
    log("  " + str(err))

log("")
log("=== CONFIG ===")
data, err = rest("clawbot_platform_config", "select=*")
if data:
    for row in data:
        log("  platform_wallet: " + str(row.get("platform_wallet","not set")) + " auto=" + str(row.get("auto_transfer")))
elif err:
    log("  " + str(err))

with open("_supabase_verify.txt", "w") as f:
    f.write("\n".join(LOG))
print("Done")
