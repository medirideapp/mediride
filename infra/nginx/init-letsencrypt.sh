#!/usr/bin/env bash
# Issue Let's Encrypt certs via Certbot (run on VPS after DNS points to the server)
# Usage: DOMAIN=rides.example.com EMAIL=ops@example.com ./infra/nginx/init-letsencrypt.sh

set -euo pipefail

DOMAIN="${DOMAIN:?Set DOMAIN=your.domain.com}"
EMAIL="${EMAIL:?Set EMAIL=you@example.com}"
CERT_PATH="./infra/nginx/certs"

mkdir -p "$CERT_PATH" certbot_www

# Temporary self-signed so nginx can start, then replace with Let's Encrypt
if [ ! -f "$CERT_PATH/live/$DOMAIN/fullchain.pem" ]; then
  mkdir -p "$CERT_PATH/live/$DOMAIN"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_PATH/live/$DOMAIN/privkey.pem" \
    -out "$CERT_PATH/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN"
fi

# Replace DOMAIN placeholder in prod nginx config
sed "s|DOMAIN|$DOMAIN|g" ./infra/nginx/nginx.prod.conf > /tmp/nginx.prod.conf
cp /tmp/nginx.prod.conf ./infra/nginx/nginx.prod.conf.active

docker compose -f docker-compose.prod.yml up -d nginx

docker run --rm \
  -v "$(pwd)/infra/nginx/certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email

docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
echo "Let's Encrypt certificate installed for $DOMAIN"
