# Technical Architecture

## Product Demo — Glamping, Jeep & Central Admin Booking System

**Document:** `ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** Architecture Baseline — Demo v1  
**Package Manager:** npm  
**Repository:** Turborepo Monorepo  
**Related Document:** `docs/PRD.md`

---

# 1. Purpose

Dokumen ini mendefinisikan arsitektur teknis untuk Product Demo Booking System yang terdiri dari:

1. Glamping Customer Website
2. Jeep Customer Website
3. Central Admin Dashboard
4. Central API / Backend
5. Shared PostgreSQL Database
6. Payment, Invoice, Email, dan Background Workflow

Dokumen ini menjadi technical source of truth.

`PRD.md` menjelaskan **apa yang harus dibuat**.

`ARCHITECTURE.md` menjelaskan **bagaimana sistem tersebut dibangun secara teknis**.

Implementasi tidak boleh mengambil keputusan arsitektur besar yang bertentangan dengan dokumen ini tanpa memperbarui dokumentasi terlebih dahulu.

---

# 2. Architecture Goals

Arsitektur harus memenuhi tujuan berikut.

## 2.1 Centralized

Walaupun Glamping dan Jeep mempunyai website berbeda, keduanya harus menggunakan:

- Database yang sama.
- Booking engine yang sama.
- Payment service yang sama.
- Invoice service yang sama.
- Customer data yang sama.
- Admin dashboard yang sama.

Tidak boleh ada database terpisah untuk setiap bisnis.

---

## 2.2 Reusable

Logic umum tidak boleh diduplikasi antara:

- Glamping.
- Jeep.
- Admin.

Contoh logic yang harus reusable:

- Booking code generation.
- DP calculation.
- Payment verification.
- Booking status.
- Invoice generation.
- Customer handling.
- Audit event.
- Currency formatting.
- Validation.

---

## 2.3 Extendable

Demo hanya mencakup:

```text
Glamping
Jeep
```

Tetapi architecture harus memungkinkan penambahan:

```text
Homestay
```

tanpa membangun ulang sistem dari awal.

---

## 2.4 Production-Oriented Demo

Demo bukan mock application.

Core workflow menggunakan:

- Real database.
- Real transaction.
- Real payment integration.
- Real invoice.
- Real email.
- Real booking lifecycle.

UI boleh menggunakan seeded historical data, tetapi core transactional workflow tidak boleh menggunakan fake implementation.

---

## 2.5 Maintainable by One Developer

Architecture tidak boleh overengineered.

Hindari:

- Microservices.
- Kubernetes.
- Message broker terpisah.
- Multiple databases.
- Event infrastructure kompleks.
- Infrastructure yang tidak diperlukan untuk demo.

Gunakan modular monolith dengan centralized API.

---

# 3. High-Level Architecture

```text
                       CUSTOMER
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      GLAMPING WEBSITE             JEEP WEBSITE
         Next.js                     Next.js
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                    CENTRAL API
                       Next.js
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      PostgreSQL        Pakasir          Inngest
          │                                 │
          │                         ┌───────┴───────┐
          │                         ▼               ▼
          │                       Resend            R2
          │
          │
          ▲
          │
     ADMIN DASHBOARD
        Next.js
```

Semua transactional operation melewati Central API.

---

# 4. Deployment Units

Monorepo memiliki empat application deployment.

```text
apps/
├── glamping
├── jeep
├── admin
└── api
```

## 4.1 `apps/glamping`

Customer-facing website untuk bisnis Glamping.

Responsibilities:

- Marketing pages.
- Glamping type presentation.
- Availability search UI.
- Booking flow.
- Payment initiation UI.
- Payment status UI.
- Booking confirmation.
- Booking lookup.
- Invoice download initiation.

Tidak memiliki direct database access.

---

## 4.2 `apps/jeep`

Customer-facing website untuk bisnis Jeep.

Responsibilities:

- Marketing pages.
- Package presentation.
- Jeep availability UI.
- Booking flow.
- Payment initiation UI.
- Booking confirmation.
- Booking lookup.

Tidak memiliki direct database access.

---

## 4.3 `apps/admin`

Central Admin Dashboard.

Responsibilities:

- Admin authentication UI.
- Overview dashboard.
- Booking management.
- Payment management.
- Customer management.
- Calendar.
- Check-in/check-out.
- Block dates.
- Product basic management.

Admin menggunakan Central API untuk transactional data.

Tidak melakukan business logic kritis di browser.

---

## 4.4 `apps/api`

Central backend application.

Dibangun menggunakan Next.js server capabilities dan Route Handlers.

Responsibilities:

```text
Authentication
Booking
Availability
Inventory
Customer
Payment
Pakasir webhook
Invoice
Email orchestration
Admin operations
Check-in/check-out
Calendar data
Product configuration
Audit events
Background workflow endpoints
```

Hanya `apps/api` dan authorized server-side scripts yang boleh melakukan database access secara langsung.

---

# 5. Why Dedicated Central API

Tidak boleh membuat booking API sendiri di:

```text
apps/glamping
apps/jeep
```

Contoh architecture yang dilarang:

```text
Glamping
└── /api/bookings

Jeep
└── /api/bookings
```

Karena dapat menghasilkan dua implementasi business rules yang berbeda.

Yang benar:

```text
Glamping ─┐
          │
Jeep ─────┼──► Central API ──► Booking Core
          │
