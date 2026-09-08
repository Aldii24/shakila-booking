#!/usr/bin/env bash
set -Eeuo pipefail

cd /opt/booking-demo

image_tag="${1:-}"
if [[ ! "${image_tag}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Usage: $0 <40-character-git-sha>" >&2
  exit 1
fi

if [[ ! -f .env.production ]]; then
  echo ".env.production is required in /opt/booking-demo." >&2
  exit 1
fi

if [[ ! -s secrets/cloudflare_tunnel_token ]]; then
  echo "secrets/cloudflare_tunnel_token is required in /opt/booking-demo." >&2
  exit 1
fi

compose=(docker compose --env-file .env.production)
services=(glamping jeep admin api)
rollback_tag="rollback-${image_tag:0:12}"
rollout_started=false
declare -A previous_images=()

wait_for_public_url() {
  local url="$1"
  curl --fail --silent --show-error --location \
    --connect-timeout 10 --max-time 30 \
    --retry 5 --retry-delay 5 --retry-all-errors \
    --output /dev/null "$url"
}

verify_public_routes() {
  wait_for_public_url "https://glamping.shakilagrup.com"
  wait_for_public_url "https://jeep.shakilagrup.com"
  wait_for_public_url "https://admin.shakilagrup.com"
  wait_for_public_url "https://api.shakilagrup.com/api/v1/health"
}

rollback() {
  local exit_code=$?
  trap - ERR

  if [[ "${rollout_started}" == true ]]; then
    echo "Deployment failed; restoring the previously running images." >&2
    export IMAGE_TAG="${rollback_tag}"
    for service in "${services[@]}"; do
      if [[ -n "${previous_images[$service]:-}" ]]; then
        "${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "$service" || true
      fi
    done
    "${compose[@]}" ps || true
    verify_public_routes || echo "Rollback completed, but public verification still failed." >&2
  fi

  exit "${exit_code}"
}
trap rollback ERR

# Refuse to replace an already unhealthy production deployment.
for service in "${services[@]}" cloudflared; do
  container_id="$("${compose[@]}" ps -q "$service")"
  if [[ -z "${container_id}" ]]; then
    echo "Production service ${service} is not running; refusing deployment." >&2
    exit 1
  fi
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"
  if [[ "${health}" != healthy ]]; then
    echo "Production service ${service} is ${health}; refusing deployment." >&2
    exit 1
  fi
done
verify_public_routes

# Keep a deploy-specific tag for every previously running app so rollback does
# not depend on mutable image names.
for service in "${services[@]}"; do
  container_id="$("${compose[@]}" ps -q "$service")"
  previous_images[$service]="$(docker inspect --format '{{.Image}}' "$container_id")"
  docker image tag "${previous_images[$service]}" "booking-demo-${service}:${rollback_tag}"
done

export IMAGE_TAG="${image_tag}"

# Build strictly one image at a time. All builds must succeed before migration
# or replacement of any running container begins.
for service in migrate "${services[@]}"; do
  "${compose[@]}" build "$service"
  docker builder prune -f --filter 'until=24h'
done

# Drizzle migrate applies committed migrations only. Never seed or reset here.
"${compose[@]}" --profile operations run --rm --no-deps migrate

rollout_started=true
for service in "${services[@]}"; do
  "${compose[@]}" up -d --no-deps --wait --wait-timeout 180 "$service"
done

"${compose[@]}" ps
verify_public_routes

trap - ERR
echo "Deployment ${image_tag} is healthy."
