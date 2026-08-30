# Database Design

> **Client revision — 30 August 2026:** Add append-only `payment_proofs` audit records with claimed/verified amount, persistent demo-safe file data, review status, rejection reason, timestamps, and reviewing Admin identity. Add booking source (`ONLINE`, `ADMIN_MANUAL`, `WALK_IN`) and internal manual-booking notes. Existing booking price/payment snapshots remain unchanged; migration updates only current business settings to minimum 50% DP, 720-minute deadline, and accommodation times 13:00/12:00. No destructive reset is permitted.

## Product Demo — Glamping, Jeep & Central Admin Booking System

**Document:** `DATABASE.md`  
**Version:** 1.0  
**Status:** Database Baseline — Demo v1  
**Database:** PostgreSQL  
**Provider:** Neon  
**ORM:** Drizzle ORM  

**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS-RULES.md`

---

# 1. Purpose

Dokumen ini mendefinisikan database design untuk Product Demo Booking System yang mencakup:

- Glamping.
- Jeep.
- Central Admin Dashboard.
- Customer.
- Booking.
- Physical inventory.
- Temporary inventory hold.
- Payment.
- Invoice.
- Audit timeline.
- Admin authentication.
- Demo seeded data.

Database harus memenuhi dua tujuan utama:

1. Mudah dikembangkan dan dipahami.
2. Menjamin data integrity pada operation kritis seperti booking dan payment.

---

# 2. Database Principles

Database mengikuti prinsip berikut.

## DB-001 — One Central Database

Seluruh aplikasi menggunakan satu PostgreSQL database.

```text
Glamping ─┐
          │
Jeep ─────┼──► Central API ──► PostgreSQL
          │
Admin ────┘
```

Tidak ada database terpisah per business.

---

## DB-002 — PostgreSQL is Authoritative

Source of truth untuk:

- booking,
- inventory,
- availability,
- payment,
- customer,
- invoice,
- operational state,

adalah PostgreSQL.

Browser state, TanStack Query cache, atau localStorage tidak authoritative.

---

## DB-003 — Physical Inventory is Explicit

Physical inventory harus direpresentasikan.

Glamping:

```text
Deluxe Dome
├── Dome 01
├── Dome 02
├── Dome 03
└── Dome 04
```

Jeep:

```text
Jeep 01
Jeep 02
Jeep 03
...
```

Ini diperlukan agar sistem dapat menjamin tidak terjadi double booking.

---

# 3. Identifier Strategy

Primary key internal menggunakan:

```text
UUID
```

Prefer:

```text
uuid
```

dengan generated UUID.

Contoh:

```text
business.id
booking.id
customer.id
payment.id
```

---

## DB-004 — Internal ID vs Public ID

Internal UUID tidak boleh digunakan sebagai identifier utama customer-facing.

Booking menggunakan:

```text
booking_code
```

Invoice menggunakan:

```text
invoice_number
```

---

# 4. Naming Convention

Database menggunakan:

```text
snake_case
```

Contoh:

```text
created_at
booking_code
customer_email
payment_status
```

Table name menggunakan plural nouns.

Contoh:

```text
businesses
customers
bookings
payments
```

---

# 5. Timestamp Convention

Standard timestamp fields:

```text
created_at
updated_at
```

menggunakan timezone-aware PostgreSQL:

```sql
timestamp with time zone
```

atau Drizzle equivalent:

```text
timestamp(..., { withTimezone: true })
```

Internal transaction timestamps menggunakan UTC.

---

# 6. Business Local Date

Reservation date seperti:

```text
check_in_date
check_out_date
tour_date
```

disimpan sebagai:

```sql
date
```

bukan timestamp.

Tujuannya mencegah perubahan tanggal karena timezone conversion.

---

# 7. Money Storage

Seluruh amount menggunakan integer.

Contoh:

```text
Rp850.000
```

disimpan:

```text
850000
```

Recommended PostgreSQL type:

```text
bigint
```

atau integer apabila domain amount sudah dipastikan aman.

Untuk consistency gunakan:

```text
bigint
```

pada financial fields.

JavaScript layer harus menghindari unsafe numeric conversion apabila value dapat melewati safe integer.

Untuk demo IDR normal, conversion dapat dilakukan secara aman melalui helper financial domain.

---

# 8. High-Level Entity Relationship

```text
BUSINESSES
    │
    ├───────────────┐
    │               │
    ▼               ▼
GLAMPING TYPES    JEEP PACKAGES
    │               │
    ▼               ▼
GLAMPING UNITS    JEEP UNITS
    │               │
    │               │
    └──────┬────────┘
           │
           ▼
        BOOKINGS
           │
       ┌───┼────┬───────────┐
       │   │    │           │
       ▼   ▼    ▼           ▼
    CUSTOMER  PAYMENTS   INVOICES
       │                  │
       │                  ▼
       │             R2 OBJECT
       │
       ▼
 BOOKING EVENTS

BOOKINGS
   │
   ├── GLAMPING BOOKING DETAIL
   │
   └── JEEP BOOKING DETAIL
```

---

# 9. Core Tables

Minimum core tables:

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

admins / Better Auth tables
```

Additional tables dapat dibuat apabila implementation membutuhkan, tetapi tidak boleh mengubah domain tanpa alasan.

---

# 10. `businesses`

Menyimpan business yang dikelola system.

Fields:

```text
id
code
slug
name
type
is_active

email
phone
address

timezone
currency

created_at
updated_at
```

---

## `businesses.code`

Values:

```text
GLP
JEP
```

Future:

```text
HMS
```

Constraint:

```text
UNIQUE
NOT NULL
```

---

## `businesses.slug`

Example:

```text
glamping
jeep
```

Constraint:

```text
UNIQUE
```

---

## `businesses.type`

Enum:

```text
ACCOMMODATION
ACTIVITY
```

Demo:

```text
Glamping → ACCOMMODATION
Jeep → ACTIVITY
```

Future:

```text
Homestay → ACCOMMODATION
```

---

# 11. `business_settings`

Business-specific operational configuration.

Fields:

```text
id
business_id

dp_percentage
booking_hold_minutes

default_check_in_time
default_check_out_time

contact_email
contact_phone

created_at
updated_at
```

Constraint:

```text
business_id UNIQUE
```

---

## Demo Values

Glamping:

```text
dp_percentage = 30
booking_hold_minutes = 30
```

