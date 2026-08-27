# AGENTS.md

# Booking Demo — Codex Repository Instructions

This file contains permanent repository-level instructions for coding agents.

These instructions apply to all work performed in this repository unless a more specific `AGENTS.md` exists deeper in the directory tree.

---

# 1. Project Context

This repository contains a functional booking-system demo for multiple tourism/hospitality businesses.

Demo v1 contains:

- Shakila Glamping customer website.
- Shakila Jeep Tour customer website.
- Central Admin Dashboard.
- Central API/backend.
- Shared booking, payment, invoice, email, authentication, validation, and database packages.

The demo must behave like a real product with limited scope, not like a clickable prototype.

Core transactional workflows must be real.

---

# 2. Documentation Is the Source of Truth

Before making substantial changes, read the relevant files under `/docs`.

The main documentation files are:

```text
docs/PRD.md
docs/ARCHITECTURE.md
docs/BUSINESS-RULES.md
docs/DATABASE.md
docs/API.md
docs/UI-UX-SPEC.md
docs/DEMO-DATA.md
docs/IMPLEMENTATION-PLAN.md
```

Do not implement a feature solely from assumptions when the documentation already defines its behavior.

---

# 3. Documentation Precedence

If requirements appear ambiguous or contradictory, use this precedence:

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

`IMPLEMENTATION-PLAN.md` determines implementation order but does not override higher-level business requirements.

---

# 4. Do Not Silently Change Requirements

Do not silently:

- change business rules,
- change booking lifecycle,
- change payment lifecycle,
- change inventory rules,
- change DP requirements,
- change hold duration,
- change architecture,
- add customer authentication,
- add new major features.

If implementation genuinely requires a documented design change:

1. explain the issue,
2. propose the smallest safe change,
3. update the relevant documentation,
4. then update the implementation.

---

# 5. Milestone Discipline

Development is milestone-based.

The milestones are defined in:

```text
docs/IMPLEMENTATION-PLAN.md
```

When asked to implement one milestone:

- implement that milestone only,
- do not automatically start the next milestone,
- do not build future features merely because they seem convenient.

Example:

If instructed to implement:

```text
M0 — Repository Foundation
```

do not also implement:

```text
M1
M2
database schema
authentication
payments
```

unless explicitly required by M0.

---

# 6. Package Manager

This repository uses:

```text
npm
```

only.

Use:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

Do not introduce or use:

```text
pnpm
yarn
bun
```

Do not generate:

```text
pnpm-lock.yaml
yarn.lock
bun.lock
bun.lockb
```

The repository lockfile is:

```text
package-lock.json
```

---

# 7. Monorepo

The repository uses:

```text
Turborepo
+
npm Workspaces
```

Target application layout:

```text
apps/
├── glamping
├── jeep
├── admin
└── api
```

Target shared packages:

```text
packages/
├── database
├── booking
├── payment
├── invoice
├── email
├── auth
├── validation
├── contracts
├── ui
├── eslint-config
└── typescript-config
```

---

# 8. Shared Package Namespace

Shared packages should use the namespace:

```text
@booking/*
```

Examples:

```text
@booking/database
@booking/booking
@booking/payment
@booking/contracts
@booking/ui
```

Keep naming consistent.

---

# 9. Architecture Principle

The primary architecture principle is:

> Multiple storefronts, one operational system.

Glamping and Jeep have different customer experiences but share:

- database,
- customer records,
- booking domain,
- payment infrastructure,
- invoice infrastructure,
- admin operations.

---

# 10. Central API Rule

Critical business operations must pass through:

```text
apps/api
```

Customer applications must not access the database directly.

Forbidden:

```text
apps/glamping → database
apps/jeep → database
browser → database
```

Admin operational actions should also use the Central API boundary.

---

# 11. Thin Route Handlers

API route handlers should primarily:

```text
authenticate
validate
call domain service
map result
map errors
```

Do not place large booking/payment transactions directly inside Next.js route files.

Critical business logic belongs in shared domain packages.

---

# 12. Booking Logic

Shared booking logic belongs in:

```text
@booking/booking
```

