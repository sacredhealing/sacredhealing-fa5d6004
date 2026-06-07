import urllib.request, json, os, sys, time

RAILWAY_TOKEN = os.environ.get('RAILWAY_TOKEN', '')
if not RAILWAY_TOKEN:
    print("No RAILWAY_TOKEN")
    sys.exit(1)

SERVICE_ID = "b6311e53-fe5a-4c4a-b724-e0fef686236f"

VARS = {
    "POLY_API_KEY": "019ea166-7177-7743-9b89-cb1840c13ec8",
    "POLY_API_SECRET": "wIx5xHwsa6CP2lZLKEEsNsoHSoddW-FYFDE1048IOKA=",
    "POLY_API_PASSPHRASE": "fd7c9f4fcc70ee2673d9c073b0da53f274f0b09b161141d3c6d5d934cb666197",
}

def gql(query):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        "https://backboard.railway.app/graphql/v2",
        data=data,
        headers={"Authorization": "Bearer " + RAILWAY_TOKEN, "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

# Get env ID
r = gql('{ service(id: "' + SERVICE_ID + '") { serviceInstances { edges { node { environmentId } } } } }')
env_id = r["data"]["service"]["serviceInstances"]["edges"][0]["node"]["environmentId"]
print("Env ID:", env_id)

# Set each var
for name, value in VARS.items():
    # Escape special chars in value
    v = value.replace('"', '\\"').replace('=', '\\u003d')
    mutation = 'mutation { variableUpsert(input: { serviceId: "' + SERVICE_ID + '", environmentId: "' + env_id + '", name: "' + name + '", value: "' + value + '" }) }'
    r2 = gql(mutation)
    ok = r2.get("data", {}).get("variableUpsert", False)
    print(("OK" if ok else "FAIL") + ": " + name)
    time.sleep(1)

print("All done")
