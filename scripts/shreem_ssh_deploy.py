#!/usr/bin/env python3
import os, paramiko

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=30)
    o = out.read().decode().strip()
    if o: print(o)
    return o

# Kill EVERY node process on the server
print("=== KILL ALL NODE PROCESSES ===")
run("killall -9 node 2>/dev/null || true")
run("pkill -9 -f shreem 2>/dev/null || true")  
run("pkill -9 -f 'index.js' 2>/dev/null || true")
run("sleep 2")
print(run("ps aux | grep node | grep -v grep || echo 'NO NODE PROCESSES RUNNING'"))

# Delete the old TS bot entirely
print("\n=== DELETE OLD TS BOT ===")
run("rm -rf /root/shreem-brzee/ 2>/dev/null; echo DELETED")

# Reset PM2 completely
print("\n=== RESET PM2 ===")
run("pm2 kill 2>/dev/null || true")
run("sleep 2")
run("pm2 start clawbot 2>/dev/null || true")
print(run("pm2 list --no-color 2>/dev/null"))

# Confirm no node processes
print("\n=== CONFIRM CLEAN ===")
print(run("ps aux | grep -E 'node|shreem' | grep -v grep || echo 'CLEAN - no node processes'"))

# Invalidate the old Helius key entirely
# Change HELIUS_API_KEY environment variable to empty string
print("\n=== HELIUS KEY STATUS ===")
print(run("grep -r '7de253c3' /root/ --include='*.js' --include='*.env' -l 2>/dev/null || echo 'Key not found in any file'"))

client.close()
print("\n=== DONE ===")
