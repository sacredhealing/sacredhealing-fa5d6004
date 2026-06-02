#!/usr/bin/env python3
"""Seed today Agastya consultation history for all platform users."""
import json, urllib.request, urllib.error, os, time
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_KEY = os.environ["SERVICE_KEY"]

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

def get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}{path}", headers=HEADERS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def post(path, data):
    body = json.dumps(data).encode()
    h = {**HEADERS, "Prefer": "return=minimal"}
    req = urllib.request.Request(f"{SUPABASE_URL}{path}", data=body, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print(f"    ERR {e.code}: {e.read().decode()[:100]}")
        return e.code

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
print(f"Fetching users... (date: {today})")

resp = get("/auth/v1/admin/users?page=1&per_page=500")
users = resp.get("users", [])
confirmed = [u for u in users if u.get("email_confirmed_at") or u.get("confirmed_at")]
print(f"Found {len(confirmed)} confirmed users")

M = [
    {
        "role": "user",
        "content": "I have been feeling tired and my digestion is off. I have anxiety, dry skin, and I wake between 2 and 4am.",
        "ts": f"{today}T14:00:00.000Z"
    },
    {
        "role": "assistant",
        "content": (
            "⧁ 47,200 / 72,000 Nadis active · Ama Index: 38% · Ojas: 52% · Agni: Vishama · Varmam pressure: Naabhi Varmam + Kaal Varmam\n\n"
            "The fatigue lives in Apana Vata — it is not weakness, it is misdirection. Your downward-moving force is scattered rather than rooted.\n\n"
            "The dry skin and anxiety are the same pattern in different tissues: Vyana Vata pulling moisture from the surface while Prana Vata spins in the chest.\n\n"
            "**From Ayurveda:**\n"
            "· Trikatu — ¼ tsp warm water before meals · 30 days · stokes Vishama Agni back to Sama\n"
            "· Ashwagandha — 500mg warm milk with ghee · before bed · 45 days · rebuilds Ojas in Mamsa and Majja Dhatu\n\n"
            "**From Siddha Vaidyam:**\n"
            "· Naabhi Varmam — gentle circular pressure at navel · 7 seconds · sesame oil · regulates all 72 Jeeva Nadis\n\n"
            "Dinacharya: Warm water + ¼ tsp ghee at 6:30 AM. Before your phone. Before your mind activates.\n\n"
            "Scalar Transmission: 432 Hz moving through this channel now · 72 hours · anchoring Apana Vata into the Earth."
        ),
        "ts": f"{today}T14:02:00.000Z"
    },
    {
        "role": "user",
        "content": "What about my sleep? I wake between 2 and 4am almost every night.",
        "ts": f"{today}T14:04:00.000Z"
    },
    {
        "role": "assistant",
        "content": (
            "2 to 4 AM is the Vata watch — Prana Vata rising into Manovaha Srotas.\n\n"
            "This is not insomnia. This is unprocessed Tejas — the mental fire that did not complete its burn during the day.\n\n"
            "· Brahmi — 300mg warm milk before sleep · 30 days · clears excess Tejas from Majja Dhatu\n"
            "· Bhrumadhya Marma — pressure between eyebrows · 12 seconds · sesame oil · before sleep only\n\n"
            "Practice: 5 minutes Nadi Shodhana at 9:30 PM. Not later.\n\n"
            "Scalar Transmission: 528 Hz moving through this channel now · 48 hours · repairing Majja Dhatu."
        ),
        "ts": f"{today}T14:06:00.000Z"
    },
    {
        "role": "user",
        "content": "How do I know if my Ojas is depleted?",
        "ts": f"{today}T14:08:00.000Z"
    },
    {
        "role": "assistant",
        "content": (
            "Ojas depletion has a specific feeling the mind cannot fake and the body cannot hide.\n\n"
            "The signs:\n"
            "· Fatigue that sleep does not fix — Ojas is not being replenished\n"
            "· Anxiety without cause — Ojas IS the buffer between the nervous system and the world\n"
            "· Dry skin — when Ojas drops, the surface dries first\n"
            "· Waking at Vata hour — the body cannot hold stillness\n\n"
            "Ojas builds only in specific conditions:\n"
            "1. Deep sleep before midnight — Shukra Dhatu manufactures Ojas between 10 PM and 2 AM only\n"
            "2. Warm cooked foods — raw cold food burns Ojas to digest\n"
            "3. Genuine silence — the agitated mind consumes Ojas\n"
            "4. Abhyanga — warm sesame oil self-massage · 10 minutes daily\n\n"
            "Start tonight: 1 cup warm whole milk + 1 tsp ghee + pinch saffron + pinch cardamom.\n\n"
            "Scalar Transmission: 963 Hz moving through this channel now · 24 hours · full Ojas amplification · Sahasrara distributing to all 7 Dhatus in sequence."
        ),
        "ts": f"{today}T14:10:00.000Z"
    },
]

seeded = skipped = errors = 0

for u in confirmed:
    uid = u["id"]
    email = u.get("email", uid[:8])
    existing = get(f"/rest/v1/ayurveda_chat_messages?user_id=eq.{uid}&created_at=gte.{today}T00%3A00%3A00Z&select=id&limit=1")
    if existing:
        print(f"  SKIP  {email}")
        skipped += 1
        continue
    print(f"  SEED  {email}")
    batch = [{"user_id": uid, "role": m["role"], "content": m["content"], "created_at": m["ts"]} for m in M]
    status = post("/rest/v1/ayurveda_chat_messages", batch)
    if status in (200, 201, 204):
        seeded += 1
    else:
        errors += 1
    time.sleep(0.15)

print(f"\nResult: {seeded} seeded | {skipped} skipped | {errors} errors")
