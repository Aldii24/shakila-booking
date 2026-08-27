# Demo Data Specification

## Product Demo — Glamping, Jeep & Central Admin Booking System

**Document:** `DEMO-DATA.md`  
**Version:** 1.0  
**Status:** Demo Seed Baseline — Demo v1

**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/UI-UX-SPEC.md`

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh seed data yang digunakan untuk Product Demo Booking System.

Tujuan utamanya adalah memastikan ketika demo pertama kali dijalankan:

- customer websites tidak kosong,
- admin dashboard tidak kosong,
- revenue chart terlihat hidup,
- booking table mempunyai data realistis,
- calendar mempunyai occupancy,
- payment list mempunyai transaction history,
- customer list mempunyai historical customers,
- timeline terlihat nyata,
- live booking yang dibuat saat presentasi dapat terlihat sebagai booking baru di antara historical data yang sudah ada.

Demo data bukan fake API response.

Semua seed data harus dimasukkan ke PostgreSQL sebagai record normal.

---

# 2. Demo Data Principle

Demo mengikuti prinsip:

> **Seed the history, keep the live workflow real.**

Artinya:

### Seeded

Boleh menggunakan generated fictional data untuk:

- historical booking,
- historical customer,
- historical payment,
- historical invoice,
- revenue chart,
- testimonials,
- gallery,
- past activity.

### Real

Tidak boleh fake untuk:

- availability,
- live booking,
- inventory hold,
- payment,
- payment verification,
- invoice generation,
- email delivery,
- booking status,
- check-in/check-out.

---

# 3. Data Safety

Seluruh seed data harus menggunakan:

- fictional names,
- fictional phone numbers,
- demo email domains,
- non-sensitive addresses,
- non-real payment references.

Jangan menggunakan data pribadi orang nyata tanpa izin.

---

# 4. Demo Business Names

Untuk menghindari branding terlalu generic, demo menggunakan dua fictional brands.

## Glamping Brand

```text
Shakila Glamping
```

Short name:

```text
Shakila Glamping
```

Slug:

```text
glamping
```

Business code:

```text
GLP
```

---

## Jeep Brand

```text
Shakila Jeep Tour
```

Short name:

```text
Shakila Jeep Tour
```

Slug:

```text
jeep
```

Business code:

```text
JEP
```

---

# 5. Demo Parent Identity

Central admin dapat menggunakan neutral parent identity:

```text
Shakila Group
```

Admin title:

```text
Shakila Group Admin
```

Tujuannya agar admin terasa sebagai satu operational system lintas bisnis.

---

# 6. Business Contact Data

## Shakila Glamping

```text
Email:
reservasi@shakilagroup.demo

WhatsApp:
+62 812-0000-1101

Location:
Bromo Area, East Java
```

---

## Shakila Jeep Tour

```text
Email:
tour@shakilagroup.demo

WhatsApp:
+62 812-0000-2201

Location:
Bromo Area, East Java
```

---

# 7. Timezone

Semua demo business menggunakan:

```text
Asia/Jakarta
```

Currency:

```text
IDR
```

---

# 8. Demo Booking Configuration

## Glamping

```text
DP:
30%

Booking Hold:
30 minutes

Check-In:
14:00

Check-Out:
11:00
```

---

## Jeep

```text
DP:
30%

Booking Hold:
30 minutes
```

Default tour operation does not require accommodation-style check-out time.

---

# 9. Glamping Product Data

Demo mempunyai dua Glamping types.

---

# 10. Deluxe Dome

```text
Slug:
deluxe-dome

Name:
Deluxe Dome

Base Price:
Rp850.000 / night

Capacity:
2 guests / unit

Inventory:
4 units

Active:
Yes
```

Short description:

```text
Dome privat dengan pemandangan pegunungan,
kamar mandi pribadi, dan sarapan untuk dua tamu.
```

---

# 11. Deluxe Dome Facilities

```text
Private Bathroom
Breakfast Included
Mountain View
Hot Water
Wi-Fi
Queen Bed
Outdoor Seating
```

---

# 12. Deluxe Dome Physical Units

```text
DOME-01 — Dome 01
DOME-02 — Dome 02
DOME-03 — Dome 03
DOME-04 — Dome 04
```

---

# 13. Family Dome

```text
Slug:
family-dome

Name:
Family Dome

Base Price:
Rp1.250.000 / night

Capacity:
4 guests / unit

Inventory:
2 units

Active:
Yes
```

Short description:

```text
Dome lebih luas untuk keluarga atau grup kecil
dengan area santai dan private terrace.
```

---

# 14. Family Dome Facilities

```text
Private Bathroom
Breakfast Included
Mountain View
Hot Water
Wi-Fi
Family Bedding
Private Terrace
Outdoor Seating
```

---

# 15. Family Dome Physical Units

```text
FAMILY-01 — Family Dome 01
FAMILY-02 — Family Dome 02
```

---

# 16. Jeep Package Data

Demo mempunyai dua packages.

---

# 17. Sunrise Adventure

```text
Slug:
sunrise-adventure

Name:
Sunrise Adventure

Price:
Rp750.000 / Jeep

Capacity:
6 passengers / Jeep

Active:
Yes
```

Description:

```text
Perjalanan Jeep private untuk menikmati sunrise
Bromo dan beberapa destinasi ikonik sebelum siang.
```

---

# 18. Sunrise Adventure Destinations

```text
Sunrise Viewpoint
Widodaren
Kawah Bromo
Pasir Berbisik
```

---

# 19. Sunrise Departure Slot

```text
Name:
Sunrise

