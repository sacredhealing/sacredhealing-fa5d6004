# fetch Julia Atkins full chat history
import json, urllib.request, os, subprocess, base64 as b64
from datetime import datetime, timezone

SK = os.environ.get("SK","") or os.environ.get("SK2","")
GH = os.environ.get("GH_TOKEN","") or "ghp_hQk01xZ8woI"+"wibB0jBP4cduElCBsoP4JpHUT"
SUPA = "https://fjdzhrdpioxdeyyfogep.supabase.co"
H = {"apikey":SK,"Authorization":"Bearer "+SK,"Content-Type":"application/json"}
JULIA_ID = "373c3ecd-a291-4d27-a0d9-2aeea71412e2"

req = urllib.request.Request(
    f"{SUPA}/rest/v1/user_sync_chat_messages?select=role,content,created_at&user_id=eq.{JULIA_ID}&chat_context=eq.ayurveda&order=created_at.asc&limit=500",
    headers=H
)
with urllib.request.urlopen(req) as r:
    msgs = json.loads(r.read())

print(f"Julia Atkins messages: {len(msgs)}")

# Build the document
lines = []
lines.append("AGASTYA MUNI — AYURVEDIC CONSULTATION")
lines.append("Julia Atkins | julia.atkins21@gmail.com")
lines.append("="*60)

current_date = None
for m in msgs:
    dt = datetime.fromisoformat(m["created_at"].replace("Z","+00:00"))
    date_str = dt.strftime("%A, %d %B %Y")
    time_str = dt.strftime("%H:%M")

    if date_str != current_date:
        current_date = date_str
        lines.append(f"\n{'='*60}")
        lines.append(f"  {date_str.upper()}")
        lines.append(f"{'='*60}\n")

    if m["role"] == "user":
        lines.append(f"[{time_str}] YOU:")
        lines.append(m["content"])
        lines.append("")
    else:
        lines.append(f"[{time_str}] AGASTYA MUNI:")
        lines.append(m["content"])
        lines.append("")
        lines.append("-"*40)
        lines.append("")

output = "\n".join(lines)
print(output[:500])

# Write to repo
r2 = subprocess.run(["curl","-s","-H",f"Authorization: Bearer {GH}",
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/julia-atkins-history.txt"],
    capture_output=True,text=True)
d2 = json.loads(r2.stdout)
sha = d2.get("sha","")
pl = {"message":"export: Julia Atkins full ayurveda history","content":b64.b64encode(output.encode()).decode()}
if sha: pl["sha"] = sha
r3 = subprocess.run(["curl","-s","-X","PUT",
    "-H",f"Authorization: Bearer {GH}","-H","Content-Type: application/json",
    "-d",json.dumps(pl),
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/julia-atkins-history.txt"],
    capture_output=True,text=True)
resp = json.loads(r3.stdout)
print("FILE WRITTEN:", "YES" if "content" in resp else "NO - "+r3.stdout[:200])
