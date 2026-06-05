import os, urllib.request, json, sys

TOKEN = os.environ.get('RAILWAY_TOKEN', 'MISSING')
LOG = '_railway_deploy_final.txt'
out = []

out.append(f"Token: {len(TOKEN)} chars, prefix: {TOKEN[:8]}\n")

# Test basic connectivity
try:
    req = urllib.request.Request("https://backboard.railway.app/graphql/v2",
        data=b'{"query":"{ __typename }"}',
        headers={"Content-Type":"application/json","Authorization":f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        body = r.read().decode()
        out.append(f"Railway reachable: YES - {r.status}\n")
        out.append(f"Response: {body[:300]}\n")
except Exception as e:
    out.append(f"Railway reachable: NO - {e}\n")

# Test me query
try:
    req2 = urllib.request.Request("https://backboard.railway.app/graphql/v2",
        data=b'{"query":"{ me { id name email } }"}',
        headers={"Content-Type":"application/json","Authorization":f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req2, timeout=15) as r:
        body = r.read().decode()
        out.append(f"Me query: {body[:300]}\n")
except Exception as e:
    out.append(f"Me query error: {e}\n")

result = ''.join(out)
open(LOG,'w').write(result)
print(result)