Departure:
03:00
```

---

# 20. Full Adventure Experience

```text
Slug:
full-adventure-experience

Name:
Full Adventure Experience

Price:
Rp950.000 / Jeep

Capacity:
6 passengers / Jeep

Active:
Yes
```

Description:

```text
Paket perjalanan lebih lengkap untuk menjelajahi
sunrise, kawah, savana, dan area ikonik Bromo.
```

---

# 21. Full Bromo Destinations

```text
Sunrise Viewpoint
Kawah Bromo
Pasir Berbisik
Savana
Bukit Teletubbies
```

---

# 22. Full Bromo Departure Slots

Demo v1:

```text
Sunrise
03:00

Morning
08:00
```

---

# 23. Jeep Fleet

Total physical Jeep:

```text
8
```

Units:

```text
JEEP-01 — Jeep 01
JEEP-02 — Jeep 02
JEEP-03 — Jeep 03
JEEP-04 — Jeep 04
JEEP-05 — Jeep 05
JEEP-06 — Jeep 06
JEEP-07 — Jeep 07
JEEP-08 — Jeep 08
```

All active initially.

---

# 24. Demo Date Strategy

Seed tidak boleh hardcode seluruh data berdasarkan satu kalender fixed.

Seed menggunakan relative dates terhadap:

```text
seedDate
```

Default:

```text
today in Asia/Jakarta
```

---

# 25. Relative Date Helpers

Implementation should support helpers conceptually:

```text
today
today - 1 day
today + 1 day
today + 2 days
today + 3 days
today + 7 days
today + 14 days
today - 30 days
```

This keeps the demo relevant whenever it is reseeded.

---

# 26. Seed Window

Historical and upcoming booking should span roughly:

```text
Past:
45 days

Future:
45 days
```

---

# 27. Demo Customer Count

Target:

```text
30 customers
```

Enough to make admin feel populated without unnecessary complexity.

---

# 28. Customer Name Style

Use common fictional Indonesian names.

Example seed names:

```text
Aditya Pratama
Ayu Lestari
Bagas Wicaksono
Citra Maharani
Dimas Saputra
Dinda Amelia
Fajar Nugroho
Farah Putri
Galih Ramadhan
Hana Safitri
Ilham Akbar
Intan Permata
Kevin Wijaya
Larasati Putri
Maya Anggraini
Nadia Rahma
Naufal Rizky
Putra Mahendra
Raka Firmansyah
Ratih Kusuma
Rizky Hidayat
Salma Azzahra
Satria Nugraha
Sinta Maharani
Taufik Ramadhan
Vina Oktavia
Wahyu Prakoso
Yudha Saputra
Zahra Putri
Bima Arya
```

These are fictional demo identities.

---

# 29. Seed Email Pattern

Use non-real domain:

```text
example.test
```

Example:

```text
aditya.pratama@example.test
ayu.lestari@example.test
```

Do not use real Gmail/Yahoo addresses in seed.

---

# 30. Seed WhatsApp Pattern

Use fictional/non-contactable numbers.

Example format:

```text
+62 811 0000 XXXX
```

Implementation stores normalized value.

Avoid accidentally using a real person's number.

---

# 31. Cross-Business Customers

Some customers should have bookings in both businesses.

Target:

```text
~25% customers
```

have both:

```text
Glamping
+
Jeep
```

This demonstrates centralized customer management.

---

# 32. Historical Booking Count

Target initial booking seed:

```text
48 bookings
```

Chosen because after live demo booking:

```text
48
↓
49
```

change is easy to see.

---

# 33. Booking Distribution

Suggested:

```text
Glamping:
29 bookings

Jeep:
19 bookings

Total:
48 bookings
```

---

# 34. Booking Status Distribution

Suggested overall:

```text
COMPLETED:
17

CHECKED_OUT:
4

CHECKED_IN:
3

CONFIRMED:
12

WAITING_PAYMENT:
4

CANCELLED:
4

EXPIRED:
4
```

Total:

```text
48
```

---

# 35. Payment Distribution

Example:

```text
PAID:
11

PARTIALLY_PAID:
25

PENDING / UNPAID:
4

FAILED:
3 attempts

CANCELLED booking with historical partial payment:
2