Jeep:

```text
dp_percentage = 30
booking_hold_minutes = 30
```

---

# 12. `customers`

Customer master data.

Fields:

```text
id

full_name
email
email_normalized

whatsapp
whatsapp_normalized

created_at
updated_at
```

---

# 13. Customer Uniqueness

Email atau WhatsApp **tidak wajib globally unique**.

Tetapi untuk customer reuse, application dapat mencari existing customer berdasarkan normalized contact.

Jangan menggunakan hard unique constraint yang mencegah edge case legitimate.

---

# 14. Booking Customer Snapshot

Walaupun `bookings` mempunyai:

```text
customer_id
```

booking juga harus menyimpan customer snapshot.

Fields:

```text
customer_name
customer_email
customer_whatsapp
```

Tujuan:

customer master data dapat berubah tanpa mengubah historical booking/invoice.

---

# 15. `accommodation_types`

Digunakan untuk Glamping dan future Homestay.

Fields:

```text
id
business_id

slug
name
description

base_price
capacity_per_unit

is_active
sort_order

created_at
updated_at
```

Example:

```text
Deluxe Dome
Family Dome
```

---

# 16. `accommodation_units`

Physical accommodation inventory.

Fields:

```text
id
accommodation_type_id

code
name

is_active

created_at
updated_at
```

Example:

```text
DOME-01
Dome 01
```

Constraint:

```text
UNIQUE(accommodation_type_id, code)
```

---

# 17. Accommodation Type Relationship

```text
business
   ↓
accommodation_type
   ↓
accommodation_units
```

Example:

```text
Glamping
   ↓
Deluxe Dome
   ↓
Dome 01
Dome 02
Dome 03
Dome 04
```

---

# 18. `jeep_packages`

Tour products.

Fields:

```text
id
business_id

slug
name
description

price_per_unit
capacity_per_unit

is_active
sort_order

created_at
updated_at
```

Example:

```text
Sunrise Adventure
Full Adventure Experience
```

---

# 19. `jeep_departure_slots`

Departure schedule.

Fields:

```text
id
business_id
jeep_package_id nullable

name
departure_time

is_active

created_at
updated_at
```

Examples:

```text
Sunrise
03:00

Morning
08:00
```

---

# 20. Departure Slot Scope

Jika slot khusus package:

```text
jeep_package_id = package id
```

Jika digunakan bersama beberapa package:

implementation boleh membuat normalized association table.

Untuk Demo v1 disarankan slot attached ke package untuk simplicity.

---

# 21. `jeep_units`

Physical fleet.

Fields:

```text
id
business_id

code
name

is_active

created_at
updated_at
```

Example:

```text
JEEP-01
Jeep 01
```

Constraint:

```text
UNIQUE(business_id, code)
```

---

# 22. `bookings`

Core reservation entity.

Fields:

```text
id

booking_code
business_id
customer_id nullable

booking_type

status
payment_status

customer_name
customer_email
customer_whatsapp

guest_count
quantity

currency

subtotal_amount
additional_amount
total_amount

dp_percentage
required_dp_amount

verified_paid_amount
remaining_amount

special_request

expires_at
confirmed_at
cancelled_at
checked_in_at
checked_out_at
completed_at

requires_review

created_at
updated_at
```

---

# 23. Booking Type

Enum:

```text
ACCOMMODATION
JEEP
```

Demo mapping:

```text
Glamping → ACCOMMODATION
Jeep → JEEP
```

---

# 24. Booking Status Enum

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

---

# 25. Payment Summary Status Enum

Stored on booking for efficient admin query:

```text
UNPAID
PENDING
PARTIALLY_PAID
PAID
FAILED
EXPIRED
REFUNDED
```

Authoritative payment history tetap berasal dari payment records.

`bookings.payment_status` merupakan denormalized current summary state.

---

# 26. Booking Financial Snapshot

Fields:

```text
subtotal_amount
additional_amount
total_amount
dp_percentage
required_dp_amount
verified_paid_amount
remaining_amount
currency
```

Semua nilai disimpan ketika booking dibuat/update payment secara server-side.

---

# 27. Booking Invariants

Database/application harus menjaga:

```text
quantity > 0

guest_count > 0

total_amount >= 0

required_dp_amount >= 0

verified_paid_amount >= 0

remaining_amount >= 0
```

---

# 28. Booking Code Constraint

```text
booking_code UNIQUE NOT NULL
```

Example:

```text
GLP-260830-0012
JEP-260830-0018
```

---

# 29. Booking Code Generation

Booking code tidak menggunakan:

```text
COUNT(*) + 1
```

karena tidak concurrency-safe.

Gunakan salah satu:

- sequence-backed number,
- dedicated counter,
- generated unique suffix with retry.

Recommended:

business/day-independent global PostgreSQL sequence.

Display format dapat menggunakan sequence value.

Conceptually:

```text
GLP-260830-001234
```

Unique constraint tetap menjadi final protection.

---

# 30. `glamping_booking_details`

Specific data untuk accommodation booking.

Fields:

```text
id
booking_id

accommodation_type_id

check_in_date
check_out_date
night_count

product_name_snapshot
unit_price_snapshot
capacity_snapshot

created_at
updated_at
```

Constraint:

```text
booking_id UNIQUE
```

---

# 31. Glamping Detail Validation

Database/app:

```text
check_in_date < check_out_date
night_count > 0
```

---

# 32. `jeep_booking_details`

Specific data untuk Jeep.

Fields:

```text
id
booking_id

jeep_package_id
departure_slot_id

tour_date

package_name_snapshot
unit_price_snapshot
capacity_snapshot
departure_time_snapshot

created_at
updated_at
```

Constraint:

```text
booking_id UNIQUE
```

---

# 33. Why Separate Detail Tables

Jangan membuat `bookings` menjadi seperti:

```text
check_in nullable
check_out nullable
tour_date nullable
departure_slot nullable
...
```

untuk semua business.

Separate details membuat domain lebih jelas:

```text
bookings
   │
   ├── glamping_booking_details
   └── jeep_booking_details
```

dan memudahkan Homestay menggunakan accommodation model nanti.

---

# 34. Inventory Reservation Strategy

Physical inventory assignment menggunakan dedicated reservation tables.

Glamping:

```text
accommodation_unit_reservations
```

Jeep:

```text
jeep_unit_reservations
```

