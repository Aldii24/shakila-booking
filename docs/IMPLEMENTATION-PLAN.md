# Implementation Plan

## Product Demo — Glamping, Jeep & Central Admin Booking System

**Document:** `IMPLEMENTATION-PLAN.md`  
**Version:** 1.0  
**Status:** Execution Baseline — Demo v1  
**Primary Executor:** Codex CLI  
**Package Manager:** npm  
**Monorepo:** Turborepo

**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/UI-UX-SPEC.md`
- `docs/DEMO-DATA.md`

---

# 1. Purpose

Dokumen ini mengubah seluruh requirement dan specification menjadi urutan implementasi yang dapat dikerjakan Codex secara bertahap.

Tujuan utama:

- menghindari implementasi besar sekaligus,
- menghindari refactor arsitektur di tengah jalan,
- membuat setiap milestone dapat direview,
- memastikan critical business logic selesai sebelum UI polish,
- memastikan demo tetap functional setiap fase,
- menjaga Codex tetap mengikuti scope.

---

# 2. Core Execution Principle

Codex tidak boleh diminta:

```text
Build the entire product.
```

dalam satu prompt.

Implementasi dilakukan:

```text
Milestone
↓
Review
↓
Test
↓
Commit
↓
Next Milestone
```

Setiap milestone harus selesai sebelum milestone berikutnya dimulai kecuali dependency memang memungkinkan paralel.

---

# 3. Source of Truth

Sebelum mengerjakan milestone apa pun, Codex wajib membaca dokumen yang relevan.

Priority:

```text
PRD.md
↓
BUSINESS-RULES.md
↓
DATABASE.md
↓
API.md
↓
ARCHITECTURE.md
↓
UI-UX-SPEC.md
↓
DEMO-DATA.md
↓
IMPLEMENTATION-PLAN.md
```

Jika terdapat ambiguity, Codex tidak boleh membuat business policy besar sendiri.

---

# 4. Global Completion Rules

Setiap milestone harus memenuhi:

```text
npm run lint
npm run typecheck
npm run test
```

dan jika app terkait sudah buildable:

```text
npm run build
```

Jika E2E sudah tersedia:

```text
npm run test:e2e
```

untuk flow yang disentuh.

---

# 5. Git Discipline

Recommended:

```text
1 milestone
=
1 logical commit
```

atau beberapa commit kecil yang tetap scoped.

Contoh:

```text
feat: scaffold booking monorepo
feat: add database foundation
feat: implement booking allocation engine
feat: add glamping customer flow
```

---

# 6. Milestone Overview

```text
M0  Repository Foundation
M1  Shared Packages Foundation
M2  Database Foundation
M3  Demo Seed Data
M4  Booking Domain Engine
M5  Central Public API
M6  Glamping Website
M7  Jeep Website
M8  Pakasir Payment Integration
M9  Invoice + Resend
M10 Admin Authentication + Shell
M11 Admin Booking Operations
M12 Calendar + Inventory Operations
M13 Dashboard + Customers + Payments
M14 UI/UX Polish
M15 Testing + Demo Readiness
M16 Deployment
```

---

# M0 — Repository Foundation

## Goal

Mengubah Turborepo starter menjadi repository structure final tanpa membuat business feature.

---

## Tasks

Hapus/replace starter apps:

```text
apps/web
apps/docs
```

Buat:

```text
apps/glamping
apps/jeep
apps/admin
apps/api
```

Pastikan semuanya Next.js App Router + TypeScript.

---

## Root Configuration

Pastikan root menggunakan:

```text
npm Workspaces
Turborepo
package-lock.json
```

Tidak ada:

```text
pnpm-lock.yaml
yarn.lock
bun.lockb
```

---

## Root Scripts

Target:

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test"
  }
}
```

Exact script dapat disesuaikan dengan workspace.

---

## App Ports

Development defaults:

```text
glamping 3000
jeep     3001
admin    3002
api      3003
```

---

## Repository Structure

Target:

```text
apps/
├── glamping/
├── jeep/
├── admin/
└── api/

packages/
├── ui/
├── eslint-config/
└── typescript-config/

docs/
├── PRD.md
├── ARCHITECTURE.md
├── BUSINESS-RULES.md
├── DATABASE.md
├── API.md
├── UI-UX-SPEC.md
├── DEMO-DATA.md
└── IMPLEMENTATION-PLAN.md
```

