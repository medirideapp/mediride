# MediRide — Implementation Task Document

**Repository:** https://github.com/medirideapp/mediride  
**Local path:** `C:\Users\USER\Projects\nemt-platform`  
**Reference products:** [Lyft Healthcare](https://www.lyft.com/healthcare#products), Uber Health, GoGoGrandparent, MedTrans Go  

This document lists **every task** with:
- Task number
- Objective (what we want)
- Reason (why)
- Functions / files (what code does it)
- Expected output (what you should see)
- Status (complete → then next)

---

## How to use this document

1. Read **Task N**.
2. Confirm **Status = COMPLETE**.
3. Only then start **Task N+1**.
4. When testing, match **Expected output**.

---

# PHASE 0 — Project & GitHub connection

## Task 0.1 — Create local project folder
| Field | Detail |
|--------|--------|
| **Objective** | Have one folder for all MediRide code |
| **Reason** | Without a project root, apps and infra cannot share one monorepo |
| **Functions** | Folder: `C:\Users\USER\Projects\nemt-platform` + `git init` |
| **Expected output** | Folder exists; empty git repo |
| **Status** | ✅ COMPLETE |

## Task 0.2 — Connect to GitHub cloud repo
| Field | Detail |
|--------|--------|
| **Objective** | Save code in the cloud under medirideapp |
| **Reason** | Backup, team access, CI/CD later |
| **Functions** | `gh auth login` as **medirideapp**; remote `origin` → `https://github.com/medirideapp/mediride.git` |
| **Expected output** | `gh auth status` shows `Logged in as medirideapp`; repo page shows commits |
| **Coding / commands** | ```powershell<br>gh auth login --web --git-protocol https -h github.com<br>git remote add origin https://github.com/medirideapp/mediride.git<br>git push -u origin main<br>``` |
| **Status** | ✅ COMPLETE (screenshot confirmed: apps/, infra/, docker-compose, README on GitHub) |

## Task 0.3 — Initial scaffold commit
| Field | Detail |
|--------|--------|
| **Objective** | First full platform upload |
| **Reason** | Cloud must hold NestJS + Next.js + Docker, not only README |
| **Functions** | Commit `Initial MediRide NEMT platform scaffold` |
| **Expected output** | GitHub file tree includes `apps/`, `infra/`, `package.json`, `pnpm-lock.yaml` |
| **Status** | ✅ COMPLETE |

---

# PHASE 1 — Architecture foundations

## Task 1.1 — Monorepo (pnpm + Turborepo)
| Field | Detail |
|--------|--------|
| **Objective** | One repo, two apps (`api` + `web`) |
| **Reason** | Share tooling; deploy separately later |
| **Functions** | `package.json`, `pnpm-workspace.yaml`, `turbo.json` |
| **Expected output** | `pnpm install` installs workspace packages |
| **Status** | ✅ COMPLETE |

## Task 1.2 — Docker Compose (Postgres+PostGIS, Redis)
| Field | Detail |
|--------|--------|
| **Objective** | Local database + cache like production |
| **Reason** | PostGIS for nearest-driver; Redis for Socket.IO scale |
| **Functions** | `docker-compose.yml` services: `postgres`, `redis`, `api`, `web`, `nginx` |
| **Expected output** | `docker compose up -d postgres redis` → healthy containers on 5432 / 6379 |
| **Status** | ✅ COMPLETE (files ready; run Docker on your PC when available) |

## Task 1.3 — Prisma schema (users, drivers, rides, location)
| Field | Detail |
|--------|--------|
| **Objective** | Define all core tables |
| **Reason** | ORM needs a single source of truth for NEMT data |
| **Functions** | `apps/api/prisma/schema.prisma` — `User`, `Driver`, `Vehicle`, `Ride`, `LocationPing` |
| **Expected output** | `prisma db push` creates tables; enums `Role`, `RideStatus`, `DriverStatus` |
| **Status** | ✅ COMPLETE |

## Task 1.4 — NestJS API shell + health check
| Field | Detail |
|--------|--------|
| **Objective** | API boots and answers health |
| **Reason** | Prove backend is alive before auth/rides |
| **Functions** | `apps/api/src/main.ts`, `app.module.ts`, `health.controller.ts` → `GET /health` |
| **Expected output** | `{ "status": "ok", "service": "nemt-api" }` |
| **Status** | ✅ COMPLETE |

## Task 1.5 — Next.js PWA shell
| Field | Detail |
|--------|--------|
| **Objective** | Installable web app for rider/driver (no native store yet) |
| **Reason** | Mobile browsers need GPS + home-screen install |
| **Functions** | `apps/web` — Next.js 14, Tailwind, `public/manifest.json`, `public/sw.js` |
| **Expected output** | http://localhost:3000 loads landing page |
| **Status** | ✅ COMPLETE |

---

# PHASE 2 — Auth & security basics

## Task 2.1 — Register / login with Argon2id + JWT
| Field | Detail |
|--------|--------|
| **Objective** | Secure accounts for RIDER / DRIVER / ADMIN |
| **Reason** | Passwords must be hashed (Argon2id is free/open-source); JWT for API calls |
| **Functions** | `AuthService.register`, `AuthService.login`, `JwtStrategy`, `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| **Expected output** | Response: `{ accessToken, user: { id, email, role, ... } }` |
| **Coding example** | ```http<br>POST /auth/register<br>{ "email":"rider@test.com", "password":"Rider123!", "fullName":"Ali", "role":"RIDER" }<br>``` |
| **Status** | ✅ COMPLETE |

## Task 2.2 — Role guards
| Field | Detail |
|--------|--------|
| **Objective** | Only the right role can call each endpoint |
| **Reason** | Drivers must not book as riders; only admin approves drivers |
| **Functions** | `@Roles()`, `RolesGuard`, `JwtAuthGuard`, `@Public()` |
| **Expected output** | Wrong role → `403 Forbidden` |
| **Status** | ✅ COMPLETE |

## Task 2.3 — Seed users
| Field | Detail |
|--------|--------|
| **Objective** | Ready-made test accounts |
| **Reason** | Faster QA without manual signup every time |
| **Functions** | `apps/api/prisma/seed.ts` |
| **Expected output** | | Email | Password | Role |
| | | admin@nemt.local | Admin123! | ADMIN |
| | | rider@nemt.local | Rider123! | RIDER |
| | | driver@nemt.local | Driver123! | DRIVER (approved) |
| **Status** | ✅ COMPLETE |

---

# PHASE 3 — Ride booking & matching

## Task 3.1 — Request ride (rider)
| Field | Detail |
|--------|--------|
| **Objective** | Rider creates a medical trip |
| **Reason** | Core NEMT booking loop |
| **Functions** | `RidesService.requestRide` → `POST /rides` |
| **Expected output** | Ride `status: REQUESTED` + `nearestDrivers[]` |
| **Status** | ✅ COMPLETE |

## Task 3.2 — Nearest driver (PostGIS / haversine fallback)
| Field | Detail |
|--------|--------|
| **Objective** | Find nearby AVAILABLE approved drivers |
| **Reason** | Uber-style dispatch needs distance |
| **Functions** | `findNearestDrivers` — SQL `ST_DWithin` / `ST_Distance`; fallback haversine |
| **Expected output** | Sorted list by `distanceMeters` |
| **Status** | ✅ COMPLETE |

## Task 3.3 — Ride state machine
| Field | Detail |
|--------|--------|
| **Objective** | Legal status transitions only |
| **Reason** | Prevent jumping from REQUESTED → COMPLETED illegally |
| **Functions** | `ride-state.ts` — `canTransition()` |
| **Expected flow** | `REQUESTED → ACCEPTED → ARRIVING → IN_PROGRESS → COMPLETED` (or `CANCELLED`) |
| **Status** | ✅ COMPLETE |

## Task 3.4 — Accept / arriving / cancel endpoints
| Field | Detail |
|--------|--------|
| **Objective** | Driver and rider control trip lifecycle |
| **Reason** | Match real dispatch operations |
| **Functions** | `PATCH /rides/:id/accept`, `/arriving`, `/cancel` |
| **Expected output** | Updated ride JSON with timestamps (`acceptedAt`, etc.) |
| **Status** | ✅ COMPLETE |

## Task 3.5 — Dual confirm start & stop
| Field | Detail |
|--------|--------|
| **Objective** | Both rider and driver must confirm start and end |
| **Reason** | Clear medical trip record; reduces disputes |
| **Functions** | `confirmStart`, `confirmStop` — flags `riderConfirmedStart`, `driverConfirmedStart`, … |
| **Expected output** | Trip becomes `IN_PROGRESS` only when **both** confirmed start; `COMPLETED` when **both** confirmed stop |
| **Status** | ✅ COMPLETE |

---

# PHASE 4 — Live tracking (Uber/Lyft style)

## Task 4.1 — WebSocket tracking gateway
| Field | Detail |
|--------|--------|
| **Objective** | Stream driver GPS to rider in real time |
| **Reason** | Live map is the product differentiator |
| **Functions** | `TrackingGateway` namespace `/tracking` — events `join_ride`, `driver_location`, `location_update` |
| **Expected output** | Rider client receives `{ lat, lng, at }` while driver moves |
| **Status** | ✅ COMPLETE |

## Task 4.2 — Redis adapter hook
| Field | Detail |
|--------|--------|
| **Objective** | Allow multiple API instances to share sockets later |
| **Reason** | Scale-out readiness |
| **Functions** | `@socket.io/redis-adapter` when `REDIS_URL` set |
| **Expected output** | Log: `Socket.IO Redis adapter attached` (or in-memory warning) |
| **Status** | ✅ COMPLETE |

## Task 4.3 — Mapbox live map UI
| Field | Detail |
|--------|--------|
| **Objective** | Show pickup, dropoff, driver on a map |
| **Reason** | Visual confirmation like Lyft/Uber |
| **Functions** | `LiveMap.tsx`, `useTrackingSocket` |
| **Expected output** | Map markers move; if no Mapbox token, coordinates still shown |
| **Status** | ✅ COMPLETE |

## Task 4.4 — Driver GPS watch + location PATCH
| Field | Detail |
|--------|--------|
| **Objective** | Driver browser sends location while online |
| **Reason** | Matching + live track need last known lat/lng |
| **Functions** | `navigator.geolocation.watchPosition` → `PATCH /drivers/location` + WS emit |
| **Expected output** | Driver `lastLat`/`lastLng` update in DB |
| **Status** | ✅ COMPLETE |

---

# PHASE 5 — Lyft Healthcare–style products

## Task 5.1 — Landing page products section
| Field | Detail |
|--------|--------|
| **Objective** | Explain MediRide like Lyft Healthcare “Our products” |
| **Reason** | Clinics understand Concierge / Assisted / Pass |
| **Functions** | `apps/web/src/app/page.tsx` — hero + `#products` cards |
| **Expected output** | Page title **MediRide**; cards: Concierge, Assisted, Live tracking, Organization Pass (coming soon) |
| **Status** | ✅ COMPLETE |
| **Commit** | `f1eca70` — *Add Lyft Healthcare–style Concierge, Assisted, and scheduled rides* |

## Task 5.2 — Scheduled rides
| Field | Detail |
|--------|--------|
| **Objective** | Book now **or** later |
| **Reason** | Appointments are planned (Lyft Concierge schedule) |
| **Functions** | Prisma `Ride.scheduledFor`; DTO `scheduledFor`; rider datetime-local input |
| **Expected output** | Ride stores ISO time; UI shows “Scheduled: …” |
| **Status** | ✅ COMPLETE |

## Task 5.3 — MediRide Assisted (door-to-door)
| Field | Detail |
|--------|--------|
| **Objective** | Flag trips that need curb-to-door help |
| **Reason** | Matches Lyft Assisted for seniors / limited mobility |
| **Functions** | Enum `AssistanceLevel` (`NONE` \| `DOOR_TO_DOOR`); checkbox on rider + concierge forms |
| **Expected output** | Ride shows `assistanceLevel: DOOR_TO_DOOR` |
| **Status** | ✅ COMPLETE |

## Task 5.4 — Wheelchair-accessible request
| Field | Detail |
|--------|--------|
| **Objective** | Mark WAV need on the ride |
| **Reason** | NEMT compliance / vehicle matching later |
| **Functions** | `Ride.wheelchairNeeded`; `Vehicle.wheelchair` |
| **Expected output** | Checkbox persists on ride record |
| **Status** | ✅ COMPLETE |

## Task 5.5 — MediRide Concierge API + Admin UI
| Field | Detail |
|--------|--------|
| **Objective** | Clinic books for a patient who may not have the app |
| **Reason** | Same job as Lyft Concierge for care coordinators |
| **Functions** | `POST /rides/concierge` → `RidesService.conciergeRide`; Admin form “MediRide Concierge” |
| **Expected output** | Ride with `isConcierge: true`, `patientName`, `bookedByUserId` |
| **Coding example** | ```http<br>POST /rides/concierge<br>Authorization: Bearer <admin_jwt><br>{ "patientName":"Fatima", "patientPhone":"+1...", "pickupAddress":"Home", "pickupLat":32.77, "pickupLng":-96.79, "dropoffAddress":"Clinic", "dropoffLat":32.78, "dropoffLng":-96.80, "assistanceLevel":"DOOR_TO_DOOR" }<br>``` |
| **Status** | ✅ COMPLETE |

## Task 5.6 — Organization Pass (budget rides)
| Field | Detail |
|--------|--------|
| **Objective** | Org pays for member rides with caps |
| **Reason** | Lyft Pass equivalent for health systems |
| **Functions** | `Organization`, `RidePass` models; `OrganizationsService`; `POST /organizations`, `POST /organizations/:id/passes`, attach `passId` on concierge rides; charge on COMPLETED |
| **Expected output** | Admin Pass desk shows budget/spent/left; completed ride increments `spentUsd` |
| **Status** | ✅ COMPLETE |

---

# PHASE 6 — Admin, DevOps, hosting

## Task 6.1 — Admin dashboard (drivers + rides + stats)
| Field | Detail |
|--------|--------|
| **Objective** | Ops console |
| **Reason** | Approve drivers; monitor fleet |
| **Functions** | `GET /admin/stats|rides|drivers`, `PATCH /admin/drivers/:id/approve`, `/admin` page |
| **Expected output** | Stats cards + approve button works |
| **Status** | ✅ COMPLETE |

## Task 6.2 — Nginx + Let’s Encrypt configs
| Field | Detail |
|--------|--------|
| **Objective** | HTTPS reverse proxy for production |
| **Reason** | Free SSL (Let’s Encrypt); secure cookies/GPS APIs need HTTPS |
| **Functions** | `infra/nginx/nginx.conf`, `nginx.prod.conf`, `init-letsencrypt.sh` |
| **Expected output** | On VPS: HTTPS site; HTTP redirects to HTTPS |
| **Status** | ✅ COMPLETE (config ready; run on VPS when domain exists) |

## Task 6.3 — Secrets (Infisical notes + .env.example)
| Field | Detail |
|--------|--------|
| **Objective** | No secrets in git |
| **Reason** | JWT/DB passwords must not be public |
| **Functions** | `.gitignore` blocks `.env`; `infra/infisical/README.md` |
| **Expected output** | GitHub has `.env.example` only, never real `.env` |
| **Status** | ✅ COMPLETE |

## Task 6.4 — CI/CD GitHub Actions
| Field | Detail |
|--------|--------|
| **Objective** | Build on push; deploy path ready |
| **Reason** | Cloud automation |
| **Functions** | `.github/workflows/ci-cd.yml` |
| **Expected output** | Actions tab runs build on push to `main` |
| **Status** | ✅ COMPLETE (workflow file present) |

## Task 6.5 — Grafana + Loki + Prometheus + Uptime Kuma
| Field | Detail |
|--------|--------|
| **Objective** | Logs, metrics, uptime alerts |
| **Reason** | Production visibility without heavy ELK |
| **Functions** | `docker-compose.prod.yml` + `infra/monitoring/*` |
| **Expected output** | Grafana `:3002`, Uptime Kuma `:3003` after prod compose |
| **Status** | ✅ COMPLETE (compose ready) |

## Task 6.6 — Deploy live site on VPS (Hetzner/DO)
| Field | Detail |
|--------|--------|
| **Objective** | Public URL for clinics/patients |
| **Reason** | GitHub holds code; VPS runs the app 24/7 |
| **Functions** | `scripts/vps-bootstrap.sh`, `scripts/vps-deploy.sh`, `infra/VPS_CHECKLIST.md`, `infra/DEPLOY.md` |
| **Expected output** | `https://your-domain` serves MediRide |
| **Status** | 🟡 PREP COMPLETE — waiting on your VPS IP + domain (cannot finish without them) |

---

# PHASE 7 — Future (backlog)

| Task | Objective | Status |
|------|-----------|--------|
| 7.1 Organization Pass / budgets | Lyft Pass–style paid rides | ✅ Done (Task 5.6) |
| 7.2 SMS OTP / trip alerts (Twilio) | Notify patient without app | ✅ COMPLETE (log mode without keys; Twilio when set) |
| 7.3 Stripe payments | Collect or bill org | ⬜ |
| 7.4 EHR / FHIR booking stub | Hospital workflow integration | ⬜ |
| 7.5 Native wrapper (Capacitor) | App stores if needed | ⬜ |

---

# Quick local run checklist (after clone)

```powershell
cd C:\Users\USER\Projects\nemt-platform
cp .env.example .env
# Add Mapbox token to .env → NEXT_PUBLIC_MAPBOX_TOKEN

docker compose up -d postgres redis
pnpm install
pnpm --filter @nemt/api prisma:generate
pnpm --filter @nemt/api exec prisma db push
pnpm --filter @nemt/api prisma:seed

pnpm --filter @nemt/api dev
pnpm --filter @nemt/web dev
```

| URL | Expected |
|-----|----------|
| http://localhost:3000 | MediRide landing + products |
| http://localhost:3001/health | `{ "status":"ok" }` |
| http://localhost:3000/admin | Concierge form (login as admin) |
| http://localhost:3000/rider | Book + Assisted + schedule |
| http://localhost:3000/driver | Accept + live GPS |

---

# Progress summary

| Phase | Progress |
|-------|----------|
| 0 GitHub | ✅ Complete |
| 1 Foundations | ✅ Complete |
| 2 Auth | ✅ Complete |
| 3 Booking | ✅ Complete |
| 4 Live tracking | ✅ Complete |
| 5 Lyft-style products | ✅ 5.1–5.6 complete (Pass included) |
| 6 DevOps | ✅ Config + VPS scripts · 🟡 6.6 live URL waits on your server |
| 7 Future | ✅ 7.2 SMS · ⬜ Stripe / FHIR / native |

**Recommended next task:** **6.6 Deploy to VPS** — follow `infra/DEPLOY.md` with domain + secrets.

---

*Document version: 2026-07-21 · Aligned with commit `f1eca70` on `main`*