Reservation row merupakan source untuk menentukan physical unit yang sedang:

```text
HELD
CONFIRMED
IN_USE
RELEASED
```

---

# 35. Reservation State Enum

```text
HELD
CONFIRMED
IN_USE
RELEASED
```

Mapping:

```text
WAITING_PAYMENT → HELD
CONFIRMED       → CONFIRMED
CHECKED_IN      → IN_USE
EXPIRED         → RELEASED
CANCELLED       → RELEASED
CHECKED_OUT     → RELEASED / historical
```

Historical row tidak perlu dihapus.

---

# 36. `accommodation_unit_reservations`

Fields:

```text
id

booking_id
accommodation_unit_id

check_in_date
check_out_date

state

created_at
updated_at
released_at
```

---

# 37. Accommodation Reservation Constraint

Satu booking yang quantity:

```text
2
```

mempunyai:

```text
2 reservation rows
```

dengan physical units berbeda.

Example:

```text
Booking GLP-0012

Dome 01
30 Aug → 31 Aug

Dome 03
30 Aug → 31 Aug
```

---

# 38. Accommodation Overlap Protection

PostgreSQL harus menjadi final concurrency guard.

Recommended approach:

```text
btree_gist extension
+
EXCLUDE USING gist
```

Logical constraint:

```text
same accommodation_unit_id
cannot have overlapping date range
when reservation state consumes inventory
```

Consume states:

```text
HELD
CONFIRMED
IN_USE
```

Date range semantics:

```text
[check_in_date, check_out_date)
```

yaitu:

- check-in included,
- check-out excluded.

---

# 39. Conceptual Exclusion Constraint

Conceptually:

```sql
EXCLUDE USING gist (
  accommodation_unit_id WITH =,
  daterange(check_in_date, check_out_date, '[)') WITH &&
)
WHERE (
  state IN ('HELD', 'CONFIRMED', 'IN_USE')
);
```

Exact generated migration boleh menggunakan raw SQL jika Drizzle DSL tidak menyediakan abstraction yang memadai.

---

# 40. Why `[)` Date Range

Example:

Booking A:

```text
29 Aug → 30 Aug
```

Booking B:

```text
30 Aug → 31 Aug
```

tidak overlap.

Ini sesuai `BUSINESS-RULES.md`.

---

# 41. `jeep_unit_reservations`

Fields:

```text
id

booking_id
jeep_unit_id
departure_slot_id

tour_date

state

created_at
updated_at
released_at
```

---

# 42. Jeep Active Reservation Constraint

Physical Jeep yang sama tidak boleh mempunyai dua active reservations untuk:

```text
same tour_date
+
same departure_slot
```

Active:

```text
HELD
CONFIRMED
IN_USE
```

---

# 43. Jeep Unique Constraint

Recommended:

partial unique index:

```text
(jeep_unit_id, tour_date, departure_slot_id)
```

where:

```text
state IN ('HELD', 'CONFIRMED', 'IN_USE')
```

Dengan demikian database mencegah:

```text
Jeep 03
30 Aug
03:00

Booking A
+
Booking B
```

secara bersamaan.

---

# 44. Jeep Different Slots

Allowed:

```text
Jeep 03
30 Aug
03:00
```

dan:

```text
Jeep 03
30 Aug
08:00
```

sesuai demo business rule.

---

# 45. Reservation Release

Ketika booking:

```text
EXPIRED
atau
CANCELLED
```

reservation rows berubah:

```text
state = RELEASED
released_at = now()
```

Jangan delete row.

Tujuannya menjaga auditability.

---

# 46. Availability Query — Glamping

Conceptually:

```text
active accommodation units
-
units with consuming reservation overlapping date range
-
blocked units
```

Query harus menghasilkan:

```text
available_quantity
```

---

# 47. Availability Query — Jeep

Conceptually:

```text
active Jeep units
-
Jeep reservations on date + slot
-
Jeep blocks
```

---

# 48. Final Booking Allocation

Availability search hanya memberikan count.

Ketika booking dibuat:

```text
BEGIN TRANSACTION
```

server memilih physical units yang tersedia.

Untuk Glamping:

```text
SELECT candidate units
locking rows as necessary
```

kemudian membuat reservation.

Untuk Jeep sama.

---

# 49. Concurrency Strategy

Application harus mengandalkan dua lapis protection.

### Layer 1

Transactional unit selection / lock.

### Layer 2

Database constraint.

Jika dua transaction race:

```text
DB constraint
```

menjadi final protection.

---

# 50. Retry on Concurrency Conflict

Jika insert reservation gagal karena unit telah direbut transaction lain:

server dapat:

1. retry allocation dengan unit lain,
2. atau return:

```text
INVENTORY_NOT_AVAILABLE
```

Retry harus bounded.

Tidak boleh infinite retry.

---

# 51. Inventory Blocks

Gunakan:

```text
inventory_blocks
```

untuk maintenance/private use.

---

# 52. `inventory_blocks`

Fields:

```text
id

business_id

resource_type

accommodation_unit_id nullable
jeep_unit_id nullable

start_date
end_date nullable

departure_slot_id nullable

reason
note

created_by_admin_id nullable

created_at
updated_at
removed_at
```

---

# 53. Inventory Block Resource Type

Enum:

```text
ACCOMMODATION_UNIT
JEEP_UNIT
```

---

# 54. Glamping Block

Uses:

```text
accommodation_unit_id
start_date
end_date
```

Date range semantics:

```text
[start_date, end_date)
```

---

# 55. Jeep Block

Uses:

```text
jeep_unit_id
start_date
departure_slot_id nullable
```

If:

```text
departure_slot_id = null
```

Jeep blocked untuk semua slot di tanggal tersebut.

---

# 56. Block Active State

Block active ketika:

```text
removed_at IS NULL
```

Historical block tetap tersimpan.

---

# 57. Block Conflict Validation

Application harus mengecek active reservations sebelum block dibuat.

Database design tidak harus automatically cancel booking.

Conflicting block request:

```text
REJECT
```

---

# 58. `payments`

Represents logical payment obligation/state untuk booking.

Fields:

```text
id
booking_id

currency

expected_amount
verified_amount

status

created_at
updated_at
verified_at
```

Untuk demo dapat satu logical payment object per booking.

---

# 59. Payment Relationship

```text
booking
   ↓
payment
   ↓
payment_attempts
```

---

# 60. Payment Status