---

## Environment

Create:

```text
.env.example
```

without real secrets.

---

## Do Not

Do not setup:

- database schema,
- Pakasir,
- Resend,
- R2,
- Better Auth,

in M0 unless dependency is only needed for basic scaffold.

---

## Exit Criteria

- [ ] All four apps start.
- [ ] `npm install` succeeds.
- [ ] `npm run dev` runs workspace.
- [ ] `npm run build` succeeds.
- [ ] No starter Turbo app remains.
- [ ] Docs remain intact.
- [ ] npm only.

---

# M1 — Shared Packages Foundation

## Goal

Membuat boundaries yang sudah ditetapkan Architecture.

---

## Create Packages

```text
packages/
├── database/
├── booking/
├── payment/
├── invoice/
├── email/
├── auth/
├── validation/
├── contracts/
├── ui/
├── eslint-config/
└── typescript-config/
```

Namespace:

```text
@booking/*
```

---

## Package Responsibilities

Create minimal valid package skeleton.

Do not implement full features yet.

Example:

```text
@booking/database
@booking/booking
@booking/payment
@booking/invoice
@booking/email
@booking/auth
@booking/contracts
@booking/validation
@booking/ui
```

---

## TypeScript

Enable strict mode.

Ensure workspace aliases/imports resolve correctly.

---

## Shared UI

Install/configure:

```text
Tailwind
shadcn/ui primitives
Lucide
```

Only minimum primitives needed initially.

Do not install entire shadcn registry unnecessarily.

---

## Core Frontend Dependencies

Prepare:

```text
Zod
React Hook Form
TanStack Query
date-fns
```

where needed.

---

## Testing

Setup:

```text
Vitest
```

for shared packages.

---

## Exit Criteria

- [ ] Packages import correctly.
- [ ] No circular dependency.
- [ ] TypeScript strict passes.
- [ ] Test runner works.
- [ ] No business implementation duplicated in apps.

---

# M2 — Database Foundation

## Goal

Implement `DATABASE.md` using PostgreSQL + Neon + Drizzle.

---

## Dependencies

Install/configure:

```text
Drizzle ORM
Drizzle Kit
Neon-compatible transaction-capable PostgreSQL driver
```

---

## Create Schema

Implement minimum:

```text
businesses
business_settings

customers

accommodation_types
accommodation_units

jeep_packages
jeep_departure_slots
jeep_units

bookings
glamping_booking_details
jeep_booking_details

accommodation_unit_reservations
jeep_unit_reservations

inventory_blocks

payments
payment_attempts

invoices
booking_events
```

Auth-specific tables handled later with Better Auth where appropriate.

---

## PostgreSQL Integrity

Implement:

- booking unique constraint,
- invoice unique constraint,
- provider reference unique constraints,
- partial Jeep reservation unique index,
- accommodation exclusion constraint,
- relevant check constraints,
- foreign keys,
- indexes.

---

## PostgreSQL Extension

If supported:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

---

## Drizzle Migrations

Create proper migration files.

Do not rely only on schema push for final workflow.

---

## DB Scripts

Target:

```text
npm run db:generate
npm run db:migrate
```

---

## Tests

Required:

- accommodation overlap rejected,
- checkout boundary accepted,
- Jeep same date/slot rejected,
- Jeep different slot accepted.

---

## Exit Criteria

- [ ] Clean DB migrates successfully.
- [ ] All constraints exist.
- [ ] Drizzle types compile.
- [ ] Core DB integration tests pass.
- [ ] No availability table exists.

---

# M3 — Demo Seed Data

## Goal

Implement `DEMO-DATA.md`.

---

## Seed Core Businesses

Create:

```text
Shakila Glamping
Shakila Jeep Tour
```

---

## Seed Glamping

```text
Deluxe Dome
4 units

Family Dome
2 units
```

---

## Seed Jeep

```text
Sunrise Adventure
Full Adventure Experience

8 Jeep units
departure slots
```

---

## Seed Customers

Target:

```text
30
```

fictional customers.

---

## Seed Bookings

Target:

```text
48
```

with valid physical reservations.

---

## Seed Payments

Target:

```text
55–60 attempts
```

including:

- success,
- partial,
- failed,
- retry,
- optional review case.

---