EXPIRED with no verified payment:
4
```

Exact payment attempt count can exceed booking count due to retry attempts.

---

# 36. Payment Attempts

Target:

```text
55–60 payment attempts
```

because some bookings have:

```text
failed attempt
↓
successful retry
```

This makes payment history realistic.

---

# 37. Demo Payment Methods

Seed can include:

```text
QRIS
Virtual Account
```

If actual Pakasir integration supports more methods, additional method names can be introduced later.

No need to seed every payment method.

---

# 38. Payment Provider

All payment seed:

```text
provider = PAKASIR
```

Provider IDs/references must be clearly fictional.

Example:

```text
DEMO-PKS-000001
```

---

# 39. Verified Revenue Goal

Admin dashboard should show roughly:

```text
Rp35.000.000 – Rp45.000.000
```

verified revenue received for the current month.

Suggested visual target:

```text
Rp38.750.000
```

Actual calculated seed total may vary slightly.

Do not hardcode KPI; generate records such that aggregate is near this target.

---

# 40. Booking Value Goal

Suggested:

```text
Rp60.000.000 – Rp75.000.000
```

for total booking value this month.

Example visual target:

```text
Rp69.200.000
```

Again, derive from records.

---

# 41. Outstanding Balance Goal

Suggested:

```text
Rp18.000.000 – Rp25.000.000
```

for active confirmed/checked-in bookings.

Example:

```text
Rp21.450.000
```

---

# 42. Dashboard Current-Day Activity

Seed should guarantee current day has meaningful data.

Minimum today:

```text
2 upcoming Glamping check-ins
1 Jeep booking
1 payment received
1 customer checked-in or operational activity
```

---

# 43. Upcoming Reservations

Ensure:

```text
7–10
```

upcoming confirmed bookings over next 7 days.

This makes dashboard upcoming section useful.

---

# 44. Glamping Calendar Occupancy

The next 14 days should include:

- low occupancy dates,
- medium occupancy dates,
- almost full dates,
- at least one fully booked type/date,
- one inventory block.

---

# 45. Glamping Calendar Example Scenario

Relative:

```text
today + 2 days
```

Deluxe Dome:

```text
3 / 4 occupied
```

Family Dome:

```text
2 / 2 occupied
FULL
```

---

# 46. Glamping Limited Availability Scenario

Relative:

```text
today + 4 days
```

Deluxe Dome:

```text
3 / 4 occupied
1 available
```

This is useful for customer demo:

```text
Only 1 unit left
```

---

# 47. Glamping Full Scenario

Relative:

```text
today + 6 days
```

Family Dome:

```text
2 / 2
FULL
```

---

# 48. Glamping Blocked Unit Scenario

Use:

```text
DOME-04
```

Block:

```text
today + 8 days
→
today + 10 days
```

Reason:

```text
Maintenance
```

Note:

```text
Scheduled bathroom maintenance.
```

---

# 49. Jeep Availability Scenario

For upcoming:

```text
today + 3 days
03:00
```

Sunrise:

```text
5 / 8 booked
3 available
```

This is an ideal demo state.

---

# 50. Jeep Limited Scenario

Relative:

```text
today + 5 days
03:00
```

```text
7 / 8 booked
1 available
```

---

# 51. Jeep Full Scenario

Relative:

```text
today + 7 days
03:00
```

```text
8 / 8 booked
FULL
```

---

# 52. Jeep Blocked Unit Scenario

Use:

```text
JEEP-08
```

Block:

```text
today + 10 days
```

Reason:

```text
Maintenance
```

If needed, whole-day block.

---

# 53. Seed Booking Code

Booking codes should look realistic.

Example:

```text
GLP-260825-001201
GLP-260825-001202
JEP-260825-001203
```

Exact date fragment depends on booking created date.

Do not manually seed identical codes.

---

# 54. Seed Invoice Number

Example:

```text
INV-260825-001201
```

Invoice code and booking code may share numeric suffix for readability but remain separate unique identifiers.

---

# 55. Demo Booking Examples

Seed should include named scenarios that are easy to find during admin demo.

---

# 56. Demo Booking A — Upcoming Glamping

Customer:

```text
Ayu Lestari
```

Booking:

```text
Deluxe Dome
```

Reservation:

```text
today + 1 day
→
today + 3 days
```

Quantity:

```text
1
```

Guests:

```text
2
```

Status:

```text
CONFIRMED
```

Payment:

```text
PARTIALLY_PAID
```

DP:

```text
30%
```

Assigned:

```text
DOME-01
```

---

# 57. Demo Booking A Timeline

```text
Booking created
Payment initiated
DP payment verified
Booking confirmed
Invoice generated
Confirmation email recorded as sent
```

---

# 58. Demo Booking B — Current Glamping Check-In

Customer:

```text
Bagas Wicaksono
```

Reservation:

```text
today
→
today + 2 days
```

Product:

```text
Family Dome
```

Quantity:

```text
1
```

Guests:

```text
4
```

Status:

```text
CONFIRMED
```

Payment:

```text
PARTIALLY_PAID
```

Used for:

```text
Today's Check-In
```

---

# 59. Demo Booking C — Checked-In Glamping

Customer:

```text
Citra Maharani
```

Reservation:

```text
today - 1 day
→
today + 1 day
```

Status:

```text
CHECKED_IN
```

Assigned unit:

```text
DOME-03
```

---

# 60. Demo Booking D — Upcoming Jeep

Customer:

```text
Dimas Saputra
```

Package:

```text
Sunrise Adventure
```

Tour date:

```text
today + 3 days
```

Slot:

```text
03:00
```

Quantity:

```text
2 Jeeps
```

Guests:

```text
8
```

Status:

```text
CONFIRMED
```

Payment:

```text
PARTIALLY_PAID
```

Assigned:

```text
JEEP-02
JEEP-04
```

---

# 61. Demo Booking E — Jeep Today

Customer:

```text
Farah Putri
```

Package:

```text
Full Bromo Experience
```

Tour date:

```text
today
```

Slot:

```text
08:00
```

Quantity:

```text
1
```

Guests:

```text
5
```

Status:

```text
CHECKED_IN
```

Payment:

```text
PAID
```

---

# 62. Demo Booking F — Waiting Payment

Customer:

```text
Galih Ramadhan
```

Business:

```text
Glamping
```

Status:

```text
WAITING_PAYMENT
```

Expires:

```text
today + around 15 minutes relative to seed
```

Important:

For deterministic reusable seed, dynamic very-short live expiry may be inconvenient.

Recommended:

Seed a waiting booking with:

```text
expiresAt = now + 25 minutes
```

when seeding.

---

# 63. Demo Booking G — Expired

Customer:

```text
Hana Safitri
```

Business:

```text
Jeep
```

Status:

```text
EXPIRED
```

Payment:

```text
UNPAID
```

Reservation:

```text
RELEASED
```

---

# 64. Demo Booking H — Cancelled After DP

Customer:

```text
Ilham Akbar
```

Business:

```text
Glamping
```

Status:

```text
CANCELLED
```

Payment:

```text
PARTIALLY_PAID
```

Important demo meaning:

```text
Cancelled booking != Refunded payment
```

---

# 65. Demo Booking I — Payment Retry

Customer:

```text
Intan Permata
```

Jeep booking.

Payment attempts:

```text
Attempt 1
FAILED

