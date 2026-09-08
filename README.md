# Shakila Group Booking Demo

Functional multi-business booking demo built with Next.js, PostgreSQL, Drizzle,
npm Workspaces, and Turborepo.

## Applications

- Shakila Glamping: http://localhost:3000
- Shakila Jeep Tour: http://localhost:3001
- Shakila Group Admin: http://localhost:3002
- Central API: http://localhost:3003

## Local setup

Copy `.env.example` to `.env.local`, provide `DATABASE_URL`,
`TEST_DATABASE_URL`, and `BOOKING_ACCESS_TOKEN_SECRET`, then run:

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The configured `APP_MODE=demo` uses the local Demo Payment Provider, direct PDF
invoice delivery, email preview, inline background jobs, and explicitly disabled
Turnstile. No live Pakasir, Resend, R2, hosted Inngest, or Turnstile credential is
required for this mode.

## Local Admin Login

Admin URL: http://localhost:3002/login. Configure `DEMO_ADMIN_EMAIL` and
`DEMO_ADMIN_PASSWORD` locally; credentials are intentionally not displayed by
the application or committed to this repository. Production uses the separate
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` variables.

## Quality commands

```bash
npm run db:verify
npm run lint
npm run typecheck
npm run test
npm run build
```

Repository requirements and milestone constraints are documented in
`AGENTS.md` and `docs/`.
