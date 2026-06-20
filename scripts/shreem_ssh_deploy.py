#!/usr/bin/env python3
import os, paramiko, json, re

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

HELIUS = "7de253c3-49e2-42be-9672-23a761260f86"

# Check what's running
print("=== PM2 ===")
print(run("pm2 list --no-color 2>/dev/null | grep -v namespace | grep -v '──'"))

# Check ALL processes making network calls to Helius
print("\n=== PROCESSES CALLING HELIUS ===")
print(run("grep -r 'helius-rpc.com' /root/ --include='*.js' --include='*.ts' -l 2>/dev/null | head -20"))

# Check if any process has an open connection to Helius right now
print("\n=== LIVE CONNECTIONS TO HELIUS ===")
print(run("ss -tnp 2>/dev/null | grep helius || netstat -tnp 2>/dev/null | grep helius || echo 'no live helius connections'"))

# Check for any cron jobs calling Helius
print("\n=== CRON JOBS ===")
print(run("crontab -l 2>/dev/null || echo 'no cron'"))

# Check Helius webhooks - are they really gone?
print("\n=== HELIUS WEBHOOKS ===")
r = run(f'curl -sf "https://api.helius.xyz/v0/webhooks?api-key={HELIUS}"')
print(f"Webhooks: {r[:300]}")

# Check if old TS bot is REALLY gone
print("\n=== SHREEM BOT FILES ===")
print(run("ls /root/shreem-brzee/railway/shreem-brzee-bot/dist/index.js 2>/dev/null && echo EXISTS || echo MISSING"))
print(run("cat /root/shreem-brzee/railway/shreem-brzee-bot/dist/index.js 2>/dev/null | grep -i helius | head -5"))

# Check for any node processes
print("\n=== ALL NODE PROCESSES ===")
print(run("ps aux | grep node | grep -v grep"))

client.close()
