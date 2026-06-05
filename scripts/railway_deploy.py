import os, sys, json, urllib.request, urllib.error, traceback

TOKEN = os.environ.get('RAILWAY_TOKEN', '')
SK    = os.environ.get('SUPABASE_SERVICE_KEY', '')
LOG   = '_railway_deploy_final.txt'

lines = ["=== Railway Deploy v2 ===\n"]
lines.append(f"Token length: {len(TOKEN)}\n")
lines.append(f"Token prefix: {TOKEN[:8]}...\n")

def gql(query):
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        "https://backboard.railway.app/graphql/v2",
        data=data,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            resp = r.read().decode()
            return json.loads(resp)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return {"http_error": e.code, "body": body}
    except Exception as ex:
        return {"exception": str(ex)}

# Step 1: Test auth
lines.append("\n--- Testing auth ---\n")
resp = gql("{ me { id name email } }")
lines.append(f"Response: {json.dumps(resp)}\n")

if resp.get("http_error") or resp.get("exception"):
    lines.append("FATAL: Cannot reach Railway API\n")
    open(LOG,'w').writelines(lines)
    print(''.join(lines))
    sys.exit(1)

if "errors" in resp:
    lines.append(f"AUTH FAILED: {resp['errors'][0]['message']}\n")
    lines.append("Token is invalid or wrong scope. Need account token with No Workspace.\n")
    open(LOG,'w').writelines(lines)
    print(''.join(lines))
    sys.exit(1)

me = resp['data']['me']
lines.append(f"SUCCESS: {me['name']} ({me['email']})\n")

# Step 2: Get projects
lines.append("\n--- Getting projects ---\n")
resp2 = gql("{ me { projects { edges { node { id name services { edges { node { id name } } } environments { edges { node { id name } } } } } } } }")
lines.append(f"Projects response: {json.dumps(resp2)[:600]}\n")

projects = resp2.get('data',{}).get('me',{}).get('projects',{}).get('edges',[])
lines.append(f"Projects found: {len(projects)}\n")

for p in projects:
    n = p['node']
    lines.append(f"  {n['name']} id:{n['id']}\n")
    for s in n.get('services',{}).get('edges',[]):
        lines.append(f"    svc: {s['node']['name']} id:{s['node']['id']}\n")
    for e in n.get('environments',{}).get('edges',[]):
        lines.append(f"    env: {e['node']['name']} id:{e['node']['id']}\n")

# Step 3: Get or create project
if projects:
    PROJECT_ID = projects[0]['node']['id']
    proj_node = projects[0]['node']
    svcs = proj_node.get('services',{}).get('edges',[])
    envs = proj_node.get('environments',{}).get('edges',[])
    lines.append(f"\nUsing project: {projects[0]['node']['name']} ({PROJECT_ID})\n")
else:
    lines.append("\nCreating project...\n")
    r = gql('mutation { projectCreate(input: { name: "CLAWBOT-Polymarket" }) { id name } }')
    lines.append(f"Create result: {r}\n")
    PROJECT_ID = r.get('data',{}).get('projectCreate',{}).get('id','')
    # Re-fetch
    r2 = gql(f'{{ project(id: "{PROJECT_ID}") {{ services {{ edges {{ node {{ id name }} }} }} environments {{ edges {{ node {{ id name }} }} }} }} }}')
    svcs = r2.get('data',{}).get('project',{}).get('services',{}).get('edges',[])
    envs = r2.get('data',{}).get('project',{}).get('environments',{}).get('edges',[])

ENV_ID = envs[0]['node']['id'] if envs else ''
lines.append(f"Env: {envs[0]['node']['name'] if envs else 'none'} ({ENV_ID})\n")

# Step 4: Get or create service
if svcs:
    SVC_ID = svcs[0]['node']['id']
    lines.append(f"Using service: {svcs[0]['node']['name']} ({SVC_ID})\n")
else:
    lines.append("Creating service...\n")
    r = gql(f'mutation {{ serviceCreate(input: {{ projectId: "{PROJECT_ID}", name: "clawbot-worker", source: {{ repo: "sacredhealing/sacredhealing-fa5d6004" }} }}) {{ id name }} }}')
    lines.append(f"Service create: {r}\n")
    SVC_ID = r.get('data',{}).get('serviceCreate',{}).get('id','')

lines.append(f"Service ID: {SVC_ID}\n")

# Step 5: Set env vars
lines.append("\n--- Setting env vars ---\n")
vars_to_set = [
    ("SUPABASE_URL", "https://fjdzhrdpioxdeyyfogep.supabase.co"),
    ("SUPABASE_SERVICE_KEY", SK),
    ("POLYGON_RPC_URL", "https://polygon-mainnet.g.alchemy.com/v2/az4D7Awbl2E2rNpe6kc3M"),
    ("PAPER_MODE", "true"),
    ("RISK_PCT", "0.02"),
    ("PORT", "8080"),
]
for k, v in vars_to_set:
    safe_v = v.replace('\\', '\\\\').replace('"', '\\"')
    r = gql(f'mutation {{ variableUpsert(input: {{ projectId: "{PROJECT_ID}", environmentId: "{ENV_ID}", serviceId: "{SVC_ID}", name: "{k}", value: "{safe_v}" }}) }}')
    ok = 'ok' if r.get('data',{}).get('variableUpsert') else str(r)[:80]
    lines.append(f"  {k}: {ok}\n")

# Step 6: Set root directory
lines.append("\n--- Setting root directory ---\n")
r = gql(f'mutation {{ serviceInstanceUpdate(serviceId: "{SVC_ID}", environmentId: "{ENV_ID}", input: {{ rootDirectory: "polymarket-worker" }}) }}')
lines.append(f"Root dir: {r}\n")

# Step 7: Deploy
lines.append("\n--- Triggering deploy ---\n")
r = gql(f'mutation {{ serviceInstanceDeploy(serviceId: "{SVC_ID}", environmentId: "{ENV_ID}") }}')
lines.append(f"Deploy: {r}\n")

lines.append(f"\n✅ DONE\n")
lines.append(f"Dashboard: https://railway.app/project/{PROJECT_ID}\n")

result = ''.join(lines)
open(LOG,'w').write(result)
print(result)
