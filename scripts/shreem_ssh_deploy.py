#!/usr/bin/env python3
import os, paramiko

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

print("=== ALL RUNNING PROCESSES ===")
print(run("ps aux --no-header | grep -v grep | grep -v sshd | grep -v systemd | grep -v bash | grep -v ps"))

print("\n=== ALL NODE PROCESSES ===")
print(run("ps aux | grep node | grep -v grep || echo NONE"))

print("\n=== PM2 LIST ===")
print(run("pm2 list --no-color 2>/dev/null"))

print("\n=== ALL FILES WITH HELIUS KEY ON SERVER ===")
print(run("grep -r '6db37a31' /root/ 2>/dev/null | grep -v '.git' | head -20 || echo NOT FOUND"))
print(run("grep -r 'helius-rpc.com' /root/ 2>/dev/null | grep -v '.git' | grep -v 'node_modules' | head -20"))

print("\n=== NETWORK CONNECTIONS TO HELIUS ===")
print(run("ss -tnp 2>/dev/null | grep helius || echo NONE"))
print(run("netstat -tnp 2>/dev/null | grep helius || echo NONE"))

print("\n=== CRONTAB ===")
print(run("crontab -l 2>/dev/null || echo NONE"))

print("\n=== SYSTEMD SERVICES ===")
print(run("systemctl list-units --type=service --state=running 2>/dev/null | grep -v systemd | head -20"))

client.close()
