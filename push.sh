#!/bin/bash
# Sacred Healing — one-command deploy
# Usage: ./push.sh "fix: description of change"
git add .
git commit -m "${1:-update: deploy}"
git push origin main
echo "✅ Deployed to GitHub — Lovable syncing now"
