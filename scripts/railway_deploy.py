import os, sys, json, subprocess, urllib.request, urllib.error

TOKEN = os.environ['RAILWAY_TOKEN']
SK    = os.environ['SUPABASE_SERVICE_KEY']
LOG   = '_railway_deploy_final.txt'

def gql(query, variables=None):
    data = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://backboard.railway.app/graphql/v2",
        data=data,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}

lines = [f"=== Railway Deploy ===\n"]

# Test auth
print("Testing auth...")
me_resp = gql("{ me { id name email projects { edges { node { id name services { edges { node { id name } } } environments { edges { node { id name } } } } } } } }")
lines.append(f"Raw response: {json.dumps(me_resp)[:500]}\n")

if "errors" in me_resp:
    lines.append(f"TOKEN ERROR: {me_resp['errors'][0]['message']}\n")
    open(LOG,'w').write('\n'.join(lines))
    sys.exit(1)

me = me_resp['data']['me']
lines.append(f"Logged in: {me['name']} ({me['email']})\n")
print(f"Logged in as: {me['name']} ({me['email']})")

projects = me.get('projects',{}).get('edges',[])
lines.append(f"Projects found: {len(projects)}\n")
for p in projects:
    n = p['node']
    lines.append(f"  Project: {n['name']} (id: {n['id']})\n")
    for s in n.get('services',{}).get('edges',[]):
        lines.append(f"    Service: {s['node']['name']} (id: {s['node']['id']})\n")
    for e in n.get('environments',{}).get('edges',[]):
        lines.append(f"    Env: {e['node']['name']} (id: {e['node']['id']})\n")

# Use existing project or create new one
if projects:
    PROJECT_ID = projects[0]['node']['id']
    PROJECT_NAME = projects[0]['node']['name']
    lines.append(f"Using existing project: {PROJECT_NAME} ({PROJECT_ID})\n")
else:
    lines.append("No projects - creating new one...\n")
    r = gql('mutation { projectCreate(input: { name: "CLAWBOT-Polymarket" }) { id name } }')
    PROJECT_ID = r['data']['projectCreate']['id']
    lines.append(f"Created project: {PROJECT_ID}\n")

# Get environment
env_resp = gql(f'{{ project(id: "{PROJECT_ID}") {{ environments {{ edges {{ node {{ id name }} }} }} }} }}')
envs = env_resp.get('data',{}).get('project',{}).get('environments',{}).get('edges',[])
ENV_ID = envs[0]['node']['id'] if envs else ''
lines.append(f"Environment: {envs[0]['node']['name'] if envs else 'none'} ({ENV_ID})\n")

# Get or create service
svc_resp = gql(f'{{ project(id: "{PROJECT_ID}") {{ services {{ edges {{ node {{ id name }} }} }} }} }}')
svcs = svc_resp.get('data',{}).get('project',{}).get('services',{}).get('edges',[])

if svcs:
    SVC_ID = svcs[0]['node']['id']
    lines.append(f"Using existing service: {svcs[0]['node']['name']} ({SVC_ID})\n")
else:
    lines.append("Creating service from GitHub repo...\n")
    r = gql(f'mutation {{ serviceCreate(input: {{ projectId: "{PROJECT_ID}", name: "clawbot-worker", source: {{ repo: "sacredhealing/sacredhealing-fa5d6004" }} }}) {{ id name }} }}')
    SVC_ID = r.get('data',{}).get('serviceCreate',{}).get('id','')
    lines.append(f"Service created: {SVC_ID}\n")

lines.append(f"Service ID: {SVC_ID}\n")

# Set env vars
print("Setting env vars...")
env_vars = {
    "SUPABASE_URL": "https://fjdzhrdpioxdeyyfogep.supabase.co",
    "SUPABASE_SERVICE_KEY": SK,
    "POLYGON_RPC_URL": "https://polygon-mainnet.g.alchemy.com/v2/az4D7Awbl2E2rNpe6kc3M",
    "PAPER_MODE": "true",
    "RISK_PCT": "0.02",
    "PORT": "8080",
}

for key, val in env_vars.items():
    escaped_val = val.replace('"', '\\"')
    r = gql(f'mutation {{ variableUpsert(input: {{ projectId: "{PROJECT_ID}", environmentId: "{ENV_ID}", serviceId: "{SVC_ID}", name: "{key}", value: "{escaped_val}" }}) }}')
    ok = 'ok' if r.get('data',{}).get('variableUpsert') else f'err: {r}'
    lines.append(f"Set {key}: {ok}\n")

# Set root directory to polymarket-worker
print("Setting root directory...")
r = gql(f'mutation {{ serviceInstanceUpdate(serviceId: "{SVC_ID}", environmentId: "{ENV_ID}", input: {{ rootDirectory: "polymarket-worker" }}) }}')
lines.append(f"Root dir: {r}\n")

# Trigger deployment
print("Triggering deployment...")
r = gql(f'mutation {{ serviceInstanceDeploy(serviceId: "{SVC_ID}", environmentId: "{ENV_ID}") }}')
lines.append(f"Deploy triggered: {r}\n")

lines.append(f"\n=== DONE ===\n")
lines.append(f"Dashboard: https://railway.app/project/{PROJECT_ID}\n")
lines.append(f"Service ID: {SVC_ID}\n")

result = '\n'.join(lines)
open(LOG, 'w').write(result)
print(result)
