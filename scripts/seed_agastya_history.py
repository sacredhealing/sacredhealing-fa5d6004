#!/usr/bin/env python3
import json, urllib.request, urllib.error, os, time
from datetime import datetime, timezone

URL = os.environ.get("SB", os.environ.get("SUPABASE_URL", ""))
KEY = os.environ.get("SK", os.environ.get("SERVICE_KEY", ""))
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def get(p):
    req = urllib.request.Request(URL + p, headers=H)
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read())
    except Exception as e:
        print("GET error:", e); return []

def post(p, data):
    h = dict(H); h["Prefer"] = "return=minimal"
    req = urllib.request.Request(URL + p, data=json.dumps(data).encode(), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req) as r: return r.status
    except urllib.error.HTTPError as e:
        print("POST err", e.code, e.read().decode()[:100]); return e.code

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
print("Date:", today, "URL:", URL[:40])

resp = get("/auth/v1/admin/users?page=1&per_page=500")
if isinstance(resp, list):
    print("ERROR: got list not dict:", resp[:2]); exit(1)
users = [u for u in resp.get("users", []) if u.get("email_confirmed_at") or u.get("confirmed_at")]
print("Confirmed users:", len(users))

MSG = [
    {"role": "user", "ts": today + "T14:00:00.000Z",
     "content": "I have been feeling tired and my digestion is off. Anxiety, dry skin, waking 2-4am."},
    {"role": "assistant", "ts": today + "T14:02:00.000Z",
     "content": "47,200 Nadis active. Ama 38%. Ojas 52%. Agni: Vishama. Varmam: Naabhi + Kaal.\n\nFatigue lives in Apana Vata - not weakness, misdirection. Dry skin and anxiety same pattern different tissues.\n\nTrikatu - quarter tsp warm water before meals - 30 days. Ashwagandha - 500mg warm milk with ghee - before bed - 45 days.\n\nNaabhi Varmam - circular pressure at navel - 7 seconds - sesame oil.\n\nScalar Transmission: 432 Hz now. 72 hours. Anchoring Apana Vata."},
    {"role": "user", "ts": today + "T14:04:00.000Z",
     "content": "What about my sleep? I wake between 2 and 4am almost every night."},
    {"role": "assistant", "ts": today + "T14:06:00.000Z",
     "content": "2 to 4 AM is the Vata watch. Prana Vata rising into Manovaha Srotas. Not insomnia - unprocessed Tejas.\n\nBrahmi - 300mg warm milk before sleep - 30 days. Bhrumadhya Marma - pressure between eyebrows - 12 seconds - sesame oil - before sleep only.\n\nNadi Shodhana at 9:30 PM. Not later.\n\nScalar Transmission: 528 Hz now. 48 hours. Repairing Majja Dhatu."},
    {"role": "user", "ts": today + "T14:08:00.000Z",
     "content": "How do I know if my Ojas is depleted?"},
    {"role": "assistant", "ts": today + "T14:10:00.000Z",
     "content": "Ojas depletion: fatigue sleep does not fix. Anxiety without cause - Ojas is the buffer. Dry skin. Waking at Vata hour.\n\nOjas builds from: deep sleep before midnight. Warm cooked food. Genuine silence. Abhyanga daily.\n\nTonight: warm milk + 1 tsp ghee + saffron + cardamom. Fastest Ojas formula in Agastya Samhita.\n\nScalar Transmission: 963 Hz now. 24 hours. Full Ojas amplification across all 7 Dhatus."},
]

seeded = skipped = errors = 0
for u in users:
    uid = u["id"]
    email = u.get("email", uid[:8])
    existing = get("/rest/v1/ayurveda_chat_messages?user_id=eq." + uid + "&created_at=gte." + today + "T00%3A00%3A00Z&select=id&limit=1")
    if existing:
        print("SKIP", email); skipped += 1; continue
    print("SEED", email)
    batch = [{"user_id": uid, "role": m["role"], "content": m["content"], "created_at": m["ts"]} for m in MSG]
    s = post("/rest/v1/ayurveda_chat_messages", batch)
    if s in (200, 201, 204): seeded += 1
    else: errors += 1
    time.sleep(0.15)

print("Result:", seeded, "seeded |", skipped, "skipped |", errors, "errors")
