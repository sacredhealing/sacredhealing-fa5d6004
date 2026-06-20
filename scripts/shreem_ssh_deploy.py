#!/usr/bin/env python3
import os, paramiko

HP = os.environ["HP"]
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("178.105.183.74", username="root", password=HP, timeout=30)

def run(cmd):
    _, out, _ = client.exec_command(cmd, timeout=20)
    return out.read().decode().strip()

print("=== BEFORE: ALL NODE PROCESSES ===")
print(run("ps aux | grep node | grep -v grep"))

print("\n=== KILL ALL NODE PROCESSES ===")
print(run("killall -9 node 2>/dev/null; sleep 1; echo DONE"))

print("\n=== AFTER: ALL NODE PROCESSES ===")
print(run("ps aux | grep node | grep -v grep || echo NONE - ALL KILLED"))

print("\n=== DELETE OLD BOT FILES ===")
print(run("rm -rf /root/shreem-brzee 2>/dev/null; echo DELETED"))
print(run("rm -rf /root/shreem-live-worker.js 2>/dev/null; echo DELETED"))

print("\n=== CLEAR PM2 COMPLETELY ===")
print(run("pm2 kill 2>/dev/null; sleep 2; pm2 start clawbot 2>/dev/null; pm2 save --force 2>/dev/null; echo DONE"))

print("\n=== PM2 FINAL STATE ===")
print(run("pm2 list --no-color 2>/dev/null"))

print("\n=== CONFIRM NO NODE PROCESSES ===")
print(run("ps aux | grep node | grep -v grep || echo CLEAN"))

client.close()
print("\n=== OLD BOT PERMANENTLY DEAD ===")