Attempt 2
SUCCESS
```

Booking:

```text
CONFIRMED
```

Used to demonstrate realistic payment history.

---

# 66. Demo Booking J — Requires Review

Optional but recommended seed.

Customer:

```text
Kevin Wijaya
```

Business:

```text
Jeep
```

Booking:

```text
EXPIRED
```

Payment:

```text
verified after expiry
```

```text
requires_review = true
```

Review reason:

```text
LATE_PAYMENT
```

This makes the Payments admin page feel more operationally realistic.

---

# 67. Requires Review UI

Admin should display:

```text
Requires Review
Late payment received after booking expiration.
```

No resolution action required Demo v1.

---

# 68. Historical Booking Generation

Remaining historical bookings can be generated programmatically.

Distribution should vary:

- product,
- business,
- guest count,
- quantity,
- dates,
- payment state,
- booking lifecycle.

---

# 69. Historical Glamping Duration

Suggested:

```text
1 night:
50%

2 nights:
35%

3 nights:
15%
```

Avoid unrealistic 10-night demo reservations unless specifically desired.

---

# 70. Glamping Quantity Distribution

Suggested:

```text
1 unit:
75%

2 units:
20%

3 units:
5%
```

Subject to available inventory.

---

# 71. Jeep Quantity Distribution

Suggested:

```text
1 Jeep:
70%

2 Jeeps:
25%

3 Jeeps:
5%
```

---

# 72. Guest Count Generation

Must respect capacity.

Glamping:

```text
Deluxe Dome:
1–2 guest per unit

Family Dome:
1–4 guest per unit
```

Jeep:

```text
1–6 per Jeep
```

Generated total guest count cannot exceed selected quantity capacity.

---

# 73. Special Request Seed

Only some booking should have special requests.

Target:

```text
20–30%
```

Examples:

```text
Mohon kamar dekat area parkir jika memungkinkan.

Kami diperkirakan tiba sedikit malam.

Perjalanan bersama anak kecil.

Mohon informasi titik penjemputan.

Tidak ada permintaan khusus.
```

Avoid using generic lorem ipsum.

---

# 74. Cancellation Reasons

Seed variation:

```text
CUSTOMER_REQUEST
OPERATIONAL
DUPLICATE
OTHER
```

Most:

```text
CUSTOMER_REQUEST
```

---

# 75. Historical Payment Timing

Typical:

```text
booking created
↓
2–15 minutes later
payment verified
```

Some:

```text
failed attempt
↓
5 minutes
↓
success
```

This makes timeline realistic.

---

# 76. Invoice Timing

For confirmed seeded bookings:

```text
payment verified
↓
5–60 seconds
↓
invoice generated
```

Email:

```text
invoice generated
↓
5–30 seconds
↓
email sent
```

These are display timestamps only.

---

# 77. Invoice Seed Files

For historical seed, actual PDF files do not need to be generated for every booking during local reset if this slows setup excessively.

Recommended:

- generate real invoice for a small representative subset,
- store realistic generated invoice metadata for other historical seed only if the UI does not expose download.

However, any invoice exposed as downloadable in the demo UI must point to a real generated PDF.

---

# 78. Minimum Real Seed Invoice Files

Generate actual invoice PDF for:

```text
5–8 seeded confirmed/completed bookings
```

including named demo scenarios.

---

# 79. Live Booking Invoice

Any booking created through the real demo flow always generates a real PDF.

No exception.

---

# 80. Dashboard Chart Data

Chart must derive from actual seeded payment transactions.

Target current month shape:

```text
not flat
not perfectly linear
not obviously random spikes
```

Use varied booking/payment days.

---

# 81. Revenue Trend

Suggested:

- lower weekdays,
- stronger weekends,
- occasional high-value Glamping transaction,
- mixed Jeep revenue.

No need complex seasonal modeling.

---

# 82. Business Revenue Split

Target approximately:

```text
Glamping:
60–65%

Jeep:
35–40%
```

This is natural because Glamping booking value can be higher.

---

# 83. Booking Count Split

Target:

```text
Glamping:
~60%

Jeep:
~40%
```

consistent with seeded 29/19 split.

---

# 84. Recent Booking List

Seed should ensure recent bookings include mixed:

```text
Glamping
Jeep
Confirmed
Waiting Payment
```

so the table immediately demonstrates business filtering.

---

# 85. Dashboard Today Activities

Generate minimum:

```text
Upcoming Check-In
Payment Received
Jeep Tour Started
Booking Confirmed
```

within current business day.

---

# 86. Activity Copy

Example:

```text
09:24
DP received for GLP-260825-001234

11:10
New Jeep booking confirmed

14:00
Bagas Wicaksono scheduled for check-in

