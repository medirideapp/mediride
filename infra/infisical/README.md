# Infisical secrets management
#
# Local development: use the root `.env` file (copied from `.env.example`).
# Production: load secrets from Infisical at deploy/boot instead of baking `.env` into images.
#
# Option A — Infisical Cloud (free tier): https://app.infisical.com
# Option B — Self-host Infisical via Docker (see docker-compose.infisical.yml)
#
# Required secret keys (same names as .env.example):
#   DATABASE_URL
#   REDIS_URL
#   JWT_SECRET
#   JWT_EXPIRES_IN
#   API_PORT
#   CORS_ORIGIN
#   NEXT_PUBLIC_API_URL
#   NEXT_PUBLIC_WS_URL
#   NEXT_PUBLIC_MAPBOX_TOKEN
#   POSTGRES_PASSWORD
#   GRAFANA_ADMIN_PASSWORD
#
# Inject into the VPS before starting compose:
#   export INFISICAL_TOKEN=...
#   infisical export --env=prod --format=dotenv > .env
#   docker compose -f docker-compose.prod.yml up -d
#
# Or use the Infisical CLI agent / GitHub Action to inject into CI/CD.