## Seed Blocks

At least:

```text
1 Glamping block
1 Jeep block
```

---

## Seed Time Strategy

Dates relative to:

```text
today Asia/Jakarta
```

---

## Safety

Seed must not:

- send Resend email,
- create Pakasir transaction,
- call R2 unnecessarily.

---

## Scripts

Target:

```text
npm run db:seed
npm run db:reset
```

local reset protected against production.

---

## Exit Criteria

- [ ] Admin-ready dataset exists.
- [ ] Inventory constraints still pass.
- [ ] No overlap corruption.
- [ ] Confirmed bookings have valid payment.
- [ ] Relative dates work.
- [ ] Reseed is documented.

---

# M4 — Booking Domain Engine

## Goal

Implement critical booking business logic independent of UI.

This is one of the most important milestones.

---

## Implement Core Domain

In:

```text
@booking/booking
```

minimum:

```text
calculateDp()
calculateGlampingPrice()
calculateJeepPrice()

validateBookingTransition()

calculateAccommodationAvailability()
calculateJeepAvailability()

createGlampingBooking()
createJeepBooking()

expireBooking()

checkInBooking()
checkOutBooking()
cancelBooking()
```

Names may differ but responsibilities must stay centralized.

---

## Customer Normalization

Implement:

```text
normalizeEmail()
normalizeWhatsApp()
```

---

## Booking Code

Concurrency-safe booking code generation.

No:

```text
COUNT(*) + 1
```

---

## Inventory Allocation

Glamping:

- final availability,
- physical unit assignment,
- DB transaction,
- exclusion protection.

Jeep:

- date + slot allocation,
- transaction,
- partial unique protection.

---

## Booking Creation

Must create atomically:

```text
booking
detail
reservation rows
logical payment
event
```

---

## Idempotency

Support:

```text
client_idempotency_key
```

---

## Booking Expiration

Implement domain function.

Background scheduling comes later.

---

## Tests

Critical:

```text
DP calculation
pricing
guest capacity
invalid date
quantity
last-unit race
Glamping overlap
Jeep collision
expiration
cancel release
check-in rules
```

---

## Exit Criteria

- [ ] Booking domain works without UI.
- [ ] Double booking prevented.
- [ ] Snapshot pricing correct.
- [ ] Cancellation releases inventory.
- [ ] Expiration releases inventory.
- [ ] Check-in requires confirmed DP.
- [ ] Unit/integration tests pass.

---

# M5 — Central Public API

## Goal

Expose booking engine through Central API following `API.md`.

---

## Implement Public Endpoints

```text
GET  /public/businesses/:slug

GET  /public/glamping/types
GET  /public/glamping/types/:slug
POST /public/glamping/availability

GET  /public/jeep/packages
GET  /public/jeep/packages/:slug
POST /public/jeep/availability

POST /public/bookings/quote
POST /public/bookings

GET  /public/bookings/:bookingCode/status
POST /public/bookings/lookup
```

Payment endpoints can initially return unsupported until M8 if needed, but routes should not fake success.

---

## Contracts

Implement shared Zod schemas in:

```text
@booking/contracts
```

---

## Response Envelope

Use documented standardized:

```text
data
error
meta
```

---

## Turnstile

May be integrated now or M8/M15 depending environment availability.

However interface/validation boundary should be prepared.

---

## Booking Access Token

Implement secure short-lived booking scope token.

Required for:

```text
status
invoice
payment attempt
```

---

## API Errors

Map DB/domain errors to stable API codes.

No raw PostgreSQL errors.

---

## CORS

Configure local customer origins.

---

## Exit Criteria

- [ ] Glamping availability works over HTTP.
- [ ] Jeep availability works over HTTP.
- [ ] Quote works.
- [ ] Real booking can be created.
- [ ] Idempotent duplicate submission works.
- [ ] Booking lookup ownership works.
- [ ] Status endpoint secured.
- [ ] API tests pass.

---

# M6 — Glamping Website

## Goal

Build polished customer-facing Glamping experience.

Do not integrate payment fully until M8, but full flow until payment handoff must work.

---

## Brand

Implement:

```text
Shakila Glamping
```

visual identity according to `UI-UX-SPEC.md`.

---

## Routes

Minimum:

```text
/
 /stay
 /stay/[slug]
 /availability
 /booking
 /booking/payment
 /booking/success
 /booking/check
```

