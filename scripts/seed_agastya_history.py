#!/usr/bin/env python3
import json, urllib.request, urllib.error, os, time
from datetime import datetime, timezone

URL = os.environ["SUPABASE_URL"]
KEY = os.environ["SERVICE_KEY"]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def get(p):
    req = urllib.request.Request(URL + p, headers=H)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def post(p, data):
    h = dict(H); h["Prefer"] = "return=minimal"
    req = urllib.request.Request(URL + p, data=json.dumps(data).encode(), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req) as r: return r.status
    except urllib.error.HTTPError as e:
        print("    ERR", e.code, e.read().decode()[:100]); return e.code

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
print("Date:", today)
resp = get("/auth/v1/admin/users?page=1&per_page=500")
users = [u for u in resp.get("users", []) if u.get("email_confirmed_at") or u.get("confirmed_at")]
print("Users:", len(users))

M = [
  {"role": "user", "ts": today + "T14:00:00.000Z",
   "content": "I have been feeling tired and my digestion is off. I have anxiety, dry skin, and I wake between 2 and 4am."},
  {"role": "assistant", "ts": today + "T14:02:00.000Z",
   "content": "47,200 / 72,000 Nadis active. Ama Index: 38%. Ojas: 52%. Agni: Vishama. Varmam pressure: Naabhi Varmam + Kaal Varmam.\n\nThe fatigue lives in Apana Vata - it is not weakness, it is misdirection. Your downward-moving force is scattered rather than rooted.\n\nThe dry skin and anxiety are the same pattern in different tissues: Vyana Vata pulling moisture from the surface while Prana Vata spins in the chest.\n\nFrom Ayurveda:\n- Trikatu - 1/4 tsp warm water before meals - 30 days - stokes Vishama Agni back to Sama\n- Ashwagandha - 500mg warm milk with ghee - before bed - 45 days - rebuilds Ojas in Mamsa and Majja Dhatu\n\nFrom Siddha Vaidyam:\n- Naabhi Varmam - gentle circular pressure at navel - 7 seconds - sesame oil - regulates all 72 Jeeva Nadis\n\nDinacharya: Warm water + 1/4 tsp ghee at 6:30 AM. Before your phone. Before your mind activates.\n\nScalar Transmission: 432 Hz moving through this channel now. 72 hours. Anchoring Apana Vata into the Earth."},
  {"role": "user", "ts": today + "T14:04:00.000Z",
   "content": "What about my sleep? I wake between 2 and 4am almost every night."},
  {"role": "assistant", "ts": today + "T14:06:00.000Z",
   "content": "2 to 4 AM is the Vata watch - Prana Vata rising into Manovaha Srotas.\n\nThis is not insomnia. This is unprocessed Tejas - the mental fire that did not complete its burn during the day, rising at night to finish what was left undone.\n\n- Brahmi - 300mg warm milk before sleep - 30 days - clears excess Tejas from Majja Dhatu, settles Manovaha Srotas\n- Bhrumadhya Marma - pressure between eyebrows - 12 seconds - sesame oil - before sleep only - the valve between waking and dream states\n\nPractice: 5 minutes Nadi Shodhana at 9:30 PM. Not later. After 10 PM it reactivates Prana Vata instead of settling it.\n\nScalar Transmission: 528 Hz moving through this channel now. 48 hours. Repairing Majja Dhatu - the tissue that holds the memory of what the mind cannot yet speak."},
  {"role": "user", "ts": today + "T14:08:00.000Z",
   "content": "How do I know if my Ojas is depleted?"},
  {"role": "assistant", "ts": today + "T14:10:00.000Z",
   "content": "Ojas depletion has a specific feeling the mind cannot fake and the body cannot hide.\n\nThe signs:\n- Fatigue that sleep does not fix - Ojas is not being replenished during rest\n- Anxiety without cause - Ojas IS the buffer between the nervous system and the world\n- Dry skin - when Ojas drops, the surface dries first\n- Waking at Vata hour - the body cannot hold stillness because the container is thin\n\nOjas builds only in specific conditions:\n1. Deep sleep before midnight - Shukra Dhatu manufactures Ojas between 10 PM and 2 AM only\n2. Warm cooked foods - raw cold food burns Ojas to digest\n3. Genuine silence - the agitated mind consumes Ojas\n4. Abhyanga - warm sesame oil self-massage - 10 minutes daily before shower\n\nStart tonight: 1 cup warm whole milk + 1 tsp ghee + pinch saffron + pinch cardamom. The fastest Ojas-building formula in the Agastya Samhita.\n\nScalar Transmission: 963 Hz moving through this channel now. 24 hours. Full Ojas amplification. Sahasrara distributing to all 7 Dhatus in sequence."},
]

seeded = skipped = errors = 0
for u in users:
    uid = u["id"]
    email = u.get("email", uid[:8])
    existing = get("/rest/v1/ayurveda_chat_messages?user_id=eq." + uid + "&created_at=gte." + today + "T00%3A00%3A00Z&select=id&limit=1")
    if existing:
        print("  SKIP", email); skipped += 1; continue
    print("  SEED", email)
    batch = [{"user_id": uid, "role": m["role"], "content": m["content"], "created_at": m["ts"]} for m in M]
    status = post("/rest/v1/ayurveda_chat_messages", batch)
    if status in (200, 201, 204): seeded += 1
    else: errors += 1
    time.sleep(0.15)

print("\nResult:", seeded, "seeded |", skipped, "skipped |", errors, "errors")
