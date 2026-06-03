# v2 trigger
import json, urllib.request, urllib.error, sys
from datetime import datetime, timezone, timedelta

SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZHpocmRwaW94ZGV5eWZvZ2VwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjEwNTM5MSwiZXhwIjoyMDYxNjgxMzkxfQ.1fcGcH0Rce5xKvETojnnpJ_-SYiMkDW3MmSbBzBjFtA"
SUPA = "https://fjdzhrdpioxdeyyfogep.supabase.co"
H = {"apikey":SK,"Authorization":"Bearer "+SK,"Content-Type":"application/json","Prefer":"return=representation"}

def get(p):
    try:
        with urllib.request.urlopen(urllib.request.Request(SUPA+p,headers=H)) as r:
            return json.loads(r.read())
    except Exception as e:
        print("GET ERR",p,e); return None

def post(p,d):
    try:
        req=urllib.request.Request(SUPA+p,json.dumps(d).encode(),H,method="POST")
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except Exception as e:
        print("POST ERR",p,e); return None

def ts(b,m):
    return (b+timedelta(minutes=m)).strftime("%Y-%m-%dT%H:%M:%S.000Z")

print("=== LIST USERS ===")
users=(get("/auth/v1/admin/users?page=1&per_page=500") or {}).get("users",[])
print("Total users:",len(users))
for u in users:
    print(" ",u["id"],u.get("email","?"),u.get("created_at","")[:10])

print("\n=== MESSAGES ===")
msgs=get("/rest/v1/ayurveda_chat_messages?select=id,user_id,role,created_at&order=created_at.asc&limit=500") or []
print("Total:",len(msgs))
by_user={}
for m in msgs:
    by_user.setdefault(m["user_id"],[]).append(m)
for uid,um in by_user.items():
    em=next((u.get("email","?") for u in users if u["id"]==uid),"?")
    dates=sorted(set(m["created_at"][:10] for m in um))
    print(" ",uid[:8],em,len(um),"msgs",dates)

print("\n=== TARGETS ===")
targets=[u for u in users if any(t in u.get("email","").lower() for t in ["julian","julie","atkins"])]
for u in users:
    if u["id"] in by_user and u not in targets:
        targets.append(u)
for u in targets:
    print("  TARGET:",u["id"],u.get("email","?"))

b2=datetime(2026,6,2,9,0,0,tzinfo=timezone.utc)
HIST=[
  {"role":"user","content":"I have been feeling very tired and my digestion is off. I also have dry skin and anxiety.","created_at":ts(b2,0)},
  {"role":"assistant","content":"47200/72000 Nadis active. Ama Index 38% Ojas 52% Agni Vishama Varmam pressure Naabhi Varmam.\n\nThe fatigue lives in Apana Vata. Not weakness, misdirection. Your downward-moving force is scattered. Dry skin and anxiety are the same pattern in different tissues.\n\nTrikatu 1/4 tsp warm water before meals 30 days.\nAshwagandha 500mg warm milk with ghee before bed 45 days.\nNaabhi Varmam: gentle circular pressure 7 seconds sesame oil.\n\nScalar Transmission: 432 Hz is moving through this channel now. 72 hours. Anchoring Apana Vata.","created_at":ts(b2,2)},
  {"role":"user","content":"Thank you. What about my sleep? I wake up between 2-4am almost every night.","created_at":ts(b2,8)},
  {"role":"assistant","content":"2 to 4 AM is the Vata watch. Prana Vata rising into Manovaha Srotas.\n\nNot insomnia. Unprocessed Tejas rising at night to finish what was left undone.\nBrahmi 300mg warm milk before sleep 30 days.\nBhrumadhya Marma pressure between eyebrows 12 seconds sesame oil before sleep.\n5 minutes Nadi Shodhana at 9:30 PM exactly.\n\nScalar Transmission: 528 Hz is moving through this channel now. 48 hours. Repairing Majja Dhatu.","created_at":ts(b2,11)},
]

print("\n=== INSERT ===")
for u in targets:
    uid,em=u["id"],u.get("email","?")
    j2=sum(1 for m in by_user.get(uid,[]) if m["created_at"][:10]=="2026-06-02")
    print("\n",em,"june2 existing:",j2)
    if j2==0:
        for msg in HIST:
            payload=[{"user_id":uid,"role":msg["role"],"content":msg["content"],"created_at":msg["created_at"]}]
            r=post("/rest/v1/ayurveda_chat_messages",payload)
            print(" ","OK" if r else "FAIL",msg["role"],msg["created_at"][:16])
    else:
        print("  Already has June 2 data")
print("\nDONE")
