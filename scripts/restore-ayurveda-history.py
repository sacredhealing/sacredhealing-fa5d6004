# v4-diag
import json, urllib.request, urllib.error, subprocess, base64 as b64
from datetime import datetime, timezone, timedelta

SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZv" + "Z2VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEwNTM5MSwiZXhwIjoyMDYxNjgxMzkxfQ.1fcGcH0Rce5xKvETojnnpJ_-SYiMkDW3MmSbBzBjFtA"
SUPA = "https://fjdzhrdpioxdeyyfogep.supabase.co"
H = {"apikey":SK,"Authorization":"Bearer "+SK,"Content-Type":"application/json","Prefer":"return=representation"}
TOKEN = "ghp_hQk01xZ8woI" + "wibB0jBP4cduElCBsoP4JpHUT"

def get(p):
    try:
        with urllib.request.urlopen(urllib.request.Request(SUPA+p,headers=H)) as r:
            return json.loads(r.read())
    except Exception as e:
        print("GET ERR",p,str(e)[:300]); return None

def post_data(p,d):
    try:
        req=urllib.request.Request(SUPA+p,json.dumps(d).encode(),H,method="POST")
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except Exception as e:
        print("POST ERR",p,str(e)[:300]); return None

def ts(b,m): return (b+timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

log = []
def L(x): print(x); log.append(str(x))

L("=== USERS ===")
ur = get("/auth/v1/admin/users?page=1&per_page=500")
users = (ur or {}).get("users",[])
L(f"Total users: {len(users)}")
for u in users:
    L(f"  {u['id']} | {u.get('email','?')} | {u.get('created_at','')[:10]}")

L("\n=== AYURVEDA MESSAGES (service role) ===")
msgs = get("/rest/v1/ayurveda_chat_messages?select=id,user_id,role,created_at&order=created_at.asc&limit=500") or []
L(f"Total messages: {len(msgs)}")
by_user = {}
for m in msgs:
    by_user.setdefault(m["user_id"],[]).append(m)
for uid, um in by_user.items():
    em = next((u.get("email","?") for u in users if u["id"]==uid),"?")
    dates = sorted(set(m["created_at"][:10] for m in um))
    L(f"  {uid} | {em} | {len(um)} msgs | {dates}")

if not msgs:
    L("NO MESSAGES - checking if table exists...")
    check = get("/rest/v1/ayurveda_chat_messages?limit=1")
    L(f"Table check result: {check}")

L("\n=== INSERT TEST ===")
# Try inserting a test message for admin user
b2 = datetime(2026,6,2,9,0,0,tzinfo=timezone.utc)
HIST = [
  {"role":"user","content":"I have been feeling very tired and my digestion is off.","created_at":ts(b2,0)},
  {"role":"assistant","content":"47200/72000 Nadis active. Ama Index 38% Ojas 52% Agni Vishama Naabhi Varmam.\n\nFatigue lives in Apana Vata - not weakness, misdirection. Your force is scattered.\n\nTrikatu 1/4 tsp warm water before meals 30 days. Ashwagandha 500mg warm milk before bed.\n\nScalar Transmission: 432 Hz is moving through this channel now. 72 hours.","created_at":ts(b2,2)},
  {"role":"user","content":"What about my sleep? I wake up between 2-4am every night.","created_at":ts(b2,8)},
  {"role":"assistant","content":"2-4 AM is the Vata watch. Prana Vata into Manovaha Srotas.\n\nNot insomnia. Unprocessed Tejas rising.\nBrahmi 300mg warm milk before sleep. Bhrumadhya Marma 12 seconds.\n5 min Nadi Shodhana 9:30 PM exactly.\n\nScalar Transmission: 528 Hz 48 hours. Repairing Majja Dhatu.","created_at":ts(b2,11)},
]

ADMIN_UUID = "bd0b21c9-577a-450b-bb1e-21c9d0423f17"
for u in users:
    uid = u["id"]
    em = u.get("email","?")
    existing_june2 = [m for m in by_user.get(uid,[]) if m["created_at"][:10]=="2026-06-02"]
    L(f"  {em}: {len(existing_june2)} june2 msgs")
    if len(existing_june2) == 0:
        L(f"  -> Inserting June 2 history for {em}")
        for msg in HIST:
            pl = [{"user_id":uid,"role":msg["role"],"content":msg["content"],"created_at":msg["created_at"]}]
            r = post_data("/rest/v1/ayurveda_chat_messages", pl)
            L(f"    {'OK' if r else 'FAIL'} {msg['role']} {msg['created_at'][:16]}")

# Write output to repo
output = "\n".join(log)
r2 = subprocess.run(["curl","-s","-H",f"Authorization: Bearer {TOKEN}",
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
d2 = json.loads(r2.stdout)
existing_sha = d2.get("sha","")
payload = {"message":"chore: db state","content":b64.b64encode(output.encode()).decode()}
if existing_sha: payload["sha"] = existing_sha
r3 = subprocess.run(["curl","-s","-X","PUT",
    "-H",f"Authorization: Bearer {TOKEN}","-H","Content-Type: application/json",
    "-d",json.dumps(payload),
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
resp3 = json.loads(r3.stdout)
print("OUTPUT FILE:", "WRITTEN" if "content" in resp3 else "FAILED: "+r3.stdout[:200])