15:35
Invoice generated for GLP-...
```

---

# 87. Demo Admin Account

Seed one admin user.

Display:

```text
Demo Admin
```

Role:

```text
SUPER_ADMIN
```

---

# 88. Demo Admin Credential

Credential must **not** be committed as a production secret.

Recommended local/demo pattern:

```text
DEMO_ADMIN_EMAIL
DEMO_ADMIN_PASSWORD
```

from environment.

Seed script creates/updates admin from environment.

In `APP_MODE=demo`, the local operator fallback is:

```text
DEMO_ADMIN_EMAIL=admin@shakilagroup.demo
DEMO_ADMIN_PASSWORD=demo12345
```

These values are public demo credentials, not production secrets. Outside demo
mode the fallback is disabled and missing explicit credentials must fail closed.

`.env.example` only shows variable names.

---

# 89. Example `.env.example`

Conceptual only:

```text
DEMO_ADMIN_EMAIL=
DEMO_ADMIN_PASSWORD=
```

The standard local demo fallback above is intentionally documented for the demo
operator. Do not reuse it for production or non-demo environments.

---

# 90. Admin Profile

Display:

```text
Demo Admin
admin avatar initials:
DA
```

No need real profile photo.

---

# 91. Customer Testimonials — Glamping

Marketing-only seed.

Example 1:

```text
“Tempatnya tenang, view pagi bagus,
dan proses check-in sangat mudah.”

— Nadya, Surabaya
```

Example 2:

```text
“Cocok untuk short escape. Dome bersih
dan suasananya jauh lebih nyaman dari ekspektasi.”

— Fajar, Malang
```

These are fictional demo testimonials.

---

# 92. Customer Testimonials — Jeep

Example:

```text
“Driver tepat waktu dan rutenya teratur.
Sunrise-nya worth it banget.”

— Raka, Jakarta
```

```text
“Booking gampang dan Jeep-nya nyaman
buat satu keluarga.”

— Sinta, Sidoarjo
```

---

# 93. Glamping FAQ Seed

Questions:

```text
Jam check-in dan check-out?

Apakah sarapan sudah termasuk?

Apakah anak-anak diperbolehkan?

Bagaimana jika ingin menambah unit?

Apakah booking perlu membayar penuh?
```

---

# 94. Jeep FAQ Seed

Questions:

```text
Satu Jeep maksimal berapa orang?

Titik keberangkatan dari mana?

Apakah harga dihitung per orang?

Apakah bisa booking lebih dari satu Jeep?

Bagaimana jika cuaca kurang baik?
```

---

# 95. Glamping Gallery Categories

Demo images should cover:

```text
Exterior dome
Interior
Bathroom
Breakfast
Mountain view
Outdoor seating
Night atmosphere
```

---

# 96. Jeep Gallery Categories

```text
Jeep fleet
Bromo sunrise
Sand area
Savanna
Passenger experience
Convoy
Mountain route
```

---

# 97. Image Seed Rule

Do not use:

```text
placeholder image
gray box
Lorem Picsum visible in final client demo
```

Use curated demo images stored under app public assets initially.

---

# 98. Product Image Count

Minimum Glamping:

```text
8–12 strong images
```

Minimum Jeep:

```text
8–12 strong images
```

Enough for landing + detail + gallery.

---

# 99. Seed Availability Integrity

Seed process must allocate physical resources.

Do not create:

```text
booking quantity = 2
```

without:

```text
2 reservation rows
```

for active/occupied booking.

---

# 100. Seed Payment Integrity

Confirmed booking must satisfy:

```text
verifiedPaidAmount >= requiredDpAmount
```

---

# 101. Seed Completed Booking

Completed booking should have:

```text
CONFIRMED historical payment
CHECKED_IN event
CHECKED_OUT event
COMPLETED status
```

Timeline should be logically ordered.

---

# 102. Seed Cancelled Booking

If cancelled before payment:

```text
Payment:
UNPAID
```

If cancelled after DP:

```text
Payment:
PARTIALLY_PAID
```

Do not automatically set:

```text
REFUNDED
```

---

# 103. Seed Expired Booking

Must have:

```text
booking status = EXPIRED
reservations = RELEASED
verified paid amount = 0
```

unless it's intentionally a late-payment review scenario.

---

# 104. Seed Checked-In Booking

Must have:

```text
status = CHECKED_IN
checked_in_at != null
reservation state = IN_USE
required DP satisfied
```

---

# 105. Seed Checked-Out Booking

Must have:

```text
checked_in_at
checked_out_at
reservation released
```

---

# 106. Calendar Density

Do not fully fill every date.

The calendar should show:

```text
empty-ish dates
medium occupancy
limited occupancy
full occupancy
blocked inventory
```

to demonstrate all visual states.

---

# 107. Customer Demo Journey Seed Protection

Before live presentation, ensure at least one recommended date remains bookable.

Suggested:

```text
today + 12 days
```

Glamping Deluxe:

```text
minimum 2 available
```

Jeep:

```text
minimum 3 available
```

---

# 108. Dedicated Presentation Date

Implementation may define:

```text
DEMO_PRESENTATION_OFFSET_DAYS=12
```

only in local demo tooling if useful.

However business logic must not depend on this.

It is solely for presentation preparation.

---

# 109. Presentation Booking Data

When showing client, presenter should use real contact data specifically provided for the demo session.

Do not pre-seed client's real email.

At presentation time:

```text
Full Name:
client/presenter name

Email:
a real inbox accessible during demo

