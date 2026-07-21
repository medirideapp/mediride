# VPS deployment checklist (Hetzner / DigitalOcean)

1. Create a $10–20/mo VPS (USA region) with Ubuntu 24.04.
2. Install Docker + Docker Compose plugin.
3. Point your domain A record via Cloudflare (orange cloud optional for CDN).
4. Clone this repo to `/opt/nemt-platform`.
5. Create production secrets with Infisical (`infra/infisical/README.md`) or a locked-down `.env`.
6. Set a strong `JWT_SECRET` and `POSTGRES_PASSWORD`.
7. Issue TLS: `DOMAIN=your.domain EMAIL=you@domain bash infra/nginx/init-letsencrypt.sh`
   (Let's Encrypt = free automated HTTPS certificates — not "left encryption".)
8. `docker compose -f docker-compose.prod.yml up -d`
9. Open Grafana (`:3002`) and Uptime Kuma (`:3003`); add a monitor for `https://your.domain/api/health` (proxied) or API health.
10. Configure GitHub Actions secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`.

Self-hosting at home is possible but not recommended for a public NEMT product (CGNAT, uptime, power, residential ISP ToS).