---

## Landing

Implement:

- header,
- hero,
- quick availability,
- accommodations,
- experience,
- gallery,
- testimonials,
- FAQ,
- CTA,
- footer.

No placeholder assets in critical demo.

---

## Availability

Connect to Central API.

Must handle:

```text
loading
available
limited
full
no result
error
```

---

## Booking

Implement:

- customer form,
- guest selector,
- unit quantity,
- quote,
- summary,
- DP,
- remaining amount,
- inventory conflict state.

---

## Responsive

Manually test at:

```text
375
768
1440
```

---

## Exit Criteria

- [ ] Glamping looks brand-specific.
- [ ] Availability real.
- [ ] Booking real.
- [ ] Pricing real.
- [ ] Mobile works.
- [ ] No default shadcn look.
- [ ] Payment handoff ready.

---

# M7 — Jeep Website

## Goal

Build Jeep customer site with genuinely different visual identity.

---

## Brand

```text
Shakila Jeep Tour
```

---

## Routes

```text
/
 /packages
 /packages/[slug]
 /availability
 /booking
 /booking/payment
 /booking/success
 /booking/check
```

---

## Landing

Implement:

- bold hero,
- package selector,
- adventure packages,
- destination imagery,
- route/timeline,
- fleet,
- testimonials,
- FAQ,
- CTA.

---

## Availability

Use:

```text
package
date
departure slot
guest count
quantity
```

---

## Booking

Show:

```text
price per Jeep
quantity
capacity
total
DP
remaining
```

---

## Visual Rule

Do not reuse Glamping page composition wholesale.

Shared functional primitives allowed.

---

## Exit Criteria

- [ ] Jeep visually distinct.
- [ ] Package API real.
- [ ] Availability real.
- [ ] Booking real.
- [ ] Capacity logic clear.
- [ ] Mobile flow works.

---

# M8 — Pakasir Payment Integration

## Goal

Connect real/test Pakasir flow.

---

## Payment Adapter

Implement in:

```text
@booking/payment
```

Responsibilities:

```text
create payment attempt
normalize provider response
verify transaction
map status
validate amount
idempotency
```

---

## Public Payment Endpoint

Implement:

```text
POST /public/bookings/:bookingCode/payments
```

---

## Pakasir Webhook

Implement:

```text
POST /webhooks/pakasir
```

---

## Critical Rules

Never trust redirect.

Webhook must:

```text
verify
lock
detect duplicate
validate amount
update payment
confirm booking
commit
```

---

## Late Payment

Implement:

```text
requires_review
```

behavior from business rules.

---

## Payment Pages

Connect both customer websites.

Support:

```text
pending
verification
success
failure/retry
expired
network uncertainty
```

---

## Polling

Short-term booking status polling.

Do not poll indefinitely.

---

## Tests

Required:

- payment success,
- duplicate webhook,
- failed payment,
- retry,
- mismatch,
- timely payment with delayed callback if practical,
- expired late payment.

---

## Exit Criteria

- [ ] Real/test Pakasir payment can be initiated.
- [ ] Webhook changes DB.
- [ ] Booking only confirmed after verified DP.
- [ ] Duplicate webhook safe.
- [ ] UI redirect alone cannot confirm payment.
- [ ] Payment retry works.

---

# M9 — Invoice + Resend

## Goal

Complete post-payment workflow.

---

## Invoice

Implement:

```text
@booking/invoice
```

Using server-side PDF generation.

PDF includes all required invoice data.

---

## R2

Configure private Cloudflare R2 bucket.

Store:

```text
r2_object_key
```

not permanent public URL.

---

## Resend

Implement:

```text
@booking/email
```

with React Email templates.

---

## Workflow

After verified payment:

```text
booking confirmed
↓
background event
↓
invoice generation
↓
R2 upload
↓
email send
```

---

## Inngest

Configure background workflows:

```text
payment/verified
invoice/generated
booking expiration
email retry
```

---

## Secure Invoice Access

Implement:

```text
GET public booking invoice
GET admin booking invoice
```

using signed URL or secure streaming.

---

## Failure Rules

Invoice/email failure must not rollback confirmed booking.

---

## Exit Criteria