Do not implement separate booking engines for:

```text
Glamping
Jeep
Admin
```

Business-specific strategies are allowed, but common lifecycle logic must remain centralized.

---

# 13. Database

Use:

```text
PostgreSQL
Neon
Drizzle ORM
```

Do not replace PostgreSQL with:

- SQLite,
- MongoDB,
- Firebase,
- Supabase DB abstraction,
- another independent database.

Do not create one database per business.

---

# 14. Database Source of Truth

Database schema belongs in:

```text
packages/database
```

Use Drizzle schemas and migrations.

Production/demo schema changes must be represented through migration files.

Do not rely on manual dashboard edits as the normal migration process.

---

# 15. Financial Data

Currency for Demo v1:

```text
IDR
```

Financial amounts must not use floating-point persistence.

Store rupiah amounts as integer values.

Example:

```text
Rp850.000
→
850000
```

Do not store business-critical amounts as JavaScript floating-point decimals.

---

# 16. Historical Pricing

Bookings must use financial/product snapshots.

Changing current product price must not modify:

- historical booking totals,
- historical unit price,
- historical invoices.

Never recalculate old booking prices from current product configuration.

---

# 17. Booking Status

Supported Demo v1 booking statuses:

```text
PENDING
WAITING_PAYMENT
CONFIRMED
CHECKED_IN
CHECKED_OUT
COMPLETED
CANCELLED
EXPIRED
```

Do not invent additional status values without updating the specification.

---

# 18. Payment Status

Payment status is separate from booking status.

Supported values:

```text
UNPAID
PENDING
PARTIALLY_PAID
PAID
FAILED
EXPIRED
REFUNDED
```

Never collapse booking status and payment status into one field.

---

# 19. DP Requirement

Default demo DP:

```text
30%
```

but it must be configuration-driven.

Do not hardcode 30% throughout frontend components.

Booking is confirmed only when the required DP threshold has been verified server-side.

---

# 20. Booking Hold

Default temporary hold:

```text
30 minutes
```

but it must be configurable.

The server stores authoritative:

```text
expires_at
```

The browser countdown is presentation only.

---

# 21. Inventory Rules

Availability is derived from:

```text
physical units
active reservations
inventory blocks
```

Do not create a mutable availability counter as the source of truth.

---

# 22. Glamping Inventory

Glamping uses:

```text
Accommodation Type
↓
Physical Accommodation Units
```

Customer selects:

```text
type
quantity
dates
guest count
```

Customer does not select a specific physical dome/unit.

The system assigns physical units internally.

---

# 23. Glamping Date Range

Accommodation reservation semantics:

```text
[check_in_date, check_out_date)
```

Check-out date is excluded from occupancy.

Therefore:

```text
29 Aug → 30 Aug
```

and:

```text
30 Aug → 31 Aug
```

may use the same physical unit.

---

# 24. Jeep Inventory

Jeep uses:

```text
Package
Tour Date
Departure Slot
Physical Jeep Unit
```

Customer selects quantity, not Jeep number.

A Jeep may be reused on another defined departure slot on the same date for Demo v1.

---

# 25. No Overbooking

No normal execution path may result in inventory overselling.

Final inventory validation occurs when booking is created.

Availability search is informative only.

Concurrency protection must include database-level safeguards as specified in `DATABASE.md`.

---

# 26. Concurrency

Never rely solely on:

```text
SELECT available count
↓
INSERT booking
```

without concurrency protection.

Critical booking allocation must use:

- PostgreSQL transaction,
- appropriate locking/allocation strategy,
- database constraint as final guard.

---

# 27. Payment Provider

Payment provider:

```text
Pakasir
```

All secret provider operations occur server-side.

Never expose provider secrets to browser code.

---

# 28. Payment Authority

The browser payment success redirect is never authoritative.

Forbidden logic:

```ts
if (searchParams.status === "success") {
  booking.status = "CONFIRMED";
}
```

Payment must be verified server-side.

---

# 29. Pakasir Webhook

Webhook processing must be:

- validated,
- verified,
- transactional,
- idempotent.

