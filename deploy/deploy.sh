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
health_services=(glamping jeep admin api cloudflared)
rollback_tag="rollback-${image_tag:0:12}"
rollout_started=false
declare -A previous_images=()

verify_container_health() {
  local service container_id health
  for service in "${health_services[@]}"; do
    container_id="$("${compose[@]}" ps -q "$service")"
    if [[ -z "${container_id}" ]]; then
      echo "Production service ${service} has no running container." >&2
      return 1
    fi

    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
    if [[ "${health}" != healthy ]]; then
      echo "Production service ${service} is ${health}; expected healthy." >&2
      return 1
    fi
  done
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
    verify_container_health || echo "Rollback completed, but container health verification failed." >&2
  fi

  exit "${exit_code}"
}
trap rollback ERR

# Refuse to replace an already unhealthy production deployment. These checks
# stay on the private Compose network and never depend on Cloudflare ingress.
verify_container_health

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
verify_container_health

trap - ERR
echo "Deployment ${image_tag} passed container health verification."
