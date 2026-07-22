# VPS deployment checklist (Hetzner / DigitalOcean)

1. Create a $10–20/mo VPS (USA region) with Ubuntu 24.04.
2. Install Docker + Docker Compose plugin (`bash scripts/vps-bootstrap.sh`).
3. Point **mediride.net** (and optionally **www.mediride.net**) A records to the VPS IP (Cloudflare orange cloud optional for CDN).
4. Clone this repo to `/opt/mediride` (or `/opt/nemt-platform`).
5. Create production secrets with Infisical (`infra/infisical/README.md`) or a locked-down `.env`.
6. Set a strong `JWT_SECRET` and `POSTGRES_PASSWORD`. For production set:
   - `CORS_ORIGIN=https://mediride.net`
   - `NEXT_PUBLIC_API_URL=https://mediride.net/api` (Nginx proxies `/api` to the API)
   - `NEXT_PUBLIC_WS_URL=https://mediride.net`
7. Issue TLS: `DOMAIN=mediride.net EMAIL=ops@mediride.net bash infra/nginx/init-letsencrypt.sh`
   (or `EMAIL=sarshadata786@gmail.com`). Let's Encrypt = free automated HTTPS — not "left encryption".
8. `bash scripts/vps-deploy.sh` (or `docker compose -f docker-compose.prod.yml up -d`)
9. Open Grafana (`:3002`) and Uptime Kuma (`:3003`); add a monitor for `https://mediride.net/api/health`.
10. Configure GitHub Actions secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`.

Self-hosting at home is possible but not recommended for a public NEMT product (CGNAT, uptime, power, residential ISP ToS).
