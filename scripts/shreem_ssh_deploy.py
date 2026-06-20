#!/usr/bin/env python3
"""Check worker status and session"""
import os, paramiko, urllib.request, json

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd)
    o = out.read().decode().strip()
    if o: print(o)
    return o

print("=== PM2 LIST ===")
run("pm2 list")
print("\n=== LIVE WORKER LOGS (last 20) ===")
run("pm2 logs shreem-brzee --lines 20 --nostream 2>/dev/null")
print("\n=== WORKER VERSION ===")
run("head -3 /root/shreem-live-worker.js 2>/dev/null")
print("\n=== HEALTH CHECK ===")
run("curl -sf http://localhost:3001 2>/dev/null || echo 'port 3001 not responding'")
client.close()
