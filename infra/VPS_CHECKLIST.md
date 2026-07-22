# Task 6.6 — VPS deploy checklist (do this when you have a server + domain)

## You need before starting
1. A VPS (Hetzner or DigitalOcean, ~$10–20/mo, Ubuntu 24.04, USA region OK)
2. Domain **mediride.net** pointed to the VPS IP (DNS A record for apex; CNAME or A for www)
3. SSH access (username + key)

## Steps
1. SSH into the server
2. Run: `bash scripts/vps-bootstrap.sh` (installs Docker + firewall)
3. `git clone https://github.com/medirideapp/mediride.git /opt/mediride`
4. `cd /opt/mediride && cp .env.example .env` then edit secrets (JWT_SECRET, POSTGRES_PASSWORD, Mapbox, optional Twilio)
5. Confirm `infra/nginx/nginx.prod.conf` uses `server_name mediride.net www.mediride.net` and cert paths under `live/mediride.net/`
6. `DOMAIN=mediride.net EMAIL=ops@mediride.net bash infra/nginx/init-letsencrypt.sh`
   (or `EMAIL=sarshadata786@gmail.com`)
7. `bash scripts/vps-deploy.sh`
8. Open https://mediride.net — MediRide landing should load
9. Optional: set GitHub secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` and variable `ENABLE_GHCR_PUSH=true` after org packages are allowed

## Status
Prepared (scripts + guide). Production domain is **mediride.net**. Live deploy waits on VPS + DNS A record.
