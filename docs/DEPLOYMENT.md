# VPS Deployment

This deployment keeps PostgreSQL on Neon and runs the four Next.js applications
behind an outbound-only Cloudflare Tunnel on one Ubuntu 24.04 VPS.

## Routing

| Hostname | Private service URL |
| --- | --- |
| `shakilagrup.com` | `http://glamping:3000` |
| `glamping.shakilagrup.com` | `http://glamping:3000` |
| `jeep.shakilagrup.com` | `http://jeep:3001` |
| `admin.shakilagrup.com` | `http://admin:3002` |
| `api.shakilagrup.com` | `http://api:3003` |

The production frontend API base URL is
`https://api.shakilagrup.com/api/v1`. No application or proxy port is published
on the host; `cloudflared` reaches each service through the private Compose
network.

## First deployment

1. Run `deploy/bootstrap-ubuntu.sh` once as root. It installs Docker Engine and
   Compose, enables a 2 GB swap file with low swappiness, and keeps only SSH
   allowed by UFW.
2. Copy the repository to `/opt/booking-demo` without local `.env*`, `.git`,
   `node_modules`, `.next`, or build cache directories.
3. Copy `.env.production.example` to `.env.production`, fill secrets on the VPS,
   and restrict it with `chmod 600 .env.production`.
   `APP_MODE=production`, Cloudflare Turnstile, production-only Admin
   credentials, and the private `R2_PAYMENT_PROOFS_BUCKET_NAME` are mandatory.
4. Create a remotely managed Cloudflare Tunnel, configure the five public
   hostnames above, store its token in `secrets/cloudflare_tunnel_token`, and
   restrict that file with `chmod 600`.
5. Run `deploy/deploy.sh` as root. Images are deliberately built sequentially to
   avoid concurrent compiler memory spikes.
6. Run migrations explicitly after checking the target Neon connection:
   `docker compose --env-file .env.production --profile operations run --rm migrate`.
   Do not seed or reset production automatically.

## Operations

Use `docker compose --env-file .env.production ps` for container health and
`docker compose --env-file .env.production logs --tail=200 SERVICE` for logs.
All services use `unless-stopped`, bounded JSON logs, health checks, CPU limits,
and memory limits. The API CORS allowlist is fixed in Compose to the three
production frontend origins. Secrets are stored only in ignored files on the
VPS.

Payment proof objects are written only to the private R2 bucket configured by
`R2_PAYMENT_PROOFS_BUCKET_NAME`. Do not attach a public/custom domain to this
bucket. Admin previews are streamed through the authenticated API endpoint;
legacy proof blobs already stored in PostgreSQL remain readable and are not
deleted or migrated automatically.