Duplicate callbacks must not produce:

- duplicate payment amounts,
- duplicate booking confirmation,
- duplicate invoice,
- duplicate logical confirmation email.

---

# 30. Late Payment

A payment received after booking expiration must not blindly reactivate the booking.

If inventory integrity cannot be guaranteed:

```text
booking remains EXPIRED
requires_review = true
```

Follow `BUSINESS-RULES.md`.

---

# 31. Payment Amount Validation

Always compare provider-verified payment amount against authoritative expected amount.

Do not confirm a booking on amount mismatch.

Use appropriate payment exception handling.

---

# 32. External Provider Calls

Do not hold long-running database transactions open while waiting for external HTTP APIs unless technically unavoidable.

Prefer:

```text
short DB transaction
↓
provider call
↓
short DB transaction
```

where domain correctness allows it.

---

# 33. Invoice

Invoices are generated server-side.

Invoice data must come from historical booking snapshots.

A DP invoice must clearly show:

```text
Total
Paid
Remaining
```

Do not label a partial DP invoice:

```text
LUNAS
```

---

# 34. Invoice Storage

Invoice storage:

```text
Cloudflare R2
```

Bucket should remain private.

Database stores:

```text
R2 object key
```

not a permanent public file URL.

Customer/admin access should use secure server delivery or short-lived signed URLs.

---

# 35. Email

Email provider:

```text
Resend
```

Templates:

```text
React Email
```

Confirmation email is sent only after booking has actually been confirmed.

---

# 36. Background Jobs

Use:

```text
Inngest
```

for appropriate asynchronous work such as:

- booking expiration,
- invoice generation,
- email sending,
- email retry.

Critical payment verification must not depend entirely on a later async worker.

---

# 37. External Side-Effect Failure

The following failures do not invalidate an already verified booking:

```text
invoice generation failure
R2 upload failure
Resend failure
```

Booking remains confirmed.

The failed side effect should be retriable.

---

# 38. Customer Authentication

Demo v1 has:

```text
NO CUSTOMER LOGIN
```

Do not implement:

- customer account,
- customer registration,
- customer password,
- customer dashboard.

Customer booking lookup uses:

```text
Booking Code
+
Email or WhatsApp
```

---

# 39. Customer Booking Privacy

Booking code alone must not reveal customer booking information.

Public booking status/invoice endpoints require appropriate booking ownership/session token.

---

# 40. Admin Authentication

Admin authentication uses:

```text
Better Auth
```

Do not invent a custom authentication system unless documented integration proves impossible.

Admin authorization must be enforced server-side.

---

# 41. Secrets

Never commit:

```text
DATABASE_URL
PAKASIR_API_KEY
RESEND_API_KEY
R2 credentials
BETTER_AUTH_SECRET
INNGEST secrets
TURNSTILE_SECRET_KEY
```

Use environment variables.

Maintain:

```text
.env.example
```

with variable names only.

---

# 42. Public Environment Variables

Only intentionally public values may use:

```text
NEXT_PUBLIC_*
```

Never place server secrets under `NEXT_PUBLIC_`.

---

# 43. Forms

Preferred form stack:

```text
React Hook Form
Zod
```

Client validation improves UX.

Server validation remains authoritative.

---

# 44. API Contracts

Shared request/response contracts belong in:

```text
@booking/contracts
```

Use Zod where appropriate.

Do not redefine the same API request type independently in:

```text
glamping
jeep
admin
api
```

---

# 45. API Naming

Database:

```text
snake_case
```

API/TypeScript:

```text
camelCase
```

Enums:

```text
UPPER_SNAKE_CASE
```

Business slugs:

```text
glamping
jeep
```

---

# 46. API Errors

Frontend should react to stable:

```text
error.code
```

not exact message strings.

Never expose raw:

- SQL errors,
- stack traces,
- provider secrets,
- internal exception details

to customer-facing responses.

---

# 47. Admin Commands

Do not expose a generic endpoint that allows arbitrary booking status mutation.

Forbidden concept:

```text
PATCH /bookings/:id
{
  "status": "CHECKED_IN"
}
```

