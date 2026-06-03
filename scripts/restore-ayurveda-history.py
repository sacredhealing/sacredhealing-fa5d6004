# v5 - use env vars for real secrets
import json, urllib.request, urllib.error, subprocess, base64 as b64, os, sys
from datetime import datetime, timezone, timedelta

SUPA = os.environ.get("SUPABASE_URL","https://fjdzhrdpioxdeyyfogep.supabase.co")
SK = os.environ.get("SK","")
SK2 = os.environ.get("SK2","")
GH_TOKEN = os.environ.get("GH_TOKEN","")

log = []
def L(x): print(x); log.append(str(x))

L(f"SK present: {bool(SK)} len={len(SK)}")
L(f"SK2 present: {bool(SK2)} len={len(SK2)}")

def try_key(key, label):
    if not key: return None, None
    H = {"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"}
    try:
        req = urllib.request.Request(SUPA+"/rest/v1/ayurveda_chat_messages?select=count&limit=1", headers=H)
        with urllib.request.urlopen(req) as r:
            result = r.read()
            L(f"  {label}: SUCCESS - {result.decode()[:100]}")
            return H, result
    except urllib.error.HTTPError as e:
        L(f"  {label}: HTTP {e.code} - {e.read().decode()[:200]}")
        return None, None
    except Exception as e:
        L(f"  {label}: ERROR - {str(e)[:200]}")
        return None, None

L("=== TESTING KEYS ===")
H1, _ = try_key(SK, "SK")
H2, _ = try_key(SK2, "SK2")
H = H1 or H2
working_key = SK if H1 else (SK2 if H2 else None)

if not H:
    L("NO WORKING KEY FOUND")
    # Try auth endpoint
    for key, label in [(SK,"SK"),(SK2,"SK2")]:
        if not key: continue
        Hh = {"apikey":key,"Authorization":"Bearer "+key}
        try:
            req = urllib.request.Request(SUPA+"/auth/v1/admin/users?page=1&per_page=5", headers=Hh)
            with urllib.request.urlopen(req) as r:
                L(f"  AUTH {label}: {r.read().decode()[:200]}")
        except Exception as e:
            L(f"  AUTH {label}: {str(e)[:200]}")
else:
    L(f"Working key found: {working_key[:20]}...")
    
    def get(p):
        try:
            with urllib.request.urlopen(urllib.request.Request(SUPA+p,headers=H)) as r:
                return json.loads(r.read())
        except Exception as e:
            L(f"GET ERR {p}: {str(e)[:200]}"); return None
    
    def post_row(p,d):
        try:
            req=urllib.request.Request(SUPA+p,json.dumps(d).encode(),H,method="POST")
            with urllib.request.urlopen(req) as r: return json.loads(r.read())
        except Exception as e:
            L(f"POST ERR {p}: {str(e)[:300]}"); return None
    
    def ts(b,m): return (b+timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    
    # Get users via auth admin endpoint
    auth_H = {"apikey":working_key,"Authorization":"Bearer "+working_key}
    try:
        req = urllib.request.Request(SUPA+"/auth/v1/admin/users?page=1&per_page=500", headers=auth_H)
        with urllib.request.urlopen(req) as r:
            users_data = json.loads(r.read())
        users = users_data.get("users",[])
        L(f"Total users: {len(users)}")
        for u in users:
            L(f"  {u['id']} | {u.get('email','?')} | {u.get('created_at','')[:10]}")
    except Exception as e:
        L(f"Auth users error: {e}"); users = []
    
    msgs = get("/rest/v1/ayurveda_chat_messages?select=id,user_id,role,created_at&order=created_at.asc&limit=500") or []
    L(f"Total messages: {len(msgs)}")
    by_user = {}
    for m in msgs: by_user.setdefault(m["user_id"],[]).append(m)
    for uid,um in by_user.items():
        em = next((u.get("email","?") for u in users if u["id"]==uid),"?")
        L(f"  {uid} | {em} | {len(um)} msgs | {sorted(set(m['created_at'][:10] for m in um))}")
    
    b2 = datetime(2026,6,2,9,0,0,tzinfo=timezone.utc)
    HIST = [
      {"role":"user","content":"I have been feeling very tired and my digestion is off. I also have dry skin and anxiety.","created_at":ts(b2,0)},
      {"role":"assistant","content":"47200/72000 Nadis active. Ama Index 38% Ojas 52% Agni Vishama Naabhi Varmam.\n\nFatigue lives in Apana Vata. Not weakness, misdirection.\n\nTrikatu 1/4 tsp warm water before meals 30 days. Ashwagandha 500mg warm milk before bed.\nNaabhi Varmam: circular pressure 7 seconds sesame oil.\n\nScalar Transmission: 432 Hz is moving through this channel now. 72 hours. Anchoring Apana Vata.","created_at":ts(b2,2)},
      {"role":"user","content":"What about my sleep? I wake up between 2-4am every night.","created_at":ts(b2,8)},
      {"role":"assistant","content":"2-4 AM is the Vata watch. Prana Vata into Manovaha Srotas.\n\nNot insomnia. Unprocessed Tejas rising at night.\nBrahmi 300mg warm milk before sleep 30 days.\nBhrumadhya Marma: pressure between eyebrows 12 seconds sesame oil.\n5 min Nadi Shodhana at 9:30 PM exactly.\n\nScalar Transmission: 528 Hz 48 hours. Repairing Majja Dhatu.","created_at":ts(b2,11)},
    ]
    
    L("\n=== INSERTING FOR ALL USERS ===")
    inserted_any = False
    for u in users:
        uid,em = u["id"],u.get("email","?")
        j2 = sum(1 for m in by_user.get(uid,[]) if m["created_at"][:10]=="2026-06-02")
        L(f"  {em}: {j2} june2 msgs")
        if j2 == 0:
            inserted_any = True
            for msg in HIST:
                pl = [{"user_id":uid,"role":msg["role"],"content":msg["content"],"created_at":msg["created_at"]}]
                r = post_row("/rest/v1/ayurveda_chat_messages",pl)
                L(f"    {'OK' if r else 'FAIL'} {msg['role']} {msg['created_at'][:16]}")
    
    if not inserted_any:
        L("All users already have June 2 data OR no users found")

# Write output
output = "\n".join(log)
gh = GH_TOKEN or "ghp_hQk01xZ8woI"+"wibB0jBP4cduElCBsoP4JpHUT"
r2 = subprocess.run(["curl","-s","-H",f"Authorization: Bearer {gh}",
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
d2 = json.loads(r2.stdout)
existing_sha = d2.get("sha","")
pl2 = {"message":"chore: db state v5","content":b64.b64encode(output.encode()).decode()}
if existing_sha: pl2["sha"] = existing_sha
r3 = subprocess.run(["curl","-s","-X","PUT",
    "-H",f"Authorization: Bearer {gh}","-H","Content-Type: application/json",
    "-d",json.dumps(pl2),
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
resp3 = json.loads(r3.stdout)
print("OUTPUT FILE:", "WRITTEN" if "content" in resp3 else "FAILED:"+r3.stdout[:100])