Enum:

```text
UNPAID
PENDING
PARTIALLY_PAID
PAID
FAILED
EXPIRED
REFUNDED
```

---

# 61. `payment_attempts`

Setiap attempt Pakasir memiliki row sendiri.

Fields:

```text
id

payment_id
booking_id

provider
provider_order_id
provider_transaction_id nullable

requested_amount
verified_amount

status

payment_method nullable

provider_created_at nullable
provider_paid_at nullable

raw_reference nullable

created_at
updated_at
verified_at
failed_at
```

---

# 62. Payment Attempt Status

Recommended enum:

```text
CREATED
PENDING
SUCCESS
FAILED
EXPIRED
CANCELLED
EXCEPTION
```

---

# 63. Provider

Demo:

```text
PAKASIR
```

Tetapi provider disimpan explicit agar future migration lebih mudah.

---

# 64. Provider Order ID Constraint

```text
UNIQUE(provider, provider_order_id)
```

jika Pakasir menjamin order reference uniqueness.

---

# 65. Provider Transaction ID

Apabila provider transaction ID tersedia:

```text
UNIQUE(provider, provider_transaction_id)
```

untuk non-null values.

Ini menjadi salah satu idempotency protection.

---

# 66. Payment Attempt Amount

Store:

```text
requested_amount
verified_amount
```

Jangan hanya menyimpan satu `amount`.

Karena mismatch harus dapat dideteksi.

---

# 67. Payment Amount Aggregation

Booking:

```text
verified_paid_amount
```

diperbarui berdasarkan successful verified payment transactions.

Tidak berdasarkan browser state.

---

# 68. Payment Transaction Update

Payment verification harus terjadi di database transaction.

Conceptual:

```text
BEGIN

lock payment/booking

check transaction already processed

validate amount

mark attempt SUCCESS

recalculate verified paid amount

update payment

update booking payment status

if required DP satisfied:
    confirm booking
    update reservation state

create audit events

COMMIT
```

---

# 69. Payment Idempotency

Jika payment attempt sudah:

```text
SUCCESS
```

webhook yang sama tidak boleh mengubah financial amount lagi.

---

# 70. Payment Exception

Late payment atau mismatch dapat menggunakan:

```text
payment_attempt.status = EXCEPTION
```

dan:

```text
booking.requires_review = true
```

Audit event menjelaskan exception reason.

---

# 71. Late Payment

If booking expired dan provider paid after expiry:

```text
payment attempt
SUCCESS / verified
```

boleh tetap disimpan.

Tetapi booking:

```text
EXPIRED
```

dan:

```text
requires_review = true
```

---

# 72. Timely Payment, Delayed Webhook

Jika:

```text
provider_paid_at <= expires_at
```

tetapi booking sudah expired karena worker berjalan dahulu:

server boleh mencoba reacquire inventory.

Process:

```text
BEGIN
   lock booking
   attempt inventory allocation again
   if available:
      reservation active
      booking CONFIRMED
   else:
      requires_review = true
COMMIT
```

Tidak boleh force-confirm jika inventory telah diambil booking lain.

---

# 73. `invoices`

Fields:

```text
id

booking_id

invoice_number

status

currency
total_amount
paid_amount
remaining_amount

r2_object_key nullable
file_name nullable
mime_type nullable
file_size nullable

issued_at
generated_at nullable

created_at
updated_at
```

---

# 74. Invoice Status

Recommended:

```text
PENDING
GENERATED
FAILED
```

Future dapat menambah:

```text
VOID
```

jika diperlukan.

---

# 75. Invoice Number

Constraint:

```text
UNIQUE NOT NULL
```

Example:

```text
INV-260830-001234
```

Gunakan sequence/collision-safe strategy.

Tidak menggunakan:

```text
COUNT(*) + 1
```

---

# 76. One Initial Invoice Per Booking

Untuk Demo v1:

```text
booking_id UNIQUE
```

pada invoices cukup karena hanya ada initial DP invoice.

Future multi-invoice/payment bisa mengubah design.

---

# 77. Invoice Snapshot

Invoice financial fields tetap disimpan walaupun booking juga memiliki snapshot.

Tujuannya invoice merupakan immutable financial document representation.

---

# 78. Invoice R2 Object

Example:

```text
invoices/glamping/2026/08/INV-260830-001234.pdf
```

Database menyimpan:

```text
r2_object_key
```

bukan public URL.

---

# 79. Invoice Generation Failure

Jika generation gagal:

```text
status = FAILED
```

booking tidak berubah.

Background workflow dapat retry.

---

# 80. `booking_events`

Audit trail dan admin timeline.

Fields:

```text
id
booking_id

event_type

actor_type
actor_id nullable

title
description nullable

metadata jsonb nullable

created_at
```

---

# 81. Event Type

Minimum:

```text
BOOKING_CREATED
PAYMENT_CREATED
PAYMENT_FAILED
PAYMENT_VERIFIED
PAYMENT_EXCEPTION
BOOKING_CONFIRMED
BOOKING_EXPIRED
BOOKING_CANCELLED
INVOICE_GENERATED
INVOICE_FAILED
EMAIL_SENT
EMAIL_FAILED
CHECKED_IN
CHECKED_OUT
INVENTORY_BLOCKED
INVENTORY_UNBLOCKED
```

---

# 82. Actor Type

```text
SYSTEM
CUSTOMER
ADMIN
PAYMENT_PROVIDER
BACKGROUND_JOB
```

---

# 83. Booking Events Are Immutable

Event:

```text
INSERT
```

tidak di-update untuk mengubah history.

Jika correction dibutuhkan:

buat event baru.

---

# 84. Event Metadata

`jsonb` boleh menyimpan context non-sensitive.

Example:

```json
{
  "previousStatus": "WAITING_PAYMENT",
  "newStatus": "CONFIRMED"
}
```

Jangan menyimpan provider secret atau card/payment credential.

---

# 85. Email Delivery Tracking

Untuk demo tidak harus memiliki full email queue table.

Minimal email state dapat dicatat melalui:

```text
booking_events
```

Example:

```text
EMAIL_SENT
EMAIL_FAILED
```

Jika implementation Inngest membutuhkan explicit persistence tambahan, dapat dibuat:

```text
email_deliveries
```

tetapi bukan requirement wajib.

---

# 86. Admin Authentication Tables

