import urllib.request, json, os

PAT = os.environ['SUPABASE_ACCESS_TOKEN']
REF = "fjdzhrdpioxdeyyfogep"
LOG = []

def q(sql):
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/" + REF + "/database/query",
        data=data,
        headers={"Authorization": "Bearer " + PAT, "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

def log(msg):
    print(msg, flush=True)
    LOG.append(str(msg))

log("=== SUPABASE VERIFICATION ===")

tables = ["clawbot_members","clawbot_fee_ledger","clawbot_platform_config","clawbot_affiliate_rates"]
for t in tables:
    try:
        r = q("SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name='" + t + "' AND table_schema='public'")
        exists = int(r[0]["c"]) > 0
        log("  " + ("PASS" if exists else "FAIL") + ": " + t)
    except Exception as e:
        log("  ERROR: " + t + ": " + str(e))

cols = [("profiles","referred_by"),("affiliate_commissions","source"),("affiliate_commissions","level"),("affiliate_commissions","clawbot_trade_id")]
for t, c in cols:
    try:
        r = q("SELECT COUNT(*) as c FROM information_schema.columns WHERE table_name='" + t + "' AND column_name='" + c + "'")
        exists = int(r[0]["c"]) > 0
        log("  " + ("PASS" if exists else "FAIL") + ": " + t + "." + c)
    except Exception as e:
        log("  ERROR: " + t + "." + c + ": " + str(e))

try:
    r = q("SELECT * FROM clawbot_affiliate_rates ORDER BY tier")
    log("  RATES: " + json.dumps(r))
except Exception as e:
    log("  RATES ERROR: " + str(e))

try:
    r = q("SELECT * FROM clawbot_platform_config")
    log("  CONFIG: " + json.dumps(r))
except Exception as e:
    log("  CONFIG ERROR: " + str(e))

with open("_supabase_verify.txt", "w") as f:
    f.write("\n".join(LOG))
print("Done")