Use explicit domain commands:

```text
check-in
check-out
cancel
```

so business rules cannot be bypassed.

---

# 48. Check-In

Check-in requires:

```text
booking = CONFIRMED
required DP satisfied
valid reservation date
```

Full payment is not required for Demo v1.

Do not allow unpaid check-in.

---

# 49. Cancellation

Booking cancellation and payment refund are separate concepts.

Cancelling:

```text
CONFIRMED booking
```

must not automatically set:

```text
payment = REFUNDED
```

Automated refunds are out of scope.

---

# 50. Product Changes

Demo product management allows limited edits such as:

- name,
- description,
- price,
- active state.

Do not implement advanced product management unless requested by the milestone.

Products with historical bookings should not be hard-deleted.

Use active/inactive semantics.

---

# 51. Demo Data

Seed data must be stored in PostgreSQL as normal records.

Do not use:

```text
fakeBookings.ts
fakeDashboardData.ts
hardcoded revenue arrays
```

as the real admin data source.

---

# 52. Seed External Side Effects

Ordinary:

```bash
npm run db:seed
```

must not:

- create real Pakasir payments,
- send real Resend emails,
- trigger customer notifications.

Seed external history through database records only.

---

# 53. Demo Dates

Seed operational dates relative to current business date.

Do not permanently hardcode demo occupancy to August 2026.

The demo should remain useful after time passes.

---

# 54. UI Stack

