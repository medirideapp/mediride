#!/usr/bin/env bash
# MediRide deploy on VPS (run from /opt/mediride after git pull)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "Missing .env — copy from .env.example and set secrets first."
  exit 1
fi

docker compose -f docker-compose.prod.yml pull || true
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo "MediRide stack updated."
docker compose -f docker-compose.prod.yml ps