- [ ] Invoice PDF real.
- [ ] R2 object private.
- [ ] Confirmation email real.
- [ ] Duplicate webhook does not duplicate invoice.
- [ ] Email retry possible.
- [ ] Success page handles pending invoice gracefully.

---

# M10 — Admin Authentication + Shell

## Goal

Create admin application foundation.

---

## Better Auth

Implement admin-only auth.

Customer auth remains absent.

---

## Admin Seed

Use environment:

```text
DEMO_ADMIN_EMAIL
DEMO_ADMIN_PASSWORD
```

---

## Admin Login

Build polished login screen.

---

## Admin Shell

Implement:

```text
Sidebar
Header
Business switcher
Profile
Responsive drawer
```

---

## Routes

Prepare:

```text
/login
/dashboard
/bookings
/calendar
/payments
/customers
/glamping
/jeep
/settings
```

---

## Security

Admin APIs require authenticated active admin.

---

## Exit Criteria

- [ ] Admin login works.
- [ ] Unauthorized blocked.
- [ ] Session works.
- [ ] Logout works.
- [ ] Admin shell responsive.
- [ ] No customer auth added.

---

# M11 — Admin Booking Operations

## Goal

Make live booking fully operational from admin.

---

## Booking List

Implement:

```text
search
business filter
booking status
payment status
date filter
pagination
```

Server-side.

---

## Booking Detail

Display:

```text
customer
reservation
physical assignment
pricing
payment
invoice
timeline
special request
statuses
```

---

## Check-In

Implement explicit endpoint + confirmation dialog.

---

## Check-Out

Implement explicit endpoint.

---

## Cancellation

Require:

```text
reason
optional note
```

If paid, show refund warning.

---

## Timeline

Display booking events.

---

## Exit Criteria

- [ ] Live booking visible in list.
- [ ] Detail complete.
- [ ] Check-in real.
- [ ] Check-out real.
- [ ] Cancel releases inventory.
- [ ] Timeline updates.
- [ ] No generic status editing.

---

# M12 — Calendar + Inventory Operations

## Goal

Implement operational availability calendar and blocking.

---

## Calendar

Glamping:

```text
date
type
occupied
held
blocked
available
```

Jeep:

```text
date
slot
occupied
held
blocked
available
```

---

## Calendar UI

Desktop month calendar.

Day drawer.

Mobile/tablet fallback.

---

## Inventory Units

Expose internal physical resources in admin.

---

## Blocking

Implement:

```text
Create block
Remove block
```

Glamping:

```text
unit + date range
```

Jeep:

```text
unit + date + optional slot
```

---

## Conflict

Block request with active reservation must fail.

---

## Exit Criteria

- [ ] Calendar reflects DB.
- [ ] Hold visible in occupancy.
- [ ] Blocks reduce availability.
- [ ] Block conflict safe.
- [ ] Removing block restores availability.

---

# M13 — Dashboard + Customers + Payments

## Goal

Complete operational admin visibility.

---

## Dashboard

Implement:

```text
Revenue Received
Booking Value
Booking Count
Today's Bookings
Upcoming Reservations
Outstanding
```

All derived from DB.

---

## Chart

Implement real aggregate chart.

Do not hardcode.

---

## Recent Bookings

Real DB query.

---

## Payments

Implement list/detail.

Show:

```text
provider
amount
method
status
booking
review flag
```

---

## Customers

Implement:

```text
list
search
detail
cross-business booking history
verified spending
```

---

## Basic Product Management

Glamping:

```text
name
description
price
active
```

Jeep:

same relevant fields.

---

## Exit Criteria

- [ ] Dashboard populated from seed.
- [ ] Live payment changes revenue.
- [ ] Customers cross-business visible.
- [ ] Payment retry history visible.
- [ ] Historical snapshot unaffected by product edit.

---

# M14 — UI/UX Polish

## Goal

Bring entire demo to client-ready visual quality.

---

## Customer Polish

Review all:

```text
Glamping
Jeep
```

for:

- spacing,
- typography,
- assets,
- animation,
- hover,
- forms,
- mobile,
- loading,
- empty,
- errors,
- success.

---

## Admin Polish

Review:

- sidebar,
- KPI,
- chart,
- booking table,
- booking detail,
- timeline,
- calendar,
- filters,
- dialogs,
- responsive behavior.

---

## Remove

All:

```text
Lorem Ipsum
TODO
placeholder
unstyled error
raw API message
broken empty state
```

---

## Accessibility

Review:

- labels,
- focus,
- dialogs,
- keyboard,
- contrast.

---

## Performance

Optimize:

- images,
- client component boundaries,
- unnecessary queries,
- layout shift.

---

## Exit Criteria

- [ ] No obvious AI/template feel.
- [ ] Glamping and Jeep clearly distinct.
- [ ] Admin feels professional.
- [ ] Mobile customer UX strong.
- [ ] Loading/error states polished.
- [ ] No visible placeholders.

---

# M15 — Testing + Demo Readiness

## Goal

Verify the exact client presentation workflow.

---

## Unit Tests

Ensure core coverage:

```text
pricing
DP
statuses
availability
booking transitions
payment normalization
```

---

## Integration Tests

Critical:

```text
DB constraints
concurrent booking
expiration
payment idempotency
invoice uniqueness
```

---

## Playwright E2E

Create minimum:

### Glamping

```text
availability
→ booking
→ payment test adapter/provider
→ confirmed
```

### Jeep

```text
availability
→ booking
```

### Admin

```text
login
→ booking detail
→ check-in
```

---

## Manual Demo Test

Execute actual story:

```text
Glamping landing
↓
availability
↓
booking
↓
Pakasir
↓
confirmed
↓
email
↓
invoice
↓
admin
↓
new booking
↓
seeded same-day check-in
↓
Jeep site
```

---

## Browser Review

Customer:

```text
375
768
1440
```

Admin:

```text
1024
1440
1920
```

---

## Failure Simulation

Manually verify:

```text
inventory conflict
payment pending
network failure
expired booking
invalid lookup
admin unauthorized
```

---

## Demo Prep

Ensure:

```text
recommended Glamping date available
recommended Jeep date available
seed dashboard populated
email inbox available
Pakasir environment operational
```

---

## Exit Criteria

- [ ] Critical E2E green.
- [ ] Manual demo works without intervention.
- [ ] No broken page.
- [ ] Live booking visible in admin.
- [ ] Invoice/email real.
- [ ] Demo can be repeated safely.

---

# M16 — Deployment

## Goal

Deploy client demo environment.

---

## External Services

Configure:

```text
Neon
Vercel
Cloudflare DNS
Cloudflare R2
Cloudflare Turnstile
Pakasir
Resend
Inngest
Sentry
```

---

## Vercel Projects

Create:

```text
glamping
jeep
admin
api
```

from same monorepo.

---

## Domains

Suggested:

```text
glamping.<domain>
jeep.<domain>
admin.<domain>
api.<domain>
```

---

## Database

Run migrations.

Seed controlled demo data.

Do not run destructive reset accidentally.

---

## Pakasir

Configure demo/test/production-compatible credentials.

Webhook URL points to deployed API.

---

## Resend

Configure verified sender domain.

---

## R2

Ensure:

```text
bucket private
signed access working
```

---

## Better Auth

Verify production cookie/session behavior across domains.

---

## Turnstile

Add production hostnames.

---

## Sentry

Enable error reporting.

---

## Production Verification

Run:

```text
health
login
availability
booking
payment
webhook
invoice
email
admin
```

---

## Exit Criteria

- [ ] All URLs HTTPS.
- [ ] Apps communicate correctly.
- [ ] Admin session works.
- [ ] Pakasir webhook works.
- [ ] Resend delivers.
- [ ] R2 invoice downloads.
- [ ] Turnstile works.
- [ ] Sentry receives errors.
- [ ] Client demo environment stable.

---

# 7. P0 / P1 / P2 Priority

## P0 — Must Work

```text
Repository
Database
Seed
Booking engine
Availability
Glamping booking
Jeep booking
Pakasir DP
Payment verification
Invoice
Email
Admin login
Booking list
Booking detail
Check-in
```

If any P0 is broken:

demo is not ready.

---

## P1 — Strong Demo

```text
Calendar
Inventory block
Dashboard
Customers
Payments
Timeline polish
Responsive polish
Error states
Animations
```

---

## P2 — Nice to Have

```text
Advanced chart filtering
Invoice/email retry UI
Payment detail page polish
Advanced product management
Additional animations
Minor dashboard customization
```

P2 must not delay P0/P1.

---

# 8. Features Explicitly Out of Scope