Better Auth mengelola tables authentication yang dibutuhkan.

Exact tables mengikuti supported Better Auth adapter/version pada saat implementation.

Contoh concept:

```text
users
sessions
accounts
verifications
```

Jangan manually mendesain ulang table Better Auth jika library sudah menyediakan schema resmi.

---

# 87. Admin Profile

Jika Better Auth `user` digunakan langsung:

tambahkan metadata/related table untuk:

```text
role
is_active
```

Recommended:

```text
admin_profiles
```

Fields:

```text
id
user_id
role
is_active
created_at
updated_at
```

---

# 88. Admin Role

Enum future-ready:

```text
SUPER_ADMIN
ADMIN
STAFF
```

Demo seeded user:

```text
SUPER_ADMIN
```

---

# 89. Admin Activity

Admin critical action tetap masuk:

```text
booking_events
```

atau audit log generic jika nanti diperlukan.

Demo tidak membutuhkan comprehensive organization-wide audit log selain booking/inventory operation.

---

# 90. Optional `system_sequences`

Preferred approach adalah native PostgreSQL sequences.

Tidak perlu custom table kecuali specific formatted counters diperlukan.

Recommended sequences:

```text
booking_number_seq
invoice_number_seq
```

---

# 91. Booking Sequence

Sequence menjamin concurrency-safe monotonically increasing number.

Business code dan date hanya presentation.

Concept:

```text
sequence = 1234

booking_code =
GLP-260830-001234
```

---

# 92. Soft Delete Strategy

Transactional entities tidak hard-delete.

Examples:

```text
bookings
payments
invoices
booking_events
reservations
```

tidak dihapus.

---

# 93. Product Deactivation

Product/unit menggunakan:

```text
is_active
```

bukan delete.

---

# 94. Index Strategy

Database harus mempunyai index untuk common query.

---

# 95. Bookings Indexes

Recommended:

```text
UNIQUE booking_code

INDEX business_id
INDEX status
INDEX payment_status
INDEX created_at
INDEX customer_id

INDEX (business_id, status)
INDEX (business_id, created_at)
```

---

# 96. Customer Search Indexes

Recommended index:

```text
email_normalized
whatsapp_normalized
```

Name search dapat menggunakan PostgreSQL search strategy sederhana untuk demo.

Tidak perlu Elasticsearch.

---

# 97. Accommodation Detail Index

```text
INDEX accommodation_type_id
INDEX check_in_date
INDEX check_out_date
```

Reservation exclusion constraint juga mendukung critical overlap integrity.

---

# 98. Jeep Detail Index

```text
INDEX tour_date
INDEX departure_slot_id
INDEX jeep_package_id
```

---

# 99. Payment Index

```text
INDEX booking_id
INDEX status

UNIQUE(provider, provider_order_id)

UNIQUE(provider, provider_transaction_id)
WHERE provider_transaction_id IS NOT NULL
```

---

# 100. Event Index

```text
INDEX booking_id
INDEX (booking_id, created_at)
```

Untuk booking timeline.

---

# 101. Invoice Index

```text
UNIQUE invoice_number
UNIQUE booking_id
```

Demo v1.

---

# 102. Reservation Index

Accommodation:

```text
INDEX booking_id
INDEX accommodation_unit_id
INDEX state
```

Jeep:

```text
INDEX booking_id
INDEX jeep_unit_id
INDEX tour_date
INDEX departure_slot_id
```

---

# 103. Foreign Key Rules

Foreign keys digunakan secara konsisten.

---

# 104. Transactional Delete Restriction

Contoh:

```text
bookings → payments
bookings → invoices
bookings → events
bookings → reservations
```

gunakan:

```text
ON DELETE RESTRICT
```

atau default no action.

Jangan cascade delete historical financial data.

---

# 105. Product FK

Booking detail tetap mempunyai:

```text
product_id
```

tetapi snapshot juga disimpan.

Jika product dinonaktifkan:

FK tetap valid.

Product tidak hard-delete.

---

# 106. Customer FK

`customer_id` boleh nullable untuk robustness/import scenarios.

Tetapi demo normal booking akan memiliki customer.

Snapshot customer selalu wajib.

---

# 107. Check Constraints

Recommended:

Bookings:

```text
quantity >= 1
guest_count >= 1

subtotal_amount >= 0
additional_amount >= 0
total_amount >= 0

dp_percentage >= 0
dp_percentage <= 100

required_dp_amount >= 0
verified_paid_amount >= 0
remaining_amount >= 0
```

---

# 108. Glamping Date Check

```text
check_out_date > check_in_date
night_count >= 1
```

---

# 109. Payment Amount Check

```text
requested_amount >= 0
verified_amount >= 0
```

---

# 110. Business Type Consistency

Application must ensure:

```text
Glamping booking
→ business.type = ACCOMMODATION

Jeep booking
→ business.type = ACTIVITY
```

Database trigger tidak diperlukan untuk demo.

Domain service melakukan validation.

---

# 111. Availability Does Not Need a Table

Jangan membuat table:

```text
availability
```

yang menyimpan:

```text
30 Aug = 3
31 Aug = 2
```

sebagai source of truth.

Availability merupakan **derived state**.

Derived from:

```text
units
reservations
blocks
```

Ini mencegah synchronization bug.

---

# 112. Occupancy Does Not Need a Table

Occupancy/revenue analytics juga derived dari booking/payment records.

Demo boleh melakukan query aggregate.

Tidak perlu analytics warehouse.

---

# 113. Booking Holds Do Not Need Separate Table

Karena physical reservation rows sudah mempunyai:

```text
state = HELD
```

dan booking mempunyai:

```text
expires_at
```

maka dedicated `booking_holds` table tidak diperlukan untuk Demo v1.

Ini mengurangi complexity.

---

# 114. Reservation Lifecycle

Booking create:

```text
reservation = HELD
```

Payment verified:

```text
reservation = CONFIRMED
```

Check-in:

```text
reservation = IN_USE
```

Expire/cancel/check-out:

```text
reservation = RELEASED
```

---

# 115. Historical Reservation

Walaupun `RELEASED`, reservation row tetap menjadi historical evidence bahwa physical unit pernah dialokasikan.

---

# 116. Booking Expiration Query

Background worker dapat query:

```text
status = WAITING_PAYMENT
AND
expires_at <= now()
```

Recommended index:

```text
(status, expires_at)
```

---

