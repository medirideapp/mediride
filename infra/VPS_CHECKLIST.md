# Task 6.6 — VPS deploy checklist (do this when you have a server + domain)

## You need before starting
1. A VPS (Hetzner or DigitalOcean, ~$10–20/mo, Ubuntu 24.04, USA region OK)
2. A domain name (e.g. rides.yourdomain.com) pointed to the VPS IP (Cloudflare A record)
3. SSH access (username + key)

## Steps
1. SSH into the server
2. Run: `bash scripts/vps-bootstrap.sh` (installs Docker + firewall)
3. `git clone https://github.com/medirideapp/mediride.git /opt/mediride`
4. `cd /opt/mediride && cp .env.example .env` then edit secrets (JWT_SECRET, POSTGRES_PASSWORD, Mapbox, optional Twilio)
5. Replace `DOMAIN` in `infra/nginx/nginx.prod.conf`
6. `DOMAIN=rides.example.com EMAIL=you@email.com bash infra/nginx/init-letsencrypt.sh`
7. `bash scripts/vps-deploy.sh`
8. Open https://your-domain — MediRide landing should load
9. Optional: set GitHub secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` and variable `ENABLE_GHCR_PUSH=true` after org packages are allowed

## Status
Prepared (scripts + guide). Live deploy waits on your VPS + domain credentials.