WhatsApp:
a valid demo number if needed
```

This allows real Resend delivery.

---

# 110. Demo Presentation Recommended Scenario

Primary scenario:

```text
Glamping
```

because it shows:

- date-range availability,
- accommodation inventory,
- booking,
- DP,
- payment,
- email,
- invoice,
- admin,
- check-in.

---

# 111. Presentation Step 1

Open:

```text
Shakila Glamping
```

Show:

- premium landing,
- hero,
- availability widget.

---

# 112. Presentation Step 2

Choose a pre-validated available date.

Recommended:

```text
today + 12 days
→
today + 13 days
```

Guests:

```text
2
```

---

# 113. Presentation Step 3

Select:

```text
Deluxe Dome
```

Quantity:

```text
1
```

---

# 114. Presentation Step 4

Use actual demo session customer details.

Show:

```text
Total
DP 30%
Remaining
```

before submitting.

---

# 115. Presentation Step 5

Submit booking.

Expected:

```text
Booking Count:
48
↓
49
```

after dashboard refetch.

---

# 116. Presentation Step 6

Proceed through actual Pakasir demo/test payment flow.

Do not use admin override.

---

# 117. Presentation Step 7

After payment:

show:

```text
Booking Confirmed
DP Paid
Invoice preparing/generated
```

---

# 118. Presentation Step 8

Open actual inbox.

Show:

```text
Booking Confirmation
Invoice PDF
```

---

# 119. Presentation Step 9

Open Central Admin.

Expected newest booking appears at top.

---

# 120. Presentation Step 10

Open booking detail.

Show:

```text
Customer
Reservation
Assigned unit
Payment
Remaining balance
Invoice
Timeline
```

---

# 121. Presentation Step 11

Do not perform Check-In on a far-future live booking if business rules reject early check-in.

Instead, demonstrate Check-In using the seeded:

```text
Bagas Wicaksono
```

booking scheduled for current date.

This respects real business rules.

---

# 122. Presentation Step 12

Open Jeep website.

Explain:

```text
Different website
Different booking model
Same backend
Same admin
```

---

# 123. Jeep Live Demo Option

If time permits:

choose:

```text
today + 3 days
```

Show:

```text
Sunrise
5 / 8 booked
3 available
```

No need complete second payment unless client asks.

---

# 124. Admin Dashboard Before Live Booking

Target initial visual:

```text
Bookings:
48

Customers:
30

Revenue Received:
~Rp38.750.000

Upcoming Reservations:
7+
```

Exact value must derive from seed.

---

# 125. Admin Dashboard After Live Booking

Expected:

```text
Bookings:
49
```

If payment verified current month:

```text
Revenue Received
```

also increases by live DP amount.

This change is a strong demo moment.

---

# 126. Seed Reset Behavior

Command target:

```bash
npm run db:seed
```

should be deterministic enough for dev.

Optional:

```bash
npm run db:reset
```

for local clean reset.

---

# 127. Seed Determinism

Use fixed seeded pseudo-random generator if randomization is used.

Example conceptual seed:

```text
DEMO_SEED = 20260825
```

or another stable value.

This makes data reproducible.

---

# 128. Relative Dates + Deterministic Data

Names/status/product can be deterministic while dates are relative to current seed date.

This gives:

- repeatable distribution,
- always-current dashboard.

---

# 129. Seed Idempotency

Running seed twice must not accidentally duplicate:

```text
businesses
products
units
admin
```

Recommended seed behavior:

- reset local environment before seed,
- or use known stable seed keys/upsert.

Choose simple and safe implementation.

---

# 130. Production Protection

Seed script must refuse destructive reseed on production/demo production unless explicit override is set.

Example:

```text
ALLOW_DEMO_RESEED=true
```

only for controlled environments.

Do not accidentally wipe client demo data.

---

# 131. Seed Script Structure

Recommended:

```text
packages/database/src/seed/
├── businesses.ts
├── products.ts
├── customers.ts
├── bookings.ts
├── payments.ts
├── invoices.ts
├── events.ts
├── admin.ts
└── index.ts
```

Exact structure may be adapted.

---

# 132. Seed Generation Order

Recommended:

```text
1. Businesses
2. Business Settings
3. Products
4. Physical Units
5. Departure Slots
6. Admin
7. Customers
8. Inventory Blocks
9. Historical Bookings
10. Physical Reservations
11. Payments
12. Payment Attempts
13. Invoices
14. Booking Events
```

---

# 133. Seed Transaction Use

Use database transaction where practical.

If seed fails halfway:

avoid leaving an inconsistent local demo database.

---

# 134. Realistic Booking Creation Timestamps

Historical:

```text
createdAt
```

should logically occur before reservation date.

Avoid:

```text
booking created after completed stay
```

unless intentionally imported historical data, which demo does not need.

---

# 135. Upcoming Booking Created At

Upcoming booking can be created:

```text
1–20 days before reservation date
```

for realism.

---

# 136. Payment Timestamp Ordering

Required:

```text
booking_created_at
<=
payment_attempt_created_at
<=
provider_paid_at
<=
payment_verified_at
```

for successful normal flow.

---

# 137. Invoice Timestamp Ordering

```text
payment_verified_at
<=
invoice_generated_at
<=
email_sent_at
```

---

# 138. Check-In Timestamp Ordering

Glamping:

```text
confirmed_at
<=
checked_in_at
<=
checked_out_at
```

---

# 139. Dashboard Display Currency

Always:

```text
Rp
```

Indonesian formatting.

---

# 140. Dashboard Demo Names

Recent booking list should prominently include:

```text
Ayu Lestari
Bagas Wicaksono
Dimas Saputra
Farah Putri
Intan Permata
```

so screenshots remain consistent.

---

# 141. Business Distribution Card

Suggested seeded display:

```text
Glamping
29 bookings