# 117. Expiration Transaction

Conceptual:

```text
BEGIN

SELECT booking
FOR UPDATE

IF status != WAITING_PAYMENT
   exit

IF expires_at > now()
   exit

verify payment not satisfied

UPDATE booking → EXPIRED

UPDATE reservations → RELEASED

INSERT booking_event

COMMIT
```

---

# 118. Payment Webhook Transaction

Conceptual:

```text
BEGIN

lock payment attempt
lock payment
lock booking

detect duplicate

verify amount/status

update attempt

recalculate payment aggregate

if DP threshold satisfied:
    attempt confirm booking
    reservation HELD → CONFIRMED

insert events

COMMIT
```

Invoice generation bukan bagian transaction ini.

---

# 119. Confirmation Event

Setelah commit:

emit background event:

```text
payment/verified
```

untuk:

```text
invoice
email
```

---

# 120. Invoice Transaction

Background workflow:

```text
check existing invoice
```

Jika ada:

```text
do not create duplicate
```

Jika tidak:

```text
create PENDING invoice row
generate PDF
upload R2
update GENERATED
event INVOICE_GENERATED
```

---

# 121. Email Workflow

After invoice generated:

```text
send email through Resend
```

Result:

```text
EMAIL_SENT
```

atau:

```text
EMAIL_FAILED
```

Failure dapat retry.

---

# 122. Booking Lookup Query

Lookup:

```text
booking_code
+
normalized email
```

atau:

```text
booking_code
+
normalized whatsapp
```

Query harus menggunakan snapshot fields pada booking.

Ini memastikan booking tetap dapat ditemukan walaupun customer master data berubah.

---

# 123. Public Booking Projection

Public lookup tidak return entire booking database row.

Create explicit DTO yang hanya berisi:

```text
booking_code
business
product
reservation date
guest count
quantity

total
paid
remaining

booking status
payment status

invoice availability
```

---

# 124. Admin Booking Projection

Admin dapat menerima data lebih lengkap:

```text
customer
reservation
payment attempts
invoice
timeline
inventory assignment
```

Tetapi raw sensitive provider credentials tidak pernah dikirim.

---

# 125. Seed Data Requirements

Minimum business seed:

```text
2 businesses
```

---

# 126. Glamping Seed

```text
Deluxe Dome
4 units

Family Dome
2 units
```

---

# 127. Jeep Seed

```text
2 packages

8 Jeep units

minimum 1 departure slot/package
```

---

# 128. Customer Seed

Target:

```text
20–40
```

customer records.

Gunakan generated fictional data.

Jangan menggunakan data pribadi orang asli tanpa izin.

---

# 129. Booking Seed

Target:

```text
30–50
```

historical/upcoming bookings.

Distribution:

```text
CONFIRMED
CHECKED_IN
CHECKED_OUT
COMPLETED
WAITING_PAYMENT
CANCELLED
EXPIRED
```

---

# 130. Seed Inventory Integrity

Seed script harus menggunakan logic atau fixture yang memastikan tidak membuat overlapping active physical reservations.

Seed tidak boleh merusak database constraint.

---

# 131. Seed Payment Integrity

Confirmed seeded booking harus mempunyai payment data yang sesuai.

Contoh:

```text
Booking CONFIRMED
```

tidak boleh seed:

```text
verified_paid_amount = 0
```

karena melanggar business rules.

---

# 132. Seed Invoice Integrity

Tidak semua historical booking harus mempunyai invoice apabila tidak dibutuhkan.

Tetapi beberapa confirmed/completed records harus mempunyai generated invoice metadata agar admin terlihat realistic.

---

# 133. Demo Seed Dates

Seed harus dibuat relative terhadap current date saat seed dijalankan.

Contoh:

```text
today - 30 days
today
today + 30 days
```

Jangan hardcode seluruh demo menjadi Agustus 2026 sehingga demo rusak beberapa bulan kemudian.

---

# 134. Reset Development Database

Local development boleh mempunyai command:

```bash
npm run db:reset
```

Concept:

```text
drop/recreate local schema
migrate
seed
```

Command tidak boleh diarahkan ke production/demo database tanpa explicit protection.

---

# 135. Environment Protection

Seed/reset script harus memblokir dangerous operation jika environment:

```text
production
```

atau known production database.

---

# 136. Drizzle Package Structure

Recommended:

```text
packages/database/
├── src/
│   ├── client.ts
│   │
│   ├── schema/
│   │   ├── businesses.ts
│   │   ├── customers.ts
│   │   ├── accommodation.ts
│   │   ├── jeep.ts
│   │   ├── bookings.ts
│   │   ├── reservations.ts
│   │   ├── payments.ts
│   │   ├── invoices.ts
│   │   ├── events.ts
│   │   └── auth.ts
│   │
│   ├── relations.ts
│   ├── enums.ts
│   └── index.ts
│
├── drizzle/
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

---

# 137. Database Client

Use Neon-compatible PostgreSQL driver.

Karena booking membutuhkan transaction/locking behavior, driver choice harus mendukung transaction semantics yang diperlukan.

Jangan memilih HTTP-only database access mode apabila critical concurrency strategy membutuhkan connection/session transaction behavior yang tidak didukung.

Preferred:

```text
Neon serverless Postgres driver using transaction-capable connection
```

atau standard PostgreSQL-compatible driver supported oleh Neon.

Final selection dilakukan saat Foundation/Database milestone dan harus diuji dengan concurrency integration test.

---

# 138. Raw SQL Policy

Drizzle digunakan sebagai primary ORM.

Raw SQL diperbolehkan untuk PostgreSQL-specific integrity feature seperti:

```text
btree_gist
exclusion constraints
advanced partial indexes
locking query
```

Raw SQL harus:

- berada di database package,
- documented,
- tested,
- tidak tersebar di frontend.

---

# 139. Required PostgreSQL Extension

Recommended:

```text
btree_gist
```

untuk accommodation exclusion constraint.

Migration harus enable:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

jika supported environment.

---

# 140. Neon Compatibility

Sebelum implementation final:

Codex harus memastikan Neon PostgreSQL environment mendukung extension/constraint yang digunakan.

Jika constraint tertentu tidak tersedia:

fallback harus tetap memberikan equivalent concurrency safety.

Jangan menghapus double-booking protection hanya karena abstraction ORM terbatas.

---

# 141. Booking Repository Layer

Application tidak harus menggunakan enterprise repository pattern berlebihan.

Tetapi DB operation critical sebaiknya berada dalam centralized domain/database functions.

Example:

```text
createGlampingBooking()
createJeepBooking()

