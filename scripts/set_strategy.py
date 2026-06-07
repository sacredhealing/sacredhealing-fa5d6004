import urllib.request, json, os

PAT  = os.environ.get('SUPABASE_PAT', '')
SK   = os.environ.get('SK') or os.environ.get('SK2', '')
DB   = 'https://api.supabase.com/v1/projects/fjdzhrdpioxdeyyfogep/database/query'
BASE = 'https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1'

def q(sql):
    data = json.dumps({'query': sql}).encode()
    req  = urllib.request.Request(DB, data=data,
           headers={'Authorization': f'Bearer {PAT}', 'Content-Type': 'application/json'},
           method='POST')
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def patch(path, data):
    req = urllib.request.Request(f'{BASE}{path}',
        data=json.dumps(data).encode(),
        headers={'apikey': SK, 'Authorization': f'Bearer {SK}',
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        method='PATCH')
    with urllib.request.urlopen(req, timeout=10): pass

# Set active_strategy = 'aggressive' using REST PATCH (avoids SQL quoting)
print('Setting active_strategy = aggressive via REST...')
patch('/delta_arb_platform_config?id=eq.1', {'active_strategy': 'aggressive'})
print('Done')

# Verify
req = urllib.request.Request(f'{BASE}/delta_arb_platform_config?select=active_strategy',
    headers={'apikey': SK, 'Authorization': f'Bearer {SK}'})
with urllib.request.urlopen(req, timeout=10) as r:
    result = json.loads(r.read())
    print(f'Verified: {result}')
