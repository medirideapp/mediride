# NEMT Care — Non-Emergency Medical Transportation Platform

Uber Health / Lyft Healthcare style ride-hailing for non-emergency medical trips: book a ride, live GPS tracking for rider and driver, and mutual confirmation for trip start and stop.

## Stack

| Layer | Choice |
|-------|--------|
| Monorepo | pnpm workspaces + Turborepo |
| Web PWA | Next.js 14 + Tailwind |
| API | NestJS + Socket.IO |
| DB | PostgreSQL + PostGIS |
| ORM | Prisma |
| Auth | JWT + Argon2id |
| Maps | Mapbox GL JS |
| Proxy/TLS | Nginx + Let's Encrypt |
| Secrets | Infisical (optional) / `.env` locally |
| Hosting | Docker Compose on Hetzner / DigitalOcean (~$10–20/mo) |
| Observability | Grafana + Loki + Prometheus + Uptime Kuma |

## Quick start (local)

### Prerequisites

- Node.js 22+
- pnpm 9 (`npm i -g pnpm@9`)
- Docker Desktop (recommended for Postgres+PostGIS + Redis)

### 1. Environment

```bash
cp .env.example .env
# Add a free Mapbox token: https://account.mapbox.com → NEXT_PUBLIC_MAPBOX_TOKEN
```

### 2. Infrastructure

```bash
docker compose up -d postgres redis
```

### 3. Install & migrate

```bash
pnpm install
pnpm --filter @nemt/api prisma:generate
pnpm --filter @nemt/api exec prisma db push
pnpm --filter @nemt/api exec ts-node prisma/seed.ts
```

### 4. Run apps

```bash
pnpm --filter @nemt/api dev
pnpm --filter @nemt/web dev
```

- Web: http://localhost:3000  
- API: http://localhost:3001/health  

### Seed accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nemt.local | Admin123! |
| Rider | rider@nemt.local | Rider123! |
| Driver | driver@nemt.local | Driver123! (pre-approved) |

## Apps

- `/` — marketing landing
- `/rider` — request ride, live map, confirm start/stop
- `/driver` — go online, accept rides, stream GPS, confirm start/stop
- `/admin` — stats, approve drivers, ride list

## Ride state machine

`REQUESTED → ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED` (or `CANCELLED`)

Start/stop require **both** rider and driver confirmation.

## Production deploy (VPS)

1. Point DNS (Cloudflare recommended) to your VPS.
2. Copy repo to `/opt/nemt-platform`.
3. Load secrets via Infisical or a secured `.env` (never commit secrets).
4. Replace `DOMAIN` in `infra/nginx/nginx.prod.conf` and run:

```bash
DOMAIN=rides.example.com EMAIL=ops@example.com bash infra/nginx/init-letsencrypt.sh
docker compose -f docker-compose.prod.yml up -d
```

5. Monitoring: Grafana `:3002`, Uptime Kuma `:3003`.

CI/CD: `.github/workflows/ci-cd.yml` builds, pushes to GHCR, and SSH-deploys.

## Project layout

```
apps/api     NestJS API, Prisma, WebSocket tracking
apps/web     Next.js PWA (rider / driver / admin)
infra/       nginx, postgres init, monitoring, Infisical
```

## License

Private / proprietary unless otherwise stated.
