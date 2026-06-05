import urllib.request, json, os, ssl, time

PAT = os.environ.get('SUPABASE_PAT', '')
if not PAT:
    print("ERROR: SUPABASE_PAT not set")
    exit(1)

ctx = ssl.create_default_context()

def run_query(sql):
    req = urllib.request.Request(
        "https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": "Bearer " + PAT,
            "Content-Type": "application/json",
            "X-Client-Info": "supabase-py/2.0"
        }
    )
    try:
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        return True, resp.read().decode()[:200]
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return False, str(e.code) + ": " + body[:200]

# Split SQL into statements and run each one
with open("supabase/migrations/20260605000000_clawbot_profit_share.sql") as f:
    sql1 = f.read()
with open("supabase/migrations/20260605100000_fix_clawbot_rls.sql") as f:
    sql2 = f.read()
with open("supabase/migrations/20260605200000_clawbot_affiliate.sql") as f:
    sql3 = f.read()

for name, sql in [("profit_share", sql1), ("rls_fix", sql2), ("affiliate", sql3)]:
    print(f"Running {name}...")
    ok, msg = run_query(sql)
    print(f"  {'OK' if ok else 'ERR'}: {msg[:100]}")
    time.sleep(2)

print("Done")