confirmPayment()

expireBooking()

checkInBooking()
checkOutBooking()
```

Frontend/API route tidak menulis beberapa tabel critical secara manual satu per satu.

---

# 142. Transaction Boundary

Critical domain operation menentukan transaction boundary.

Contoh:

```text
create booking
```

merupakan satu transaction.

Bukan:

```text
API route
insert booking

service
insert reservation

later
insert event
```

secara terpisah tanpa transaction.

---

# 143. Booking Creation — Glamping

Database sequence:

```text
BEGIN

1. Resolve active business
2. Resolve active accommodation type
3. Validate dates
4. Calculate price snapshot
5. Select candidate units
6. Lock/select concurrency-safe
7. Insert booking
8. Insert glamping detail
9. Insert unit reservations = HELD
10. Insert payment logical row
11. Insert BOOKING_CREATED event

COMMIT
```

Setelah itu create payment provider attempt dapat dilakukan.

---

# 144. Booking Creation — Jeep

```text
BEGIN

1. Resolve business
2. Resolve active package
3. Resolve departure slot
4. Validate date
5. Calculate price snapshot
6. Select available Jeep units
7. Insert booking
8. Insert Jeep detail
9. Insert Jeep reservations = HELD
10. Insert payment
11. Insert event

COMMIT
```

---

# 145. Provider Failure After Booking Commit

Jika Pakasir payment transaction gagal dibuat:

booking tetap tersimpan sebagai:

```text
WAITING_PAYMENT
```

Payment attempt:

```text
FAILED
```

Customer dapat retry selama hold aktif.

---

# 146. Booking Creation Idempotency

Public booking request sebaiknya memiliki:

```text
idempotency_key
```

generated frontend sebelum submit.

Tambahkan ke bookings:

```text
client_idempotency_key nullable
```

atau dedicated request idempotency table.

Recommended Demo v1:

```text
bookings.client_idempotency_key
```

Constraint:

```text
UNIQUE where not null
```

scope dapat digabung business/customer bila diperlukan.

Tujuan mencegah double-click membuat dua booking.

---

# 147. Idempotency Scope

Recommended:

```text
client_idempotency_key globally unique UUID
```

Frontend generate UUID.

Server:

jika key sudah ada:

return existing booking result.

---

# 148. Admin Cancel Transaction

```text
BEGIN

lock booking

validate transition

booking → CANCELLED

active reservations → RELEASED

insert BOOKING_CANCELLED event

COMMIT
```

Payment tidak diubah menjadi REFUNDED otomatis.

---

# 149. Check-In Transaction

```text
BEGIN

lock booking

verify:
CONFIRMED
DP satisfied
date valid

booking → CHECKED_IN
reservations → IN_USE

insert CHECKED_IN event

COMMIT
```

---

# 150. Check-Out Transaction

```text
BEGIN

lock booking

verify CHECKED_IN

booking → CHECKED_OUT
reservations → RELEASED

insert CHECKED_OUT event

COMMIT
```

Historical reservation date tetap ada.

---

# 151. Product Price Edit

Update hanya:

```text
accommodation_types.base_price
```

atau:

```text
jeep_packages.price_per_unit
```

Tidak melakukan UPDATE ke booking snapshots.

---

# 152. Admin Calendar Query

Glamping:

query date + reservation rows + type/unit.

Jeep:

query date + slot + reservation rows.

Calendar tidak memiliki separate calendar table.

---

# 153. Dashboard Revenue Query

Revenue:

```text
SUM verified successful payment amount
```

within requested period.

Tidak menggunakan booking total untuk card bernama Revenue.

---

# 154. Dashboard Booking Value

If required:

```text
SUM booking total
```

with explicit label:

```text
Booking Value
```

---

# 155. Outstanding Query

For:

```text
status IN (
 CONFIRMED,
 CHECKED_IN
)
```

calculate:

```text
total_amount - verified_paid_amount
```

Cancelled/expired excluded.

---

# 156. Data Retention

Demo tidak membutuhkan automatic deletion.

Booking, payment, invoice, event tetap tersimpan.

---

# 157. Sensitive Provider Data

Raw webhook payload tidak harus disimpan.

Jika disimpan untuk debugging:

- redact sensitive fields,
- batasi access,
- gunakan separate field/table.

Demo lebih baik menyimpan normalized provider references saja.

---

# 158. Database Error Mapping

Database constraint violation harus diterjemahkan ke domain error.

Example:

Accommodation exclusion conflict:

```text
→ INVENTORY_NOT_AVAILABLE
```

Jeep unique reservation conflict:

```text
→ INVENTORY_NOT_AVAILABLE
```

Jangan menampilkan raw PostgreSQL error ke customer.

---

# 159. Required Integration Tests

Database implementation belum dianggap selesai sampai minimum test tersedia.

### Glamping

```text
two overlapping reservations same unit
→ second rejected
```

---

### Checkout boundary

```text
29 → 30
30 → 31
→ both valid
```

---

### Jeep

```text
same Jeep/date/slot twice
→ rejected
```

---

### Jeep Different Slot

```text
same Jeep/date
03:00 + 08:00
→ valid
```

---

### Expiration

```text
HELD
→ EXPIRED
→ reservation released
```

---

### Payment Idempotency

```text
same provider transaction processed twice
→ financial effect once
```

---

### Double Booking

Two concurrent booking transactions for last available unit:

```text
exactly one succeeds
```

---

# 160. Required Seed Scenario

Seed harus menghasilkan admin dashboard yang immediately useful.

Minimum:

```text
Glamping:
2 types
6 physical units

Jeep:
2 packages
8 physical units

Customers:
30

Bookings:
40+

Payment records:
mix of statuses

Upcoming:
multiple records

Today:
at least some activity
```

Seed date harus relative terhadap runtime seed date.

---

# 161. Data Model Overview

Final conceptual model:

```text
businesses
│
├── business_settings
│
├── accommodation_types
│   └── accommodation_units
│
└── jeep_packages
    └── jeep_departure_slots

jeep_units

customers
   │
   ▼
