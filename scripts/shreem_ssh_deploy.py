#!/usr/bin/env python3
"""shreem_ssh_deploy.py — PM2 status + shreem-live log check"""
import os, paramiko

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, err = client.exec_command(cmd)
    o = out.read().decode().strip()
    e = err.read().decode().strip()
    if o: print(o)
    if e and "deprecated" not in e.lower(): print("ERR:", e[:200])
    return o

print("=== PM2 LIST ===")
run("pm2 list")
print("\n=== SHREEM-LIVE LOGS (last 40) ===")
run("pm2 logs shreem-live --lines 40 --nostream 2>/dev/null || echo 'shreem-live not running'")
print("\n=== SHREEM-BRZEE LOGS (last 10) ===")
run("pm2 logs shreem-brzee --lines 10 --nostream 2>/dev/null || echo 'shreem-brzee not running'")
print("\n=== ECOSYSTEM FILE ===")
run("cat /root/shreem-ecosystem.config.js 2>/dev/null | grep -v KEYPAIR | grep -v PRIVATE | head -20")
print("\n=== WORKER FILE VERSION ===")
run("head -3 /root/shreem-live-worker.js 2>/dev/null || echo 'worker not found'")
print("\n=== HEALTH CHECK ===")
run("curl -sf http://localhost:3001 2>/dev/null || echo 'port 3001 not responding'")
client.close()
print("=== STATUS COMPLETE ===")
