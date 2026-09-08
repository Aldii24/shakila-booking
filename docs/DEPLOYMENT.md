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
5. Run `deploy/deploy.sh <40-character-git-sha>` as root. Migration and
   application images are deliberately built sequentially to avoid concurrent
   compiler memory spikes. The script applies committed Drizzle migrations,
   never seeds or resets production, waits for container health, verifies all
   public routes, and restores the previously running application images if
   rollout or verification fails.

## Continuous deployment

`.github/workflows/production.yml` runs the complete lint, typecheck, test, and
build gate for every push to `main`. Deployment starts only after that gate
passes. The workflow synchronizes the tested commit to `/opt/booking-demo`
while preserving `.env.production` and `secrets/`, then invokes the serial,
rollback-aware deployment script.

Configure these GitHub Actions repository secrets:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_PRIVATE_KEY`
- `VPS_KNOWN_HOSTS`

Production environment values, Cloudflare credentials, database credentials,
and R2 credentials remain only in ignored files on the VPS. They are not copied
from CI or committed to the repository.

## Operations

Use `docker compose --env-file .env.production ps` for container health and
`docker compose --env-file .env.production logs --tail=200 SERVICE` for logs.
All services use `unless-stopped`, bounded JSON logs, health checks, CPU limits,
and memory limits. The API CORS allowlist is fixed in Compose to the three
production frontend origins. Secrets are stored only in ignored files on the
VPS.

Payment proof objects are written only to the private R2 bucket configured by
`R2_PAYMENT_PROOFS_BUCKET_NAME`. Invoice PDFs use that same verified private
bucket under the `invoices/` prefix; `R2_BUCKET_NAME` remains a fallback for
older environments. Do not attach a public/custom domain to the bucket. Admin
previews and downloads are streamed through authenticated API endpoints;
legacy proof blobs already stored in PostgreSQL remain readable and are not
deleted or migrated automatically.
