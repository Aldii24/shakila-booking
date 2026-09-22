# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS dependencies
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json turbo.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/glamping/package.json apps/glamping/package.json
COPY apps/jeep/package.json apps/jeep/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/booking/package.json packages/booking/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/email/package.json packages/email/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/invoice/package.json packages/invoice/package.json
COPY packages/payment/package.json packages/payment/package.json
COPY packages/reporting/package.json packages/reporting/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/validation/package.json packages/validation/package.json
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS builder
ARG APP
ARG APP_MODE=production
ARG TURNSTILE_MODE=cloudflare
ARG NEXT_PUBLIC_API_URL=https://api.shakilagrup.com/api/v1
ARG NEXT_PUBLIC_GLAMPING_URL=https://glamping.shakilagrup.com
ARG NEXT_PUBLIC_GLAMPING_BANK_NAME
ARG NEXT_PUBLIC_GLAMPING_BANK_ACCOUNT
ARG NEXT_PUBLIC_GLAMPING_BANK_HOLDER
ARG NEXT_PUBLIC_HOMESTAY_BANK_NAME
ARG NEXT_PUBLIC_HOMESTAY_BANK_ACCOUNT
ARG NEXT_PUBLIC_HOMESTAY_BANK_HOLDER
ARG NEXT_PUBLIC_JEEP_BANK_NAME
ARG NEXT_PUBLIC_JEEP_BANK_ACCOUNT
ARG NEXT_PUBLIC_JEEP_BANK_HOLDER
ARG NEXT_PUBLIC_ADMIN_WHATSAPP
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV APP_MODE=$APP_MODE \
    TURNSTILE_MODE=$TURNSTILE_MODE \
    NODE_OPTIONS=--max-old-space-size=1024 \
    TURBO_CONCURRENCY=1 \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_GLAMPING_URL=$NEXT_PUBLIC_GLAMPING_URL \
    NEXT_PUBLIC_GLAMPING_BANK_NAME=$NEXT_PUBLIC_GLAMPING_BANK_NAME \
    NEXT_PUBLIC_GLAMPING_BANK_ACCOUNT=$NEXT_PUBLIC_GLAMPING_BANK_ACCOUNT \
    NEXT_PUBLIC_GLAMPING_BANK_HOLDER=$NEXT_PUBLIC_GLAMPING_BANK_HOLDER \
    NEXT_PUBLIC_HOMESTAY_BANK_NAME=$NEXT_PUBLIC_HOMESTAY_BANK_NAME \
    NEXT_PUBLIC_HOMESTAY_BANK_ACCOUNT=$NEXT_PUBLIC_HOMESTAY_BANK_ACCOUNT \
    NEXT_PUBLIC_HOMESTAY_BANK_HOLDER=$NEXT_PUBLIC_HOMESTAY_BANK_HOLDER \
    NEXT_PUBLIC_JEEP_BANK_NAME=$NEXT_PUBLIC_JEEP_BANK_NAME \
    NEXT_PUBLIC_JEEP_BANK_ACCOUNT=$NEXT_PUBLIC_JEEP_BANK_ACCOUNT \
    NEXT_PUBLIC_JEEP_BANK_HOLDER=$NEXT_PUBLIC_JEEP_BANK_HOLDER \
    NEXT_PUBLIC_ADMIN_WHATSAPP=$NEXT_PUBLIC_ADMIN_WHATSAPP \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY . .
RUN npm run build --workspace "@booking/${APP}"

FROM dependencies AS tools
COPY . .
CMD ["npm", "run", "db:migrate"]

FROM node:24-alpine AS runner
ARG APP
ENV APP=$APP \
    HOSTNAME=0.0.0.0 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/${APP}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/${APP}/.next/static ./apps/${APP}/.next/static
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/${APP}/public ./apps/${APP}/public
USER nextjs
CMD ["sh", "-c", "exec node apps/${APP}/server.js"]