Admin ────┘
```

Dengan demikian seluruh bisnis menggunakan source of truth yang sama.

---

# 6. Monorepo

Project menggunakan:

```text
npm
+
npm Workspaces
+
Turborepo
```

Tidak menggunakan:

```text
pnpm
yarn
bun
```

Seluruh command package manager harus menggunakan `npm`.

---

# 7. Target Repository Structure

```text
booking-demo/
│
├── apps/
│   │
│   ├── glamping/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── public/
│   │
│   ├── jeep/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── public/
│   │
│   ├── admin/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   │
│   └── api/
│       ├── app/
│       ├── lib/
│       └── instrumentation.ts
│
├── packages/
│   │
│   ├── database/
│   │
│   ├── booking/
│   │
│   ├── payment/
│   │
│   ├── invoice/
│   │
│   ├── email/
│   │
│   ├── auth/
│   │
│   ├── validation/
│   │
│   ├── contracts/
│   │
│   ├── ui/
│   │
│   ├── eslint-config/
│   │
│   └── typescript-config/
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── BUSINESS-RULES.md
│   ├── DATABASE.md
│   ├── UI-UX-SPEC.md
│   ├── API.md
│   ├── DEMO-DATA.md
│   └── IMPLEMENTATION-PLAN.md
│
├── scripts/
│
├── package.json
├── package-lock.json
├── turbo.json
├── .gitignore
├── .env.example
└── README.md
```

---

# 8. Workspace Naming

Shared package menggunakan namespace:

```text
@booking/*
```

Contoh:

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

Nama final dapat disesuaikan ketika repository foundation dibuat, tetapi harus konsisten.

---

# 9. Package Responsibilities

## 9.1 `@booking/database`

Responsibilities:

- Drizzle schema.
- Database connection.
- Database migrations.
- Database types.
- Transaction helpers.
- Seed helpers.

Tidak berisi UI.

---

## 9.2 `@booking/booking`

Core booking domain logic.

Responsibilities:

```text
Booking lifecycle
Availability calculation
Inventory reservation
Temporary hold
Booking expiration
Booking code generation
Pricing snapshot
DP calculation
Check-in rules
Check-out rules
```

Business rule tidak boleh dibuat ulang di frontend.

---

## 9.3 `@booking/payment`

Payment abstraction.

Initial provider:

```text
Pakasir
```

Responsibilities:

- Create payment.
- Verify transaction.
- Normalize provider response.
- Validate payment amount.
- Payment status mapping.
- Payment idempotency logic.

Frontend tidak mengakses Pakasir API secret secara langsung.

---

## 9.4 `@booking/invoice`

Responsibilities:

- Invoice model.
- Invoice number generation.
- PDF generation.
- Invoice storage orchestration.
- Invoice rendering.

PDF implementation default:

```text
@react-pdf/renderer
```

atau compatible server-side PDF renderer apabila ditemukan compatibility issue.

Perubahan library tidak boleh mengubah invoice domain contract.

---

## 9.5 `@booking/email`

Responsibilities:

- React Email templates.
- Booking confirmation.
- Invoice email.
- Email rendering.
- Resend integration helper.

Provider:

```text
Resend
```

---

## 9.6 `@booking/auth`

Responsibilities:

- Better Auth configuration.
- Admin authentication.
- Session helpers.
- Authorization helpers.

Customer tidak menggunakan authentication system ini.

---

## 9.7 `@booking/validation`

Shared validation primitives.

Menggunakan:

```text
Zod
```

Contoh:

- Email.
- Phone/WhatsApp.
- Date range.
- Guest count.
- Booking code.
- Currency amount.
- Environment validation.

---

## 9.8 `@booking/contracts`

Shared API contracts.

Responsibilities:

- Request schemas.
- Response schemas.
- API DTO.
- Shared enums exposed to clients.

Contoh:

```text
AvailabilityRequest
AvailabilityResponse
CreateBookingRequest
BookingResponse
PaymentResponse
BookingLookupRequest
```

Package ini boleh digunakan oleh:

```text
glamping
jeep
admin
api
```

Dengan demikian frontend dan backend tidak mendefinisikan payload masing-masing secara manual.

---

## 9.9 `@booking/ui`

Shared UI primitives yang benar-benar reusable.

Contoh:

- Status badge.
- Currency display.
- Date display.
- Form primitives.
- Loading state.
- Dialog primitives.

`@booking/ui` **tidak boleh membuat Glamping dan Jeep terlihat identik**.

Brand-specific UI tetap tinggal di masing-masing app.

---

# 10. Dependency Direction

Dependency harus bergerak ke arah domain/shared package.

Allowed:

```text
apps/glamping
   ↓
contracts
validation
ui

apps/jeep
   ↓
contracts
validation
ui

apps/admin
   ↓
contracts
validation
ui

apps/api
   ↓
database
booking
payment
invoice
email
auth
contracts
validation
```

Core package dapat bergantung pada:

```text
booking → database
payment → contracts / validation
invoice → database where required
email → shared types
auth → database
```

Frontend tidak boleh bergantung pada:

```text
@booking/database
@booking/payment
@booking/auth server internals
```

---

# 11. Technology Stack

## 11.1 Runtime & Language

```text
Node.js
TypeScript
```

Gunakan current stable versions yang compatible pada saat setup.

Tidak perlu memaksa exact version di architecture document.

Version harus dikunci melalui:

```text
package.json
package-lock.json
```

---

# 12. Frontend Framework

```text
Next.js
React
Next.js App Router
```

Gunakan Server Components sebagai default.

Gunakan Client Components hanya saat diperlukan untuk:

- Interactive calendar.
- Forms.
- Payment status polling.
- Filters.
- Dialog.
- Interactive dashboard controls.

Jangan menambahkan `"use client"` pada seluruh page tanpa alasan.

---

# 13. Styling

```text
Tailwind CSS
shadcn/ui
Lucide Icons
```

shadcn digunakan sebagai **component primitive**, bukan final visual language.

Tidak diperbolehkan membuat customer website terlihat seperti:

```text
default shadcn demo
```

Brand-specific styles berada di app masing-masing.

---

# 14. Forms

Gunakan:

```text
React Hook Form
+
Zod
```

Validation dilakukan di dua sisi:

```text
Client
+
Server
```

Server validation selalu authoritative.

Client validation hanya untuk UX.

---

# 15. Data Fetching

Gunakan kombinasi:

```text
React Server Components
Native fetch
TanStack Query
```

TanStack Query digunakan terutama untuk state yang highly interactive:

- Availability.
- Admin filters.
- Payment status polling.
- Calendar updates.
- Booking lookup.

Jangan menggunakan TanStack Query untuk semua data tanpa alasan.

---

# 16. Database

Primary database:

```text
PostgreSQL
```

Managed provider:

```text
Neon
```

ORM:

```text
Drizzle ORM
```

Database merupakan satu centralized database untuk seluruh business.

---

# 17. Database Access Rule

Direct database access hanya diizinkan dari:

```text
apps/api
@booking/database
authorized migration/seed scripts
background server workflows
```

Dilarang:

```text
apps/glamping → database
apps/jeep → database
browser → database
```

Admin juga menggunakan API sebagai operational boundary.

---

# 18. Database Schema Source of Truth

Source of truth:

```text
packages/database/src/schema/*
```

Migration:

```text
Drizzle migrations
```

Generated migration harus disimpan dalam Git.

Production tidak boleh menggunakan schema mutation manual.

---

# 19. Migration Rules

Local development dapat menggunakan migration workflow yang convenient.

Production/staging:

```text
Generate Migration
↓
Review SQL
↓
Commit Migration
↓
Apply Migration
```

Jangan melakukan perubahan production schema melalui dashboard database secara manual kecuali emergency.

---

# 20. Seed Strategy

Demo membutuhkan seeded historical data.

Seed script harus deterministic.

Contoh:

```text
npm run db:seed
```

Seed menghasilkan:

- Business.
- Admin.
- Glamping types.
- Glamping units.
- Jeep packages.
- Jeep units.
- Departure slots.
- Historical customers.
- Historical bookings.
- Historical payments.
- Analytics-supporting records.

Seed tidak boleh mengubah business logic agar fake booking terlihat real.

---

# 21. Business Model Strategy

System menggunakan satu `business` abstraction.

Initial businesses:

```text
GLAMPING
JEEP
```

Future:

```text
HOMESTAY
```

Business-specific behavior tidak boleh ditentukan menggunakan scattered conditional seperti:

```ts
if (business === "glamping") ...
```

di banyak tempat.

Gunakan centralized domain strategy/service.

Conceptually:

```text
Booking Engine
     │
     ├── Accommodation Inventory Strategy
     │       └── Glamping
     │       └── Future Homestay
     │
     └── Vehicle / Activity Inventory Strategy
             └── Jeep
```

Exact implementation ditentukan saat implementation apabila tidak perlu formal class pattern.

Tujuan utamanya adalah **tidak menduplikasi business rules**.

---

# 22. Availability Architecture

Availability endpoint hanya memberikan snapshot.

Contoh:

```text
GET availability
↓
3 units available
```

Result tersebut **tidak menjamin inventory tetap tersedia** sampai booking dibuat.

Authoritative availability check harus dilakukan kembali ketika:

```text
POST Create Booking
```

---

# 23. Concurrency Architecture

System harus mencegah double booking.

Critical booking creation menggunakan:

```text
PostgreSQL transaction
+
database locking / concurrency-safe strategy
```

Conceptually:

```text
Begin Transaction
      ↓
Lock relevant inventory scope
      ↓
Recalculate availability
      ↓
Available?
   ┌──┴──┐
  No    Yes
  │      │
Reject   Create booking
         Create hold
         Commit
```

Exact PostgreSQL locking strategy didefinisikan di:

```text
DATABASE.md
```

Availability UI tidak boleh menjadi mekanisme concurrency protection.

---

# 24. Booking Lifecycle

Conceptual lifecycle:

```text
PENDING
   ↓
WAITING_PAYMENT
   ↓
CONFIRMED
   ↓
CHECKED_IN
   ↓
CHECKED_OUT
   ↓
COMPLETED
```

Alternative paths:

```text
WAITING_PAYMENT
   ↓
EXPIRED

CONFIRMED
   ↓
CANCELLED
```

Detailed state transition berada di:

```text
BUSINESS-RULES.md
```

---

# 25. Temporary Hold Architecture

Ketika booking menunggu DP:

```text
Booking
WAITING_PAYMENT

expires_at
30 minutes
```

Inventory harus dianggap occupied selama hold masih aktif.

Expiration tidak bergantung pada browser customer.

Server/background workflow menangani expiration.

---

# 26. Background Workflow

Background workflow menggunakan:

```text
Inngest
```

Use cases:

- Booking hold expiration.
- Invoice generation.
- Confirmation email.
- Retry email.
- Non-blocking post-payment tasks.

---

# 27. Booking Expiration Workflow

Conceptual:

```text
Booking created
       ↓
expires_at stored
       ↓
Emit booking.created
       ↓
Inngest sleep until expires_at
       ↓
Read latest booking
       ↓
Still WAITING_PAYMENT?
   ┌───────┴───────┐
  Yes              No
   │                │
Expire         Do nothing
   │
Release inventory
   │
Add audit event
```

Status database selalu dicek ulang sebelum expiration.

Background event tidak boleh blindly mengubah state.

---

# 28. Payment Provider

Payment gateway:

```text
Pakasir
```

Pakasir integration hanya dilakukan pada server.

Client tidak menerima:

- Secret key.
- Server credential.
- Webhook verification credential.

---

# 29. Payment Architecture

```text
Customer
   ↓
Create Booking
   ↓
Central API
   ↓
Booking WAITING_PAYMENT
   ↓
Create Pakasir Transaction
   ↓
Return payment information
   ↓
Customer pays
   ↓
Pakasir
   ↓
Webhook
   ↓
Central API
   ↓
Verify transaction
   ↓
Database transaction
   ↓
Payment updated
Booking confirmed
   ↓
payment.verified event
```

---

# 30. Payment Redirect Rule

Customer returning to:

```text
/booking/success
```

does not prove payment success.

Success page must obtain current payment/booking state from Central API.

Conceptually:

```text
Payment Provider Redirect
        ↓
Success Page
        ↓
GET Booking Status
        ↓
PENDING?
Poll briefly
        ↓
CONFIRMED?
Render success
```

Frontend never manually changes payment status.

---

# 31. Payment Verification

Webhook handler harus:

1. Parse provider payload.
2. Resolve internal booking/payment.
3. Validate expected amount.
4. Validate order/reference.
5. Verify transaction against Pakasir server API when supported/required.
6. Normalize provider status.
7. Perform database update transactionally.
8. Handle duplicate webhook safely.

---

# 32. Payment Idempotency

Payment processing wajib idempotent.

Repeated webhook:

```text
Webhook #1
Webhook #2
Webhook #3
```

harus menghasilkan:

```text
1 payment state transition
1 invoice
1 booking confirmation
1 logical confirmation email workflow
```

Database harus mempunyai appropriate unique constraints/idempotency key.

Detailed schema berada di `DATABASE.md`.

---

# 33. Payment and Booking Separation

Payment status dan booking status adalah domain berbeda.

Contoh:

```text
Booking:
CONFIRMED

Payment:
PARTIALLY_PAID
```

Karena customer baru membayar DP.

Jangan menggunakan satu field `status` untuk keduanya.

---

# 34. Invoice Architecture

Invoice dibuat setelah required DP berhasil diverifikasi.

Workflow:

```text
Payment Verified
       ↓
Emit payment.verified
       ↓
Generate Invoice
       ↓
Generate PDF
       ↓
Upload Cloudflare R2
       ↓
Persist invoice metadata
       ↓
Send Confirmation Email
```

---

# 35. Invoice Generation

PDF dilakukan server-side.

Suggested implementation:

```text
React-based PDF renderer
```

Invoice data harus berasal dari booking snapshot.

Invoice tidak boleh mengambil current product price ketika PDF dibuat.

---

# 36. Invoice Storage

Storage:

```text
Cloudflare R2
```

Bucket:

```text
Private
```

Suggested object structure:

```text
invoices/
├── glamping/
│   └── 2026/
│       └── 08/
│           └── INV-260830-0012.pdf
│
└── jeep/
    └── 2026/
        └── 08/
            └── INV-260830-0018.pdf
```

Database menyimpan:

- Object key.
- Invoice number.
- Generated timestamp.
- File metadata where necessary.

---

# 37. Invoice Access

Invoice tidak boleh menggunakan permanent public URL.

Access dilakukan melalui:

```text
Authorized Admin Request
```

atau:

```text
Verified Customer Booking Lookup
```

Server kemudian memberikan:

- Short-lived signed URL, atau
- Secure download response.

---

# 38. Email Architecture

Email provider:

```text
Resend
```

Email templates:

```text
React Email
```

Initial email:

```text
Booking Confirmation + Invoice
```

Email sending dilakukan melalui background workflow agar webhook payment dapat merespons cepat.

---

# 39. Email Failure

Email failure tidak boleh membatalkan payment atau booking.

Contoh:

```text
Payment verified ✅
Booking confirmed ✅
Invoice generated ✅
Email failed ❌
```

Booking tetap confirmed.

Background job melakukan retry email.

Admin timeline/log dapat menunjukkan failure apabila diperlukan.

---

# 40. Authentication

Customer:

```text
NO AUTH
```

Admin:

```text
Better Auth
```

Admin authentication berada pada centralized authentication configuration.

---

# 41. Admin Session

Admin session harus:

- Secure.
- HTTP-only where applicable.
- Production HTTPS only.
- Server validated.
- Have expiration.

Admin authorization tidak boleh hanya berdasarkan UI visibility.

API admin endpoint harus memverifikasi authenticated session.

---

# 42. Admin Authorization

Demo v1 hanya membutuhkan satu admin.

Architecture tetap harus memungkinkan role future:

```text
SUPER_ADMIN
ADMIN
STAFF
```

Tidak perlu membuat full permission management UI dalam demo.

Authorization helper harus dapat diperluas.

---

# 43. Central API Design

Public API menggunakan versioned path:

```text
/api/v1/*
```

Example:

```text
/api/v1/public/availability
/api/v1/public/bookings
/api/v1/public/bookings/lookup

/api/v1/admin/bookings
/api/v1/admin/calendar
/api/v1/admin/payments
/api/v1/admin/customers

/api/v1/webhooks/pakasir
```

Exact endpoint specification dibuat di:

```text
API.md
```

---

# 44. Public vs Admin APIs

API routes dibagi jelas.

## Public

Digunakan oleh customer websites.

Contoh:

- Product listing.
- Availability.
- Booking creation.
- Payment initiation.
- Booking lookup.
- Booking status.

## Admin

Memerlukan authenticated admin session.

Contoh:

- Booking list.
- Booking detail.
- Check-in.
- Check-out.
- Block date.
- Payments.
- Customers.
- Product editing.

## Webhook

Tidak menggunakan admin authentication.

Webhook memiliki provider-specific verification.

---

# 45. API Response Standard

API harus menggunakan consistent response model.

Success example concept:

```json
{
  "data": {},
  "error": null
}
```

Error example:

```json
{
  "data": null,
  "error": {
    "code": "INVENTORY_NOT_AVAILABLE",
    "message": "Selected inventory is no longer available."
  }
}
```

Exact format diputuskan di `API.md`.

Frontend tidak boleh bergantung pada arbitrary error string.

Gunakan stable error code.

---

# 46. Error Handling

Domain errors harus distinguishable.

Examples:

```text
INVALID_INPUT
INVENTORY_NOT_AVAILABLE
BOOKING_EXPIRED
BOOKING_NOT_FOUND
PAYMENT_NOT_VERIFIED
PAYMENT_AMOUNT_MISMATCH
CHECK_IN_NOT_ALLOWED
UNAUTHORIZED
FORBIDDEN
RATE_LIMITED
INTERNAL_ERROR
```

User-facing copy dapat berbeda dari internal error message.

---

# 47. Input Validation

Semua public/admin API input harus divalidasi server-side menggunakan Zod.

Dilarang melakukan:

```text
req.json()
↓
direct database insert
```

tanpa validation.

---

# 48. Customer Booking Lookup

Customer tidak memiliki akun.

Lookup flow:

```text
Booking Code
+
Email / WhatsApp
       ↓
Central API
       ↓
Verify ownership
       ↓
Return limited booking information
```

Untuk protected follow-up request seperti invoice, API dapat menerbitkan short-lived lookup authorization token.

Booking code saja tidak cukup sebagai authorization.

---

# 49. Security Boundaries

Secret hanya berada server-side.

Contoh secret:

```text
DATABASE_URL
PAKASIR_API_KEY
RESEND_API_KEY
R2_SECRET_ACCESS_KEY
BETTER_AUTH_SECRET
INNGEST_SIGNING_KEY
TURNSTILE_SECRET_KEY
```

Tidak boleh menggunakan prefix:

```text
NEXT_PUBLIC_
```

untuk secret.

---

# 50. Public Environment Variables

Frontend hanya boleh menerima public configuration.

Contoh:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
NEXT_PUBLIC_APP_URL
```

Tidak boleh ada provider secret.

---

# 51. Environment Strategy

Minimum environments:

```text
local
preview/staging
production/demo
```

Demo client menggunakan environment terpisah dari local development.

Database demo tidak boleh menggunakan local developer database.

---

# 52. Environment Files

Repository menyediakan:

```text
.env.example
```

File ini hanya berisi variable names dan documentation.

Dilarang commit:

```text
.env
.env.local
real API keys
database credentials
```

---

# 53. Cloudflare Usage

Cloudflare digunakan untuk:

```text
DNS
R2
Turnstile
```

Primary Next.js hosting:

```text
Vercel
```

Architecture tidak bergantung pada Cloudflare Workers untuk menjalankan Next.js.

---

# 54. DNS Architecture

Suggested domains:

```text
glamping.demo-domain.com
jeep.demo-domain.com
admin.demo-domain.com
api.demo-domain.com
```

Atau real custom domain apabila nanti client menyediakan domain.

Cloudflare mengelola DNS.

Vercel mengelola application deployment.

---

# 55. Cloudflare R2

R2 hanya digunakan untuk object storage seperti:

- Invoice.
- Future uploaded media.

Tidak digunakan sebagai database.

---

# 56. Cloudflare Turnstile

Turnstile digunakan pada high-risk public flow.

Minimum:

```text
Booking creation
Booking lookup
```

Optional:

```text
Contact form
```

Turnstile validation dilakukan server-side.

Frontend token saja tidak dianggap valid.

---

# 57. API Origin Policy

Central API hanya menerima browser request dari known origins.

Initial allowlist:

```text
Glamping URL
Jeep URL
Admin URL
localhost development URLs
```

CORS tidak boleh menggunakan unrestricted `*` pada credential-sensitive endpoint.

---

# 58. Local Development Ports

Recommended:

```text
Glamping
http://localhost:3000

Jeep
http://localhost:3001

Admin
http://localhost:3002

API
http://localhost:3003
```

Ports boleh berubah apabila conflict, tetapi dokumentasi dan environment harus konsisten.

---

# 59. Root Development Commands

Target root commands:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

Database:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

E2E:

```bash
npm run test:e2e
```

Exact scripts dibuat saat Foundation milestone.

---

# 60. Turborepo Tasks

Expected tasks:

```text
dev
build
lint
typecheck
test
```

Build dependency:

```text
^build
```

Environment dependency harus dideklarasikan apabila mempengaruhi build caching.

Secrets tidak boleh tersimpan dalam turbo config.

---

# 61. Testing Strategy

Testing bukan optional untuk core booking flow.

## Unit Test

Tool:

```text
Vitest
```

Minimum target:

- DP calculation.
- Pricing snapshot calculation.
- Booking status transition.
- Payment normalization.
- Booking code generation.
- Availability helper where possible.

---

# 62. Integration Tests

Integration test fokus pada:

- Database booking creation.
- Inventory concurrency.
- Booking expiration.
- Payment idempotency.
- Check-in rule.
- Invoice state.

Integration tests dapat menggunakan dedicated test database.

---

# 63. End-to-End Tests

Tool:

```text
Playwright
```

Critical demo E2E:

```text
Glamping:
Search availability
→ Booking
→ Payment simulated/test mode
→ Confirmation

Jeep:
Search availability
→ Booking

Admin:
Login
→ See booking
→ Open detail
→ Check-in
```

Real external provider production payment tidak perlu dijalankan pada setiap automated test.

Provider adapter dapat memiliki sandbox/test fixture apabila tersedia.

---

# 64. Observability

Error monitoring:

```text
Sentry
```

Enable pada:

```text
glamping
jeep
admin
api
```

Priority terutama:

```text
API
Payment webhook
Booking creation
Background workflow
Invoice generation
```

---

# 65. Audit Logging

Sentry bukan audit trail.

Business event disimpan ke database.

Minimum events:

```text
BOOKING_CREATED
PAYMENT_CREATED
PAYMENT_VERIFIED
BOOKING_CONFIRMED
BOOKING_EXPIRED
INVOICE_GENERATED
EMAIL_SENT
EMAIL_FAILED
CHECKED_IN
CHECKED_OUT
BOOKING_CANCELLED
```

Admin timeline dibangun dari audit/business event.

---

# 66. Request Correlation

Critical API request sebaiknya memiliki request/correlation ID.

Terutama:

```text
Booking creation
Payment webhook
Invoice generation
```

ID dapat dicatat pada server log untuk debugging.

Tidak wajib ditampilkan ke customer.

---

# 67. Date & Time Strategy

Database timestamp disimpan menggunakan timezone-aware timestamp.

Internally:

```text
UTC
```

Display menggunakan business timezone.

Initial target:

```text
Asia/Jakarta
```

atau timezone lokasi bisnis setelah dikonfirmasi.

Jangan bergantung pada timezone browser untuk menentukan reservation date.

---

# 68. Date-Only Business Values

Values seperti:

```text
Glamping check-in date
Glamping check-out date
Jeep tour date
```

harus diperlakukan sebagai business-local dates.

Jangan secara tidak sengaja mengubah tanggal akibat UTC conversion.

Detailed storage type ditentukan di `DATABASE.md`.

---

# 69. Currency

Initial currency:

```text
IDR
```

Financial amount tidak disimpan menggunakan floating point.

Gunakan integer smallest practical unit.

Untuk IDR:

```text
Rp850.000
```

disimpan conceptually:

```text
850000
```

bukan:

```text
850000.00 floating point
```

---

# 70. Financial Snapshot Rule

Booking menyimpan financial snapshot.

Contoh:

```text
product_name
unit_price
quantity
subtotal
service_amount
total_amount
dp_percentage
dp_amount
remaining_amount
```

Perubahan harga product di kemudian hari tidak boleh mengubah booking lama.

---

# 71. UI Architecture — Glamping

Glamping menggunakan domain-specific components.

Suggested:

```text
features/
├── availability/
├── booking/
├── accommodation/
└── booking-lookup/
```

Marketing section tidak perlu menjadi reusable package lintas Jeep apabila visualnya berbeda.

---

# 72. UI Architecture — Jeep

Jeep memiliki domain presentation sendiri.

Suggested:

```text
features/
├── packages/
├── availability/
├── booking/
└── booking-lookup/
```

Booking primitive dapat menggunakan shared contracts, tetapi UX boleh berbeda.

---

# 73. UI Architecture — Admin

Admin feature-based organization:

```text
features/
├── dashboard/
├── bookings/
├── calendar/
├── payments/
├── customers/
├── inventory/
└── settings/
```

Jangan menaruh seluruh dashboard logic dalam satu page component besar.

---

# 74. Frontend API Client

Masing-masing frontend memiliki thin API client.

Conceptually:

```text
lib/api/
```

Responsibilities:

- Base URL.
- Request.
- Response parsing.
- Shared contract validation where appropriate.
- Error normalization.

Frontend API client tidak berisi domain business logic.

---

# 75. No Direct Third-Party Access from Browser

Browser tidak melakukan direct secret API integration dengan:

```text
Pakasir server API
Resend
R2 administrative API
Neon
Inngest secret endpoints
```

Browser selalu melewati Central API apabila secret diperlukan.

---

# 76. Payment UI Boundary

Frontend hanya mengetahui:

```text
Booking ID
Payment state
Provider checkout/payment information required for user flow
```

Frontend tidak menentukan:

```text
verified = true
```

---

# 77. Background Event Naming

Recommended event namespace:

```text
booking/created
booking/expired
payment/verified
invoice/generated
email/booking-confirmation.requested
```

Exact naming boleh berubah tetapi harus consistent.

---

# 78. External Service Failure Strategy

## Pakasir unavailable

Booking dapat gagal membuat payment transaction dengan user-friendly retry state.

Jangan membuat booking confirmed.

## Resend unavailable

Booking tetap confirmed.

Email retry melalui background workflow.

## R2 unavailable

Invoice generation workflow retry.

Booking tetap confirmed.

## Inngest delayed

Core payment verification tetap dilakukan synchronously sebelum webhook response.

Post-payment side effect dapat diproses ulang.

---

# 79. Critical Synchronous vs Async Work

## Synchronous

Harus selesai sebelum API menganggap operation sukses:

```text
Validate booking
Check inventory
Reserve inventory
Create booking
Create payment reference
Verify payment webhook
Update payment
Confirm booking
```

## Async

Boleh dilakukan background:

```text
Generate invoice
Upload invoice
Send email
Analytics side effects
Non-critical notifications
```

---

# 80. Webhook Response Principle

Webhook harus melakukan minimum critical work.

Conceptually:

```text
Receive
↓
Validate
↓
Verify
↓
Transactional database update
↓
Emit background event
↓
Respond success
```

Jangan membuat webhook menunggu email delivery.

---

# 81. Performance Strategy

Customer sites:

- Use Next.js image optimization.
- Prefer Server Components.
- Lazy-load non-critical interactive code.
- Cache public product content when safe.
- Do not cache user booking status incorrectly.

API:

- Appropriate DB indexes.
- Avoid N+1 queries.
- Pagination on admin list.
- Availability queries optimized according to `DATABASE.md`.

---

# 82. Caching Rules

Safe to cache:

```text
Static marketing content
Product descriptions
Public images
Non-sensitive package information
```

Use caution:

```text
Prices
```

if admin can edit them.

Do not cache stale transactional data:

```text
Availability
Booking status
Payment status
Admin booking detail
```

without explicit invalidation strategy.

---

# 83. Admin Pagination

Booking/customer/payment lists harus menggunakan server-side pagination ketika data bertambah.

Demo tidak perlu virtual scrolling.

API contract harus mendukung pagination dari awal.

---

# 84. Search

Admin search dilakukan server-side.

Search target:

```text
Booking Code
Customer Name
Email
WhatsApp
```

Tidak mengambil seluruh database kemudian filter di browser.

---

# 85. Demo Data Separation

Seed data adalah normal database records.

Tidak boleh ada logic seperti:

```ts
if (DEMO_MODE) {
  return fakeBookings;
}
```

pada production demo flow.

Dashboard menggunakan database yang sama untuk seeded dan newly created booking.

---

# 86. Demo Mode Philosophy

Demo environment tetap menjalankan real application.

Perbedaannya hanya:

- Seeded historical records.
- Test/demo payment credentials jika diperlukan.
- Demo branding/domain.
- Limited product scope.

Tidak ada fake backend.

---

# 87. Media Strategy

Untuk initial demo, marketing media dapat tinggal di:

```text
apps/glamping/public
apps/jeep/public
```

Apabila admin-uploaded media dibuat setelah client approval, baru pindahkan ke R2 media workflow.

Invoice tetap menggunakan R2 sejak demo.

---

# 88. Accessibility

Customer booking flow harus menggunakan:

- Semantic HTML.
- Proper form labels.
- Keyboard accessible controls.
- Visible focus state.
- Sufficient contrast.
- Accessible dialog.

Calendar tidak boleh hanya mengandalkan warna untuk menyatakan status.

---

# 89. Browser Support

Target modern evergreen browsers:

```text
Chrome
Edge
Safari
Firefox
Mobile Chrome
Mobile Safari
```

Tidak diperlukan support Internet Explorer.

---

# 90. Code Quality

Project harus menggunakan:

```text
ESLint
Prettier
TypeScript strict mode
```

Hindari:

```text
any
```

kecuali benar-benar diperlukan dan diberi alasan.

Jangan menonaktifkan TypeScript error hanya untuk membuat build berhasil.

---

# 91. TypeScript Rules

Shared types harus berasal dari:

```text
database inferred types
shared contracts
domain types
```

Jangan membuat beberapa interface dengan struktur sama di setiap app.

---

# 92. Domain Constants

Business-critical constant jangan tersebar.

Contoh:

```text
default DP
hold duration
booking status
payment status
business code
timezone
```

harus centralized/configurable.

---

# 93. Configuration

Business configuration dapat berasal dari database.

Contoh:

```text
Business
DP percentage
Default hold duration
Check-in time
Check-out time
Business contact information
```

Application-level config tetap berada di environment/config files.

---

# 94. Feature Flags

Demo v1 tidak membutuhkan feature flag infrastructure kompleks.

Feature yang belum selesai jangan disembunyikan menggunakan random runtime flags.

Scope ditentukan melalui implementation milestone.

---

# 95. Deployment Architecture

Setiap app menjadi separate Vercel project dari monorepo yang sama.

Conceptually:

```text
Repository
│
├── Vercel Project: glamping
├── Vercel Project: jeep
├── Vercel Project: admin
└── Vercel Project: api
```

Semua menggunakan repository dan commit yang sama.

---

# 96. Deployment Dependencies

Shared external services:

```text
Neon PostgreSQL
Pakasir
Resend
Cloudflare R2
Inngest
Sentry
```

Environment variables dikonfigurasi per Vercel project sesuai kebutuhan.

---

# 97. Deployment Order

Initial environment setup:

```text
1. Database
2. API
3. Admin
4. Glamping
5. Jeep
6. Payment webhook
7. Background workflow
8. End-to-end validation
```

---

# 98. Git Strategy

Untuk demo cukup gunakan:

```text
main
```

plus short-lived feature branches jika diperlukan.

Tidak diperlukan Git Flow kompleks.

Setiap milestone sebaiknya menghasilkan commit yang jelas.

Example:

```text
feat: scaffold monorepo applications

feat: add database schema foundation

feat: implement booking hold engine

feat: add glamping booking flow
```

---

# 99. Codex Workflow

Codex harus bekerja secara milestone.

Sebelum implementasi milestone, Codex wajib membaca:

```text
docs/PRD.md
docs/ARCHITECTURE.md
docs/BUSINESS-RULES.md
docs/DATABASE.md
docs/UI-UX-SPEC.md
docs/IMPLEMENTATION-PLAN.md
```

sesuai dokumen yang sudah tersedia pada saat tersebut.

---

# 100. Codex Architecture Rules

Codex tidak boleh:

- Mengubah package manager dari npm.
- Menambahkan pnpm.
- Menambahkan Yarn.
- Menggunakan database kedua.
- Membuat booking logic terpisah di Glamping dan Jeep.
- Memberikan database credential ke frontend.
- Menganggap payment redirect sebagai verification.
- Menggunakan localStorage sebagai booking source of truth.
- Membuat fake booking backend.
- Membuat invoice palsu untuk final demo flow.
- Mengkonfirmasi booking sebelum DP verified.
- Menyimpan financial value menggunakan JavaScript floating point calculation tanpa safe strategy.
- Menghapus concurrency protection.
- Mengakses provider secret dari browser.
- Menambahkan customer authentication tanpa requirement.
- Membangun fitur Homestay pada demo v1.
- Melakukan large architectural refactor tanpa alasan.

---

# 101. Codex Dependency Rule

Sebelum menambahkan dependency baru, Codex harus memastikan:

1. Existing dependency tidak sudah menyelesaikan problem tersebut.
2. Dependency memang dibutuhkan.
3. Tidak membuat duplicate responsibility.
4. Compatible dengan existing stack.
5. Tidak menambahkan infrastructure besar hanya untuk convenience kecil.

---

# 102. Documentation Rule

Jika implementation membutuhkan perubahan architecture:

```text
Code change
+
ARCHITECTURE.md update
```

harus dilakukan dalam milestone yang sama.

Jangan membiarkan dokumentasi mengatakan satu hal tetapi implementasi melakukan hal berbeda.

---

# 103. Development Quality Gate

Sebelum milestone dianggap selesai:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

harus berhasil untuk workspace yang relevan.

Jika E2E telah tersedia:

```bash
npm run test:e2e
```

harus dilakukan untuk critical workflow yang disentuh.

---

# 104. Architecture Decision Summary

Architecture demo v1 di-freeze sebagai:

```text
PACKAGE MANAGER
npm

MONOREPO
Turborepo
npm Workspaces

APPLICATIONS
Glamping Next.js
Jeep Next.js
Admin Next.js
Central API Next.js

LANGUAGE
TypeScript

UI
Tailwind CSS
shadcn/ui

FORMS
React Hook Form
Zod

CLIENT DATA
TanStack Query where appropriate

DATABASE
PostgreSQL
Neon

ORM
Drizzle ORM

ADMIN AUTH
Better Auth

PAYMENT
Pakasir

EMAIL
Resend
React Email

INVOICE
Server-side PDF generation

OBJECT STORAGE
Cloudflare R2

BACKGROUND JOBS
Inngest

BOT PROTECTION
Cloudflare Turnstile

DNS
Cloudflare

HOSTING
Vercel

ERROR MONITORING
Sentry

UNIT TEST
Vitest

E2E TEST
Playwright
```

---

# 105. Core Architecture Principle

Seluruh architecture mengikuti prinsip:

> **Multiple storefronts, one operational system.**

Glamping dan Jeep boleh memiliki customer experience dan branding yang berbeda.

Namun:

```text
Booking
Availability
Inventory
Payment
Invoice
Customer
Admin
```

harus tetap menjadi satu centralized system.

---

# 106. Definition of Architecture Compliance

Implementation dianggap sesuai architecture apabila:

- [ ] Repository menggunakan npm.
- [ ] Repository menggunakan npm Workspaces.
- [ ] Repository menggunakan Turborepo.
- [ ] Glamping merupakan separate Next.js app.
- [ ] Jeep merupakan separate Next.js app.
- [ ] Admin merupakan separate Next.js app.
- [ ] Central API merupakan separate backend app.
- [ ] Customer apps tidak mengakses database langsung.
- [ ] Seluruh bisnis menggunakan PostgreSQL yang sama.
- [ ] Shared booking logic tidak diduplikasi.
- [ ] Payment verification server-side.
- [ ] Payment processing idempotent.
- [ ] Invoice dibuat server-side.
- [ ] Invoice disimpan private di R2.
- [ ] Email menggunakan Resend.
- [ ] Background workflow menggunakan Inngest.
- [ ] Admin menggunakan authentication.
- [ ] Customer tidak membutuhkan akun.
- [ ] Booking creation concurrency-safe.
- [ ] Financial data menggunakan snapshot.
- [ ] Booking dan payment status terpisah.
- [ ] Critical event memiliki audit trail.
- [ ] Secrets tidak tersedia di browser.
- [ ] Seed data menggunakan database real.
- [ ] Core demo workflow tidak menggunakan fake backend.

---

# 107. Next Architecture Documents

Setelah dokumen ini selesai, jangan langsung mulai implementasi booking.

Dokumen berikutnya harus dibuat secara berurutan:

```text
ARCHITECTURE.md ✅
       ↓
BUSINESS-RULES.md
       ↓
DATABASE.md
       ↓
API.md
       ↓
UI-UX-SPEC.md
       ↓
DEMO-DATA.md
       ↓
IMPLEMENTATION-PLAN.md
       ↓
AGENTS.md
       ↓
CODING
```

`BUSINESS-RULES.md` menjadi next priority karena database schema dan booking implementation tidak boleh dibuat sebelum booking lifecycle, inventory rule, payment rule, DP rule, expiration rule, dan check-in/check-out rule benar-benar eksplisit.
## Product Demo Adapter Mode

For local client presentation the modular monolith supports an explicit, fail-closed demo profile:

```text
APP_MODE=demo
PAYMENT_PROVIDER=demo
EMAIL_PROVIDER=preview
INVOICE_STORAGE=direct
BACKGROUND_JOB_MODE=inline
TURNSTILE_MODE=disabled
```

This profile keeps PostgreSQL, booking allocation, lifecycle rules, payment records, invoice PDF generation, and Admin operations real. Only external network boundaries are substituted: the payment gateway is an explicitly labelled simulator, email renders a branded preview without claiming delivery, invoice bytes are served through authenticated API streaming, post-payment work runs inline, and bot verification reports an explicit demo bypass.

Every adapter selection remains a named environment choice. Demo payment and disabled Turnstile operations reject use outside `APP_MODE=demo`; production adapters for Pakasir, Resend, private R2, Inngest, and Cloudflare Turnstile remain present and are not silently replaced.

Admin authentication in this profile uses a short-lived signed HttpOnly demo session. Its deterministic credentials are supplied by `DEMO_ADMIN_EMAIL` and `DEMO_ADMIN_PASSWORD`. It is deliberately not a production authentication substitute and is rejected outside demo mode.
