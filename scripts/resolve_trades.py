import urllib.request, json, os

RAILWAY_TOKEN = os.environ.get("RAILWAY_TOKEN","")
BASE = "https://backboard.railway.app/graphql/v2"

def gql(query):
    req = urllib.request.Request(BASE,
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"Bearer {RAILWAY_TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

# Check env vars
q = '{"query": "{ variables(serviceId: \\"d06cd2df-e657-434f-b8fa-db34c3b3c473\\", environmentId: \\"5745e241-6e8e-4c3e-a5fd-91efff9a72c2\\", projectId: \\"4851410d-a6d6-4739-be6b-33e6deb5b6f2\\") }"  }'
req = urllib.request.Request(BASE,
    data=q.encode(),
    headers={"Authorization": f"Bearer {RAILWAY_TOKEN}", "Content-Type": "application/json"})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read())

variables = data.get("data", {}).get("variables", {})
print("Railway env vars:")
for k, v in variables.items():
    if k in ["MODE", "STARTING_BALANCE", "STRATEGY"]:
        print(f"  {k} = {v}")
    elif "PRIVATE" in k or "KEY" in k:
        print(f"  {k} = {v[:10]}..." if v else f"  {k} = EMPTY")
    elif "ADDRESS" in k or "FUNDER" in k:
        print(f"  {k} = {v}")
