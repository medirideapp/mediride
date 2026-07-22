#!/usr/bin/env bash
# MediRide first-time VPS bootstrap (Ubuntu 24.04)
# Run as root on a fresh Hetzner/DigitalOcean droplet.
set -euo pipefail

apt-get update -y
apt-get install -y ca-certificates curl git ufw

# Docker
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

# Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /opt/mediride
echo "Clone your repo into /opt/mediride, copy .env, then run scripts/vps-deploy.sh"
echo "Done. Docker version: $(docker --version)"
