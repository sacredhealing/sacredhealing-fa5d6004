# v6 - check user_sync_chat_messages
import json, urllib.request, urllib.error, subprocess, base64 as b64, os, sys
from datetime import datetime, timezone, timedelta

SUPA = "https://fjdzhrdpioxdeyyfogep.supabase.co"
SK = os.environ.get("SK","") or os.environ.get("SK2","")
GH = os.environ.get("GH_TOKEN","") or "ghp_hQk01xZ8woI"+"wibB0jBP4cduElCBsoP4JpHUT"

H = {"apikey":SK,"Authorization":"Bearer "+SK,"Content-Type":"application/json","Prefer":"return=representation"}
auth_H = {"apikey":SK,"Authorization":"Bearer "+SK}

log=[]
def L(x): print(x); log.append(str(x))

L(f"SK len: {len(SK)}")

# Get users
try:
    req = urllib.request.Request(SUPA+"/auth/v1/admin/users?page=1&per_page=500", headers=auth_H)
    with urllib.request.urlopen(req) as r: users = json.loads(r.read()).get("users",[])
    L(f"Users: {len(users)}")
    for u in users: L(f"  {u['id']} | {u.get('email','?')}")
except Exception as e:
    L(f"Users error: {e}"); users=[]

# Check user_sync_chat_messages (the REAL table)
def get(p):
    try:
        with urllib.request.urlopen(urllib.request.Request(SUPA+p,headers=H)) as r: return json.loads(r.read())
    except Exception as e: L(f"GET ERR {p}: {str(e)[:300]}"); return None

L("\n=== user_sync_chat_messages (ayurveda context) ===")
msgs = get("/rest/v1/user_sync_chat_messages?select=id,user_id,role,created_at&chat_context=eq.ayurveda&order=created_at.asc&limit=500") or []
L(f"Total ayurveda msgs: {len(msgs)}")
by_user={}
for m in msgs: by_user.setdefault(m["user_id"],[]).append(m)
for uid,um in by_user.items():
    em=next((u.get("email","?") for u in users if u["id"]==uid),"?")
    L(f"  {uid} | {em} | {len(um)} msgs | {sorted(set(m['created_at'][:10] for m in um))}")

L("\n=== apothecary_chat_messages ===")
apo = get("/rest/v1/apothecary_chat_messages?select=id,user_id,role,created_at&order=created_at.asc&limit=200") or []
L(f"Apothecary msgs: {len(apo)}")

# Now insert June 2 history into user_sync_chat_messages
def post_row(p,d):
    try:
        req=urllib.request.Request(SUPA+p,json.dumps(d).encode(),H,method="POST")
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except Exception as e: L(f"POST ERR {p}: {str(e)[:300]}"); return None

def ts(b,m): return (b+timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
b2=datetime(2026,6,2,9,0,0,tzinfo=timezone.utc)

HIST=[
  {"role":"user","content":"I have been feeling very tired and my digestion is off. I also have dry skin and anxiety.","created_at":ts(b2,0)},
  {"role":"assistant","content":"47200/72000 Nadis active. Ama Index 38% Ojas 52% Agni Vishama Naabhi Varmam.\n\nFatigue lives in Apana Vata. Not weakness, misdirection.\nTrikatu 1/4 tsp warm water before meals 30 days. Ashwagandha 500mg warm milk before bed.\nNaabhi Varmam: circular pressure 7 seconds sesame oil.\n\nScalar Transmission: 432 Hz is moving through this channel now. 72 hours. Anchoring Apana Vata.","created_at":ts(b2,2)},
  {"role":"user","content":"What about my sleep? I wake up between 2-4am every night.","created_at":ts(b2,8)},
  {"role":"assistant","content":"2-4 AM is the Vata watch. Prana Vata into Manovaha Srotas.\n\nNot insomnia. Unprocessed Tejas rising at night.\nBrahmi 300mg warm milk before sleep 30 days. Bhrumadhya Marma 12 seconds.\n5 min Nadi Shodhana 9:30 PM exactly.\n\nScalar Transmission: 528 Hz 48 hours. Repairing Majja Dhatu.","created_at":ts(b2,11)},
]

L("\n=== INSERTING JUNE 2 FOR ALL USERS ===")
for u in users:
    uid,em=u["id"],u.get("email","?")
    j2=sum(1 for m in by_user.get(uid,[]) if m["created_at"][:10]=="2026-06-02")
    L(f"  {em}: {j2} june2 msgs")
    if j2==0:
        for msg in HIST:
            pl=[{"user_id":uid,"chat_context":"ayurveda","role":msg["role"],"content":msg["content"],"created_at":msg["created_at"]}]
            r=post_row("/rest/v1/user_sync_chat_messages",pl)
            L(f"    {'OK' if r else 'FAIL'} {msg['role']} {msg['created_at'][:16]}")

output="\n".join(log)
r2=subprocess.run(["curl","-s","-H",f"Authorization: Bearer {GH}",
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
d2=json.loads(r2.stdout); sha=d2.get("sha","")
pl2={"message":"db-state v6","content":b64.b64encode(output.encode()).decode()}
if sha: pl2["sha"]=sha
r3=subprocess.run(["curl","-s","-X","PUT",
    "-H",f"Authorization: Bearer {GH}","-H","Content-Type: application/json",
    "-d",json.dumps(pl2),
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
print("OUTPUT:", "WRITTEN" if "content" in json.loads(r3.stdout) else "FAILED")
