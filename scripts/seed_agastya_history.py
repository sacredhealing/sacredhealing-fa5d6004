#!/usr/bin/env python3
import json, urllib.request, urllib.error, os, time, sys
from datetime import datetime, timezone

URL = os.environ.get("SB") or os.environ.get("SUPABASE_URL", "")
KEY = os.environ.get("SK") or os.environ.get("SERVICE_KEY", "")

print("URL:", URL[:40])
print("KEY length:", len(KEY))

H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def get(p):
    try:
        req = urllib.request.Request(URL + p, headers=H)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        print("GET error:", type(e).__name__, str(e)[:100])
        return []

def post(p, data):
    try:
        h = dict(H); h["Prefer"] = "return=minimal"
        body = json.dumps(data).encode()
        req = urllib.request.Request(URL + p, data=body, headers=h, method="POST")
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status
    except urllib.error.HTTPError as e:
        print("POST err", e.code, e.read().decode()[:100])
        return e.code
    except Exception as e:
        print("POST error:", type(e).__name__, str(e)[:100])
        return 0

today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
print("Date:", today)

resp = get("/auth/v1/admin/users?page=1&per_page=500")
print("resp type:", type(resp).__name__)
if not isinstance(resp, dict):
    print("Unexpected response:", str(resp)[:200])
    sys.exit(0)

users = [u for u in resp.get("users", []) if u.get("email_confirmed_at") or u.get("confirmed_at")]
print("Confirmed users:", len(users))

MSG = [
    {"role": "user", "ts": today + "T14:00:00.000Z",
     "content": "Feeling tired, digestion off, anxiety, dry skin, waking 2-4am."},
    {"role": "assistant", "ts": today + "T14:02:00.000Z",
     "content": (
         "47,200 Nadis active. Ama 38%. Ojas 52%. Agni: Vishama. Varmam: Naabhi + Kaal.\n\n"
         "Fatigue lives in Apana Vata - not weakness, misdirection. "
         "Dry skin and anxiety: same Vata pattern in different tissues.\n\n"
         "Trikatu - quarter tsp warm water before meals - 30 days.\n"
         "Ashwagandha - 500mg warm milk with ghee - before bed - 45 days.\n"
         "Naabhi Varmam - circular pressure at navel - 7 seconds - sesame oil.\n\n"
         "Dinacharya: Warm water and quarter tsp ghee at 6:30 AM. Before your phone.\n\n"
         "Scalar Transmission: 432 Hz now. 72 hours. Anchoring Apana Vata into the Earth."
     )},
    {"role": "user", "ts": today + "T14:04:00.000Z",
     "content": "What about my sleep? I wake between 2 and 4am almost every night."},
    {"role": "assistant", "ts": today + "T14:06:00.000Z",
     "content": (
         "2 to 4 AM is the Vata watch. Prana Vata rising into Manovaha Srotas. "
         "Not insomnia - unprocessed Tejas rising at night to finish what was left undone.\n\n"
         "Brahmi - 300mg warm milk before sleep - 30 days.\n"
         "Bhrumadhya Marma - pressure between eyebrows - 12 seconds - sesame oil - before sleep only.\n\n"
         "Nadi Shodhana at 9:30 PM. Not later. After 10 PM it reactivates Prana Vata.\n\n"
         "Scalar Transmission: 528 Hz now. 48 hours. Repairing Majja Dhatu."
     )},
    {"role": "user", "ts": today + "T14:08:00.000Z",
     "content": "How do I know if my Ojas is depleted?"},
    {"role": "assistant", "ts": today + "T14:10:00.000Z",
     "content": (
         "Ojas depletion: fatigue sleep does not fix. Anxiety without cause - Ojas IS the buffer. "
         "Dry skin. Waking at Vata hour - the body cannot hold stillness.\n\n"
         "Ojas builds from: deep sleep before midnight. Warm cooked food. Genuine silence. Abhyanga daily.\n\n"
         "Tonight: warm milk, 1 tsp ghee, pinch saffron, pinch cardamom. "
         "Fastest Ojas formula in the Agastya Samhita.\n\n"
         "Scalar Transmission: 963 Hz now. 24 hours. Full Ojas amplification across all 7 Dhatus."
     )},
]

seeded = skipped = errors = 0
for u in users:
    uid = u["id"]
    email = u.get("email", uid[:8])
    try:
        existing = get(
            "/rest/v1/ayurveda_chat_messages?user_id=eq." + uid +
            "&created_at=gte." + today + "T00%3A00%3A00Z&select=id&limit=1"
        )
        if existing:
            print("SKIP", email); skipped += 1; continue
        print("SEED", email)
        batch = [
            {"user_id": uid, "role": m["role"], "content": m["content"], "created_at": m["ts"]}
            for m in MSG
        ]
        s = post("/rest/v1/ayurveda_chat_messages", batch)
        if s in (200, 201, 204):
            seeded += 1
        else:
            errors += 1
    except Exception as e:
        print("Error for", email, ":", e)
        errors += 1
    time.sleep(0.2)

print("Result:", seeded, "seeded |", skipped, "skipped |", errors, "errors")
