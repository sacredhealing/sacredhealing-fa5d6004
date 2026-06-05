import urllib.request, json, time, os, sys, traceback

print("Script starting...", flush=True)
token = os.environ.get('RAILWAY_TOKEN', '')
print(f"RAILWAY_TOKEN length: {len(token)}", flush=True)
if not token:
    print("ERROR: RAILWAY_TOKEN not set", flush=True)
    sys.exit(1)

print(f"Token prefix: {token[:8]}...", flush=True)

SERVICE_ID = "b6311e53-fe5a-4c4a-b724-e0fef686236f"
DOMAIN = "clawbot.siddhaquantumnexus.com"
LOG = []

def gql(query):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        "https://backboard.railway.app/graphql/v2",
        data=data,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=20)
    return json.loads(resp.read())

def log(msg):
    print(msg, flush=True)
    LOG.append(str(msg))

log("=== CLAWBOT Domain Refresh ===")

try:
    log("Calling Railway GraphQL API...")
    r = gql('{ service(id: "' + SERVICE_ID + '") { id name domains { edges { node { id domain status } } } } }')
    log("Domains response: " + json.dumps(r))
except Exception as ex:
    log("GQL ERROR: " + str(ex))
    log(traceback.format_exc())
    with open("_clawbot_ssl_result.txt", "w") as f:
        f.write("\n".join(LOG))
    sys.exit(1)

edges = r.get("data",{}).get("service",{}).get("domains",{}).get("edges",[])
target_id = None
for e in edges:
    node = e["node"]
    log("  Found: " + node["domain"] + " | status=" + str(node.get("status")) + " | id=" + node["id"])
    if "clawbot" in node["domain"]:
        target_id = node["id"]

if target_id:
    log("Deleting stuck domain: " + target_id)
    try:
        r2 = gql('mutation { customDomainDelete(id: "' + target_id + '") }')
        log("Delete result: " + json.dumps(r2))
    except Exception as ex:
        log("DELETE ERROR: " + str(ex))
    log("Sleeping 10s...")
    time.sleep(10)
else:
    log("No existing clawbot domain found - will add fresh")

log("Adding domain: " + DOMAIN)
try:
    r3 = gql('mutation { customDomainCreate(input: { serviceId: "' + SERVICE_ID + '", domain: "' + DOMAIN + '" }) { id domain status } }')
    log("Add result: " + json.dumps(r3))
except Exception as ex:
    log("ADD ERROR: " + str(ex))
    log(traceback.format_exc())

log("Waiting 30s for SSL provisioning...")
time.sleep(30)

try:
    r4 = gql('{ service(id: "' + SERVICE_ID + '") { domains { edges { node { id domain status } } } } }')
    log("Final domain list: " + json.dumps(r4))
except Exception as ex:
    log("FINAL CHECK ERROR: " + str(ex))

for url in ["https://siddha-soma-apothecary-production.up.railway.app/health", "https://" + DOMAIN + "/health"]:
    try:
        req2 = urllib.request.Request(url, headers={"User-Agent": "SQI-HealthCheck"})
        resp2 = urllib.request.urlopen(req2, timeout=15)
        log("HEALTH-OK " + url + " -> HTTP " + str(resp2.status) + " | " + resp2.read().decode()[:150])
    except Exception as ex:
        log("HEALTH-FAIL " + url + " -> " + type(ex).__name__ + ": " + str(ex))

with open("_clawbot_ssl_result.txt", "w") as f:
    f.write("\n".join(LOG))

log("Script complete.")
print("Done.", flush=True)