Codex must not implement unless specification is changed:

```text
Homestay website
Customer login
Customer dashboard
Customer reschedule
Customer cancellation
Promo codes
Vouchers
Dynamic pricing
Weekend pricing rules
Tax engine
Automated refunds
Online balance payment
Loyalty
Affiliate
OTA integration
WhatsApp API
Google Calendar sync
Accounting
Advanced CRM
Multi-currency
Multi-language
Dark mode
Complex RBAC UI
```

---

# 9. Stop Conditions

Codex should stop and report rather than invent major policy if:

```text
business rule conflicts
schema cannot preserve invariant
Pakasir behavior differs materially from docs
Better Auth deployment assumption invalid
Neon constraint not supported
R2 integration incompatible
```

Minor implementation details can be solved without stopping.

---

# 10. Codex Milestone Prompt Pattern

When starting a milestone, use a prompt like:

```text
Read all relevant files in /docs first.

Implement Milestone M0 from
docs/IMPLEMENTATION-PLAN.md only.

Do not start M1.

Follow:
PRD.md
ARCHITECTURE.md
BUSINESS-RULES.md
DATABASE.md
API.md
UI-UX-SPEC.md
DEMO-DATA.md

Use npm only.

After implementation:
1. run relevant lint
2. run typecheck
3. run tests
4. run build
5. summarize changes
6. list any deviations or unresolved issues

Do not change business rules or architecture unless required
and explicitly report any necessary documentation change.
```

---

# 11. Codex Review Pattern

After each milestone:

```text
Review your implementation against the milestone acceptance criteria.

Check for:
- missing requirements,
- accidental scope expansion,
- duplicate logic,
- security issues,
- TypeScript errors,
- broken tests,
- architecture violations.

Fix issues found, then report final status.
```

---

# 12. Implementation Order Rule

Do not reorder:

```text
Database
before
Booking Domain

Booking Domain
before
Customer Booking UI

Booking Verification
before
Admin Operational Actions
```

UI marketing work can happen earlier, but critical booking flow must still follow dependency order.

---

# 13. Do Not Optimize Too Early

Avoid:

```text
premature generic abstraction
microservices
complex event sourcing
custom design system package for every visual
advanced caching infrastructure
```

Solve current documented scope cleanly.

---

# 14. No Fake Completion

A milestone is not complete if:

```text
button exists but handler is TODO

UI displays hardcoded availability

payment page fakes success

invoice download opens placeholder

dashboard numbers hardcoded

admin check-in changes only local state
```

All critical functionality must be connected end-to-end.

---

# 15. Definition of Project Done

Project demo is considered complete when the following exact story works:

```text
Customer opens Glamping site
↓
selects dates and guests
↓
sees real availability
↓
selects a Glamping type
↓
enters customer information
↓
server creates real booking
↓
physical inventory is held
↓
customer sees real DP amount
↓
customer pays through Pakasir
↓
server verifies payment
↓
booking becomes CONFIRMED
↓
invoice PDF is generated
↓
invoice stored in private R2
↓
confirmation email is delivered through Resend
↓
customer sees confirmed success page
↓
admin logs in
↓
new booking appears in dashboard/list
↓
admin opens booking
↓
customer/payment/invoice/timeline visible
↓
admin performs valid Check-In
↓
status and timeline update
↓
Jeep website demonstrates a second,
different inventory model using the same system
```

---

# 16. Final Documentation Sequence

At completion of this document:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅
DATABASE.md               ✅
API.md                    ✅
UI-UX-SPEC.md             ✅
DEMO-DATA.md              ✅
IMPLEMENTATION-PLAN.md    ✅

AGENTS.md                 ← NEXT

CODING                    ← AFTER AGENTS.md
```

---

# 17. Next Step

Create:

```text
AGENTS.md
```

at the **repository root**, not inside `/docs`.

Its job is different from the specification documents.

`AGENTS.md` will act as the permanent operational instruction for Codex, defining:

```text
which docs must be read
npm-only rule
source-of-truth hierarchy
allowed architecture
coding standards
commands to run
scope rules
milestone discipline
documentation update rules
security rules
do-not-do rules
definition of completion
```

After `AGENTS.md` is in place, coding begins with:

```text
M0 — Repository Foundation
```

and Codex should be instructed to implement **M0 only**.