Jeep
19 bookings
```

Before live booking.

---

# 142. Customer Spending

Verified spending is derived from successful payments.

Do not manually store demo-specific fake spending totals unless derived/materialized by query.

---

# 143. Top Customer

Optional seed:

```text
Ayu Lestari
```

could have:

```text
3 bookings
```

across Glamping + Jeep.

This makes customer detail interesting.

---

# 144. Calendar Today State

Ensure today's calendar is not empty.

At minimum:

Glamping:

```text
1 current stay
1 scheduled check-in
```

Jeep:

```text
1 operational tour
```

---

# 145. Calendar Future State

The next week should visibly show reservation density.

Avoid every date having identical occupancy.

---

# 146. Payment Exception Count

Seed:

```text
1 requires-review payment
```

is enough.

Do not fill admin with errors.

---

# 147. Failed Payment Count

Seed:

```text
2–3 failed payment attempts
```

but successful retry may exist for some.

---

# 148. Invoice Failure

Optional seed:

```text
1 historical invoice failure
```

only if UI has invoice retry or error representation.

If not implemented in P1, omit to avoid broken-looking demo.

---

# 149. Email Failure

Same principle.

Only seed if admin UI properly handles it.

Otherwise all seeded exposed confirmation email events can be successful.

---

# 150. Waiting Payment Seed

Keep:

```text
2–4
```

active waiting-payment booking at runtime.

Because expiry is dynamic, seed process should create new future expiry timestamps.

---

# 151. Expired Booking Seed

Separate historical records:

```text
4
```

with release state.

---

# 152. Blocked Inventory Seed

Minimum:

```text
1 Glamping unit block
1 Jeep unit block
```

so calendar/block UI has data.

---

# 153. Product Edit Demonstration

Current product values:

```text
Deluxe Dome
Rp850.000
```

Seed historical booking with snapshot:

```text
Rp800.000
```

from a fictional previous price.

This demonstrates price snapshot preservation.

---

# 154. Historical Price Snapshot Scenario

Example:

Customer:

```text
Maya Anggraini
```

Historical Deluxe booking:

```text
unit price snapshot:
Rp800.000
```

Current product:

```text
Rp850.000
```

Admin booking detail should still show:

```text
Rp800.000
```

for historical record.

---

# 155. Invoice Snapshot Scenario

The same historical invoice must reflect:

```text
Rp800.000
```

not the current product price.

---

# 156. Seed Business Settings

Shakila Glamping:

```text
dp_percentage = 30
booking_hold_minutes = 30
timezone = Asia/Jakarta
currency = IDR
```

Shakila Jeep Tour:

same initial booking payment config.

---

# 157. Business Status

Both:

```text
is_active = true
```

---

# 158. Product Sort Order

Glamping:

```text
1 Deluxe Dome
2 Family Dome
```

Jeep:

```text
1 Sunrise Adventure
2 Full Bromo Experience
```

---

# 159. Seed Search Quality

Customer emails/names/booking codes should be varied enough to test:

```text
search booking code
search name
search email
search WhatsApp
```

---

# 160. Seed Pagination

48 bookings ensure:

```text
pageSize = 20
```

produces:

```text
3 pages
```

Good for pagination demo/test.

---

# 161. Payment Pagination

55+ attempts produce multiple pages as well.

---

# 162. Customer Pagination

30 customers:

```text
20 + 10
```

two pages at default page size.

---

# 163. Invoice File Naming

Seed generated invoice:

```text
INV-<date>-<sequence>.pdf
```

Object key:

```text
invoices/<business>/<year>/<month>/<filename>
```

---

# 164. Invoice Business Name

Glamping invoice:

```text
Shakila Glamping
```

Jeep invoice:

```text
Shakila Jeep Tour
```

Central admin name should not replace actual business identity on invoice.

---

# 165. Invoice Customer Data

Seed invoice uses booking snapshot customer fields.

---

# 166. Invoice Status Label

DP booking:

```text
DP PAID
```

or Indonesian:

```text
DP SUDAH DIBAYAR
```

Never:

```text
LUNAS
```

unless verifiedPaidAmount equals booking total.

---

# 167. Demo Email Branding

Glamping confirmation email:

```text
Shakila Glamping
```

Jeep:

```text
Shakila Jeep Tour
```

Emails may share infrastructure but not necessarily identical visual branding.

---

# 168. Demo Email Sender

Actual verified Resend sender is environment/deployment-specific.

Do not hardcode an unverified real domain into business logic.

Use environment/configuration.

---

# 169. Seed Email Events

Historical seeded email events do not need actual Resend messages sent during each reset.

They may be represented as historical booking events.

Do not spam inbox on `npm run db:seed`.

---

# 170. Seed External Side Effects

`npm run db:seed` must not:

- create real Pakasir transactions,
- send real Resend emails,
- upload dozens of unnecessary R2 files,
- notify external services.

Seed is primarily database initialization.

---

# 171. Seed Invoice PDFs Exception

If real representative PDF fixtures are needed:

generate locally/server-side without sending email.

Upload only when intentionally preparing demo environment.

---

# 172. Demo Environment Preparation Script

Optional future script:

```bash
npm run demo:prepare
```

can:

```text
migrate
seed
generate representative invoices
verify environment
```

Do not implement until Implementation Plan explicitly schedules it.

---

# 173. Dashboard Acceptance Criteria

After seed:

- [ ] Dashboard has non-zero revenue.
- [ ] Booking count is ~48.
- [ ] Both businesses represented.
- [ ] Recent bookings populated.
- [ ] Upcoming reservations populated.
- [ ] Today's activities populated.
- [ ] Chart has meaningful variation.
- [ ] Outstanding balance non-zero.
- [ ] Calendar populated.

---

# 174. Glamping Acceptance Criteria

After seed:

- [ ] 2 Glamping types exist.
- [ ] 6 physical Glamping units exist.
- [ ] At least one future limited availability date exists.
- [ ] At least one full date/type exists.
- [ ] At least one block exists.
- [ ] At least one checked-in booking exists.
- [ ] At least one upcoming confirmed booking exists.

---

# 175. Jeep Acceptance Criteria

After seed:

- [ ] 2 packages exist.
- [ ] 8 Jeep units exist.
- [ ] Departure slots exist.
- [ ] A date exists with 3 Jeeps available.
- [ ] A date exists with only 1 Jeep available.
- [ ] A full slot exists.
- [ ] A blocked Jeep exists.
- [ ] A current/upcoming Jeep booking exists.

---

# 176. Payment Acceptance Criteria

- [ ] Seed contains successful payments.
- [ ] Seed contains partial/DP payments.
- [ ] Seed contains failed attempt.
- [ ] Seed contains retry-success flow.
- [ ] Optional one late-payment review exists.
- [ ] Payment references are fictional.
- [ ] No real external payment call occurs during seed.

---

# 177. Invoice Acceptance Criteria

- [ ] Historical invoice metadata exists.
- [ ] Representative actual PDFs can be opened where UI exposes download.
- [ ] Invoice total matches booking snapshot.
- [ ] DP invoice shows remaining amount.
- [ ] Historical price snapshot remains correct.

---

# 178. Customer Acceptance Criteria

- [ ] Approximately 30 customers exist.
- [ ] Some customers use both businesses.
- [ ] Customer history has variety.
- [ ] No real personal data used.
- [ ] Search works against seeded data.

---

# 179. Presentation Acceptance Criteria

Before demo:

- [ ] Recommended Glamping date is available.
- [ ] Recommended Jeep date has available inventory.
- [ ] Admin starts with populated dashboard.
- [ ] Live booking becomes newest booking.
- [ ] Live payment changes revenue.
- [ ] Live invoice/email works.
- [ ] Seed current-date Check-In booking exists.
- [ ] Jeep availability demo scenario exists.

---

# 180. Codex Demo Data Rules

Codex must not:

- create `fakeBookings.ts` for admin production demo,
- return hardcoded dashboard KPIs,
- hardcode revenue chart values in UI,
- use real personal customer data,
- send Resend emails during ordinary DB seed,
- create Pakasir transaction during seed,
- ignore physical reservation allocation,
- create confirmed booking without verified payment,
- generate overlapping active accommodation reservations,
- generate duplicate Jeep reservations for same slot,
- hardcode all seed dates permanently to August 2026,
- create clearly fake names such as `Test User 1`,
- use placeholder invoice files in a live download flow.

---

# 181. Demo Data Source of Truth

Seed definitions live in:

```text
packages/database
```

not inside customer/admin frontend apps.

Frontend always obtains demo data through Central API.

---

# 182. Recommended Seed Summary

Initial target:

```text
BUSINESSES
2