bookings
│
├── glamping_booking_details
│
├── jeep_booking_details
│
├── accommodation_unit_reservations
│
├── jeep_unit_reservations
│
├── payments
│   └── payment_attempts
│
├── invoices
│
└── booking_events

Better Auth
└── admin authentication

inventory_blocks
└── physical resources
```

---

# 162. Relationship Cardinality

```text
Business
1 → many Accommodation Types

Accommodation Type
1 → many Accommodation Units

Business
1 → many Jeep Packages

Business
1 → many Jeep Units

Jeep Package
1 → many Departure Slots

Customer
1 → many Bookings

Booking
1 → one Business

Booking
1 → one domain detail

Booking
1 → many Physical Reservations

Booking
1 → one Payment
Demo v1

Payment
1 → many Payment Attempts

Booking
1 → zero/one Invoice
Demo v1

Booking
1 → many Events
```

---

# 163. Schema Decisions Explicitly Rejected

Demo v1 tidak menggunakan:

### One generic products table for everything

Tidak digunakan karena Glamping dan Jeep mempunyai inventory semantics berbeda.

---

### One giant bookings table

Tidak digunakan karena menghasilkan terlalu banyak nullable business-specific fields.

---

### Separate database per website

Tidak digunakan.

---

### Availability table

Tidak digunakan sebagai source of truth.

---

### Inventory count integer only

Contoh:

```text
available = 4
```

tanpa physical resource tidak cukup aman untuk concurrency/historical allocation.

---

### Customer login tables custom

Tidak dibuat karena customer tidak login.

---

### MongoDB

Tidak digunakan.

Relational booking/payment/inventory lebih sesuai PostgreSQL.

---

# 164. Demo v1 Tables Summary

Expected domain tables:

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

admin_profiles
```

Plus Better Auth-managed tables.

---

# 165. Deferred Database Concepts

Tidak perlu pada Demo v1:

```text
coupons
promotions
tax_rules
refunds
refund_transactions
balance_payment_schedules
loyalty_points
reviews
OTA reservations
staff schedules
dynamic pricing rules
accounting journal
customer accounts
shopping carts
multi-business checkout
notification preferences
```

Jangan dibuat hanya untuk future-proofing.

---

# 166. Data Integrity Priority

Jika harus memilih antara:

```text
UI convenience
```

dan:

```text
database integrity
```

database integrity selalu menang.

---

# 167. Database Invariants

Database/application bersama-sama harus menjamin:

1. `booking_code` unik.
2. `invoice_number` unik.
3. Payment provider transaction tidak diproses dua kali.
4. Satu accommodation unit tidak mempunyai overlapping active reservation.
5. Satu Jeep tidak mempunyai dua active reservation pada date/slot yang sama.
6. Expired reservation tidak mengonsumsi inventory.
7. Cancelled reservation tidak mengonsumsi inventory.
8. Booking snapshot tidak berubah ketika product price berubah.
9. Invoice menggunakan historical financial snapshot.
10. Payment dan booking status terpisah.
11. Customer lookup tidak hanya menggunakan booking code.
12. Transaction critical bersifat atomic.

---

# 168. Codex Database Rules

Codex wajib membaca:

```text
PRD.md
ARCHITECTURE.md
BUSINESS-RULES.md
DATABASE.md
```

sebelum membuat schema.

Codex tidak boleh:

- mengganti PostgreSQL,
- menggunakan SQLite sebagai actual demo database,
- membuat database terpisah untuk Glamping/Jeep,
- menghapus physical units,
- mengganti availability menjadi stored integer,
- menghapus database-level concurrency protection,
- menggunakan `COUNT(*) + 1` untuk booking/invoice number,
- menyimpan uang sebagai floating point,
- cascade-delete financial history,
- membuat customer auth,
- mencampur Glamping/Jeep detail menjadi giant nullable structure tanpa alasan,
- mengubah state lifecycle,
- membuat payment success berdasarkan frontend.

---

# 169. Migration Quality Gate

Sebelum Database Milestone selesai:

- [ ] Drizzle schema dibuat.
- [ ] Migration generated.
- [ ] Migration SQL direview.
- [ ] PostgreSQL extension tersedia.
- [ ] Foreign keys benar.
- [ ] Unique indexes benar.
- [ ] Partial indexes benar.
- [ ] Accommodation exclusion constraint benar.
- [ ] Seed berhasil.
- [ ] Seed dapat dijalankan ulang dengan documented reset flow.
- [ ] Database integration tests berhasil.
- [ ] Concurrency test berhasil.
- [ ] `npm run typecheck` berhasil.
- [ ] `npm run test` berhasil.
- [ ] Migration dapat dijalankan pada clean database.

---

# 170. Definition of Done

Database design dianggap selesai secara implementasi jika scenario berikut benar-benar bekerja.

### Scenario 1

```text
4 Deluxe Domes

3 already booked

Customer requests 1
→ accepted

Next customer requests 1
→ rejected
```

---

### Scenario 2

```text
Dome 01
29 → 30

Dome 01
30 → 31

→ valid
```

---

### Scenario 3

```text
Jeep 01
30 Aug
03:00
already reserved

new booking same date + slot
→ cannot receive Jeep 01
```

---

### Scenario 4

```text
Jeep 01
30 Aug
03:00

Jeep 01
30 Aug
08:00

→ allowed
```

---

### Scenario 5

```text
Booking WAITING_PAYMENT
↓
30 minutes passes
↓
EXPIRED
↓
inventory available again
```

---

### Scenario 6

```text
Pakasir webhook arrives twice
↓
payment counted once
invoice generated once
booking confirmed once
```

---

### Scenario 7

```text
Product price changed after booking
↓
old booking amount unchanged
old invoice unchanged
```

---

# 171. Next Document

Documentation status setelah dokumen ini:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅
DATABASE.md               ✅

API.md                    ← NEXT
UI-UX-SPEC.md
DEMO-DATA.md
IMPLEMENTATION-PLAN.md
AGENTS.md

CODING
```

Dokumen berikutnya adalah **`API.md`**.

`API.md` akan mendefinisikan contract antara:

```text
Glamping
Jeep
Admin
      ↓
Central API
```

termasuk:

```text
availability
create booking
booking status
booking lookup
payment initiation
Pakasir webhook
admin bookings
calendar
check-in
check-out
cancel
block inventory
invoice download
customers
payments
```

beserta request/response schema, HTTP status, error code, authentication, idempotency key, dan rules untuk payment polling.