Use:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui primitives
Lucide Icons
```

Use Server Components by default when appropriate.

Use Client Components only where interactivity requires them.

---

# 55. UI Quality

Do not ship a default shadcn-template appearance.

shadcn is a primitive library, not the final design language.

Glamping, Jeep, and Admin each have distinct design requirements in:

```text
docs/UI-UX-SPEC.md
```

---

# 56. Glamping Visual Identity

Glamping should feel:

```text
premium
warm
natural
calm
hospitality-oriented
```

Do not make it look like an admin/SaaS page.

---

# 57. Jeep Visual Identity

Jeep should feel:

```text
bold
adventurous
cinematic
premium
outdoor-oriented
```

Do not implement the Jeep site as a recolored copy of Glamping.

---

# 58. Admin Visual Identity

Admin should feel:

```text
professional
operational
clean
dense but readable
modern SaaS
```

Do not turn the admin into a marketing website.

---

# 59. Forced UI Reuse

Do not create shared components merely because two components are both "cards."

Share:

```text
behavior
domain-neutral primitives
```

Do not force shared branding/layout between customer businesses.

---

# 60. Responsive Requirements

Customer applications must work well on:

```text
mobile
tablet
desktop
```

Mobile customer flow is a first-class requirement.

Admin prioritizes desktop/tablet but must not break on mobile.

---

# 61. Loading States

Critical user actions must show intentional states such as:

```text
Checking availability...
Creating booking...
Preparing payment...
Verifying payment...
```

Avoid frozen interfaces.

---

# 62. Payment Uncertainty UX

A browser/network failure while checking status must not be shown as confirmed payment failure.

Use wording equivalent to:

```text
We could not verify the payment status yet.
The payment may still have been received.
```

Then allow status recheck.

---

# 63. Error States

Never render raw API/provider errors directly to customers.

Map domain errors to understandable UI copy.

---

# 64. Empty States

Implement proper empty states for relevant:

```text
booking lists
search results
calendar days
availability
customers
payments
```

---

# 65. Placeholder Content

Critical demo pages must not contain:

```text
TODO
Lorem Ipsum
Coming Soon
placeholder.svg
fake availability
hardcoded payment success
```

---

# 66. Images

Client-facing demo assets must look intentional.

Avoid:

- visible watermarks,
- broken images,
- placeholder blocks,
- severely mismatched imagery.

---

# 67. TypeScript

Use TypeScript strict mode.

Avoid `any`.

Do not silence errors with:

```text
@ts-ignore
as any
```

unless absolutely necessary and documented.

Never disable type checking simply to make the build pass.

---

# 68. Code Organization

Prefer feature/domain organization over giant files.

Avoid:

```text
2000-line route handler
1500-line page component
one giant utils.ts
```

Split based on responsibility.

Do not create unnecessary abstraction layers either.

---

# 69. Dependency Discipline

Before installing a new dependency, check:

1. Is the capability already available?
2. Does the dependency solve a real documented requirement?
3. Is it compatible with the stack?
4. Does it duplicate an existing package?
5. Does it introduce unnecessary infrastructure?

Do not install dependencies casually.

---

# 70. No Overengineering

Do not introduce:

```text
microservices
Kafka
RabbitMQ
Kubernetes
event sourcing platform
multiple databases
GraphQL
Redis
Elasticsearch
```

unless requirements are intentionally revised.

The intended architecture is a modular monolith.

---

# 71. Server Actions

Do not use Next.js Server Actions to bypass the documented Central API boundary for critical cross-app business logic.

Server Actions may be used only for app-local UI behavior where appropriate.

---

# 72. Testing Stack

Use:

```text
Vitest
```

for unit/integration testing where appropriate.

Use:

```text
Playwright
```

for E2E.

---

# 73. Critical Tests

Do not consider the booking core complete without tests covering:

- Glamping overlap.
- Glamping checkout boundary.
- Jeep same-slot collision.
- Jeep different-slot reuse.
- Last-inventory concurrency.
- Booking expiration.
- Cancellation inventory release.
- Payment idempotency.
- Payment amount validation.
- Check-in requirements.

---

# 74. Test Real Domain Logic

External services may be mocked in automated tests.

However critical booking and inventory logic should be tested against real PostgreSQL where integration behavior matters.

---

# 75. Quality Commands

Before declaring work complete, run the relevant available commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If E2E exists and the changed functionality is covered:

```bash
npm run test:e2e
```

---

# 76. Do Not Fake Passing Checks

Do not:

- delete failing tests,
- disable lint rules broadly,
- exclude broken files,
- add `|| true`,
- suppress build errors,

just to report success.

Fix the underlying issue.

---

# 77. Existing Repository Work

Preserve existing user work.

Do not unnecessarily overwrite files outside the current task.

Before large changes:

- inspect repository state,
- understand existing files,
- preserve documentation,
- avoid destructive resets.

---

# 78. Git

Do not run destructive Git commands such as:

```text
git reset --hard
git clean -fd
```

unless explicitly requested.

Do not overwrite unrelated user changes.

---

# 79. Generated Files

Do not manually edit generated files where a source/generator exists unless required.

Examples include:

- package lock internals,
- generated migration metadata.

Use proper tooling.

Migration SQL itself should still be reviewed.

---

# 80. Documentation Maintenance

If implementation meaningfully changes:

- architecture,
- API,
- database design,
- business behavior,

update the corresponding docs in the same milestone.

Minor code organization changes do not require unnecessary documentation churn.

---

# 81. Scope Discipline

Do not implement out-of-scope features just because they would be "nice."

Explicit Demo v1 exclusions include:

```text
Homestay
Customer Login
Customer Dashboard
Customer Rescheduling
Self-Service Cancellation
Vouchers
Promo Codes
Dynamic Pricing
Automated Refunds
Balance Payment Online
Loyalty
Affiliate
OTA
WhatsApp API
Google Calendar Sync
Accounting Integration
Advanced CRM
Multi-Currency
Multi-Language
Dark Mode
Advanced RBAC
```

---

# 82. Homestay

Homestay is a future extension.

The architecture should remain extensible to Homestay, but do not build:

```text
apps/homestay
```

during Demo v1.

---

# 83. Fail-Safe Business Rule

For undefined edge cases involving critical booking/payment state:

1. preserve data integrity,
2. do not overbook,
3. do not confirm payment without proof,
4. do not confirm booking without valid conditions,
5. record the exception when appropriate,
6. surface it for admin review.

Fail safely rather than inventing a risky automatic resolution.

---

# 84. Security First

Never trade correctness/security for demo convenience on critical operations.

Do not add:

```text
"Mark as Paid"
"Force Confirm"
"Skip Payment"
```

customer/demo shortcuts to the real operational flow.

Test utilities may exist only in isolated test environments.

---

# 85. Browser Storage

Do not use localStorage/sessionStorage as the authoritative source for:

- booking,
- payment,
- inventory,
- admin authentication,
- invoice.

Browser storage may hold non-critical UI convenience state only.

---

# 86. Customer Booking Flow

The target Glamping flow is:

```text
Availability
↓
Booking
↓
Physical Inventory Hold
↓
Pakasir DP
↓
Server Verification
↓
Confirmed Booking
↓
Invoice
↓
Resend Email
↓
Admin Operations
```

Do not bypass any critical state.

---

# 87. Admin Demo Flow

The target admin story is:

```text
Login
↓
Overview
↓
Booking appears
↓
Open Booking
↓
Customer
Reservation
Payment
Invoice
Timeline
↓
Valid Check-In
```

Ensure implementation supports this smoothly.

---

# 88. Definition of Functional Completion

A feature is not complete merely because its page exists.

A critical feature is complete only when:

```text
UI
↓
API
↓
Domain logic
↓
Database
```

are connected and produce the documented real state.

---

# 89. No Fake Dashboard

Dashboard metrics must come from database queries.

Forbidden final implementation:

```ts
const revenue = 38_750_000;
const bookings = 48;
```

Seed records should naturally produce meaningful dashboard metrics.

---

# 90. No Fake Availability

Forbidden:

```ts
const availableUnits = 3;
```

in customer business flow.

Availability must derive from:

```text
units
reservations
blocks
```

---

# 91. No Fake Invoice

Any invoice shown/downloadable in a live booking flow must be a real generated PDF.

---

# 92. No Fake Email

The final presentation flow must use actual configured Resend delivery.

Historical seed events may be represented without resending historical messages.

---

# 93. No Fake Check-In

Admin check-in must persist to PostgreSQL and update booking events.

Do not update only React/TanStack state.

---

# 94. Performance

Avoid obvious:

- N+1 DB queries,
- unnecessary full-table fetching,
- client-side filtering of large admin datasets,
- huge client bundles.

Admin lists must support server-side pagination/filtering.

---

# 95. Caching

Be conservative with transactional caching.

Do not allow stale caching for:

```text
availability
booking status
payment status
admin booking detail
```

unless explicit invalidation is implemented.

Public marketing content may be cached more aggressively.

---

# 96. Date Handling

Reservation dates are business-local dates.

Use:

```text
Asia/Jakarta
```

as current demo business timezone.

Do not accidentally shift:

```text
2026-08-30
```

to another date because of browser/UTC conversion.

---

# 97. Current Date Logic

Rules such as:

- past reservation rejection,
- same-day check-in,
- upcoming reservation,

must use business timezone rather than browser timezone.

---

# 98. Public Copy

Primary customer interface should be polished Indonesian-first.

Avoid inconsistent random language mixing.

Marketing headlines may use English sparingly if intentional.

---

# 99. Indonesian Currency Formatting

Display:

```text
Rp850.000
```

not:

```text
Rp850,000.00
```

unless a specific external provider UI dictates otherwise.

---

# 100. Completion Report

After implementing a milestone, report:

1. what changed,
2. key files/packages affected,
3. tests/checks executed,
4. their results,
5. any unresolved issue,
6. any documentation deviation,
7. whether milestone acceptance criteria are satisfied.

Do not claim tests passed if they were not run.

---

# 101. First Implementation Milestone

The first milestone after repository documentation is complete is:

```text
M0 — Repository Foundation
```

from:

```text
docs/IMPLEMENTATION-PLAN.md
```

When instructed to implement M0:

- inspect current Turborepo starter,
- preserve `/docs`,
- create final app structure,
- configure npm workspaces/Turbo correctly,
- verify builds,
- stop after M0.

Do not start M1 automatically.

---

# 102. Core Reminder

When uncertain, prioritize in this order:

```text
Data integrity
↓
Business correctness
↓
Security
↓
Functional completeness
↓
User experience
↓
Code elegance
```

Do not sacrifice the first four merely to make the demo easier to implement.
