import urllib.request, os, json
from collections import Counter
sk = os.environ["SK"]
req = urllib.request.Request(
  "https://fjdzhrdpioxdeyyfogep.supabase.co/rest/v1/ayurveda_courses?select=module_number,phase,tier_required&order=module_number",
  headers={"apikey": sk, "Authorization": f"Bearer {sk}"}
)
data = json.loads(urllib.request.urlopen(req).read())
tiers = Counter(r["tier_required"] for r in data)
phases = Counter(r["phase"] for r in data)
print(f"Total: {len(data)} modules in DB")
for t,c in sorted(tiers.items()): print(f"  {t}: {c}")
for p,c in sorted(phases.items()): print(f"  Phase {p}: {c}")