GLAMPING TYPES
2

GLAMPING UNITS
6

JEEP PACKAGES
2

JEEP UNITS
8

CUSTOMERS
30

BOOKINGS
48

PAYMENT ATTEMPTS
55–60

ACTIVE INVENTORY BLOCKS
2

REPRESENTATIVE REAL INVOICE PDFs
5–8
```

---

# 183. Demo Story Summary

The seeded environment should visually communicate:

```text
This business has already been operating
through the system for some time.
```

Then the live client booking demonstrates:

```text
This is not only historical mock data.
The full workflow is actually working.
```

---

# 184. Definition of Done

Demo data is considered complete when a fresh seeded database can immediately support this sequence:

```text
Open Admin
↓
Dashboard already populated
↓
Open Booking list
↓
Multiple realistic bookings visible
↓
Open Calendar
↓
Availability and occupancy vary
↓
Open Payment page
↓
Realistic transaction history visible
↓
Open Customer
↓
Cross-business history visible
↓
Perform new customer booking
↓
New record appears naturally among seed data
```

No frontend code should need special knowledge of whether a record was seeded or created live.

---

# 185. Documentation Status

After this document:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅
DATABASE.md               ✅
API.md                    ✅
UI-UX-SPEC.md             ✅
DEMO-DATA.md              ✅

IMPLEMENTATION-PLAN.md    ← NEXT
AGENTS.md

CODING
```

The next document is:

```text
IMPLEMENTATION-PLAN.md
```

It will convert all specifications into an exact Codex execution plan with:

```text
Milestone 0 — Repository Foundation
Milestone 1 — Database
Milestone 2 — Seed
Milestone 3 — Booking Core
Milestone 4 — Public API
Milestone 5 — Glamping
Milestone 6 — Jeep
Milestone 7 — Pakasir
Milestone 8 — Invoice + Resend
Milestone 9 — Admin
Milestone 10 — Calendar / Operations
Milestone 11 — UI/UX Polish
Milestone 12 — E2E / Demo Readiness
Milestone 13 — Deployment
```

Each milestone will define:

```text
Goal
Dependencies
Exact tasks
Files/packages affected
Required tests
Acceptance criteria
What Codex must NOT do
Exit condition
```

That document will become the main execution checklist used when coding starts in Codex.
