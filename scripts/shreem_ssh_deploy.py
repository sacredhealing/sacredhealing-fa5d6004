#!/usr/bin/env python3
"""shreem_ssh_deploy.py — get FRESH logs after restart"""
import os, paramiko, time

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, err = client.exec_command(cmd)
    o = out.read().decode().strip()
    if o: print(o)
    return o

print("=== PM2 LIST ===")
run("pm2 list")
print("\n=== ECOSYSTEM (redacted) ===")
run("cat /root/shreem-ecosystem.config.js | grep -v KEYPAIR | grep -v PRIVATE_KEY | grep -v SERVICE_ROLE")
print("\n=== FRESH shreem-brzee STATUS ===")
run("pm2 describe shreem-brzee 2>/dev/null | grep -E 'status|uptime|restart|mode|BOT_MODE'")
print("\n=== RECENT shreem-brzee LOGS (last 25 lines since restart) ===")
run("pm2 logs shreem-brzee --lines 25 --nostream 2>/dev/null")
client.close()
