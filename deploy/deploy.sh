#!/usr/bin/env bash
set -euo pipefail

cd /opt/booking-demo

if [[ ! -f .env.production ]]; then
  echo ".env.production is required in /opt/booking-demo." >&2
  exit 1
fi

if [[ ! -s secrets/cloudflare_tunnel_token ]]; then
  echo "secrets/cloudflare_tunnel_token is required in /opt/booking-demo." >&2
  exit 1
fi

# Build one app at a time to avoid memory spikes on a 2 GB VPS.
for service in glamping jeep admin api; do
  docker compose --env-file .env.production build "$service"
  docker builder prune -f --filter 'until=24h'
done

docker compose --env-file .env.production up -d --remove-orphans
docker compose --env-file .env.production ps
