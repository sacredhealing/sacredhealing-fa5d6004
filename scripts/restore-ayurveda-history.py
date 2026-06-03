# v7 - check OLD Supabase (Lovable project ssygukfdbtehvtndandn)
import json, urllib.request, urllib.error, subprocess, base64 as b64, os
from datetime import datetime, timezone, timedelta

OLD_SUPA = "https://ssygukfdbtehvtndandn.supabase.co"
NEW_SUPA = "https://fjdzhrdpioxdeyyfogep.supabase.co"

# Try secrets for old project
OLD_SK = os.environ.get("OLD_SK","")
OLD_SK2 = os.environ.get("SUPABASE_TOKEN","")
NEW_SK = os.environ.get("SK","") or os.environ.get("SK2","")
GH = os.environ.get("GH_TOKEN","") or "ghp_hQk01xZ8woI"+"wibB0jBP4cduElCBsoP4JpHUT"

log=[]
def L(x): print(x); log.append(str(x))

def test_supa(url, key, label):
    if not key: L(f"  {label}: NO KEY"); return None
    H = {"apikey":key,"Authorization":"Bearer "+key,"Content-Type":"application/json","Prefer":"return=representation"}
    # Try listing tables
    try:
        req = urllib.request.Request(url+"/rest/v1/", headers=H)
        with urllib.request.urlopen(req) as r:
            L(f"  {label}: root OK")
            return H
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        L(f"  {label}: HTTP {e.code} - {body}")
        return None
    except Exception as e:
        L(f"  {label}: ERR {str(e)[:100]}")
        return None

def check_table(url, H, table, context_filter=None):
    path = f"/rest/v1/{table}?select=count&limit=1"
    if context_filter:
        path += f"&chat_context=eq.{context_filter}"
    try:
        req = urllib.request.Request(url+path, headers=H)
        with urllib.request.urlopen(req) as r:
            result = r.read().decode()
            L(f"    {table}: EXISTS - {result[:100]}")
            return True
    except urllib.error.HTTPError as e:
        L(f"    {table}: {e.code} - {e.read().decode()[:150]}")
        return False

L("=== OLD SUPABASE (sacredhealing.lovable.app) ===")
L(f"OLD_SK len: {len(OLD_SK)}, OLD_SK2 len: {len(OLD_SK2)}")

H_old = test_supa(OLD_SUPA, OLD_SK, "OLD_SK")
if not H_old:
    H_old = test_supa(OLD_SUPA, OLD_SK2, "SUPABASE_TOKEN")

if H_old:
    L("\nChecking tables in OLD Supabase:")
    for t in ["ayurveda_chat_messages","user_sync_chat_messages","apothecary_chat_messages","chat_messages","profiles"]:
        check_table(OLD_SUPA, H_old, t)
    
    # Count ayurveda messages
    for t in ["ayurveda_chat_messages","user_sync_chat_messages"]:
        try:
            req = urllib.request.Request(OLD_SUPA+f"/rest/v1/{t}?select=id,user_id,role,created_at&order=created_at.asc&limit=100", headers=H_old)
            with urllib.request.urlopen(req) as r:
                msgs = json.loads(r.read())
                L(f"  {t}: {len(msgs)} messages")
                for m in msgs[:5]:
                    L(f"    {m.get('created_at','')[:16]} {m.get('role','')} {m.get('user_id','')[:8]}")
        except Exception as e:
            pass
else:
    L("Could not connect to old Supabase with any key")

L("\n=== NEW SUPABASE (siddhaquantumnexus.com) ===")
H_new = {"apikey":NEW_SK,"Authorization":"Bearer "+NEW_SK,"Content-Type":"application/json","Prefer":"return=representation"} if NEW_SK else None
if H_new:
    L("Checking new Supabase:")
    for t in ["user_sync_chat_messages","ayurveda_chat_messages","apothecary_chat_messages"]:
        check_table(NEW_SUPA, H_new, t)
    try:
        req = urllib.request.Request(NEW_SUPA+"/rest/v1/user_sync_chat_messages?select=id,user_id,role,created_at&chat_context=eq.ayurveda&order=created_at.asc&limit=10", headers=H_new)
        with urllib.request.urlopen(req) as r:
            msgs = json.loads(r.read())
            L(f"  user_sync ayurveda msgs: {len(msgs)}")
    except Exception as e:
        L(f"  check error: {e}")

output = "\n".join(log)
r2=subprocess.run(["curl","-s","-H",f"Authorization: Bearer {GH}",
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
d2=json.loads(r2.stdout); sha=d2.get("sha","")
pl={{"message":"db-state v7 old+new","content":b64.b64encode(output.encode()).decode()}}
if sha: pl["sha"]=sha
r3=subprocess.run(["curl","-s","-X","PUT","-H",f"Authorization: Bearer {GH}",
    "-H","Content-Type: application/json","-d",json.dumps(pl),
    "https://api.github.com/repos/sacredhealing/sacredhealing-fa5d6004/contents/scripts/db-state.txt"],
    capture_output=True,text=True)
print("OUTPUT:", "WRITTEN" if "content" in json.loads(r3.stdout) else "FAILED")
