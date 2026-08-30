# Business Rules

> **Client revision — 30 August 2026 (authoritative):** `required_dp_amount` is at least 50% of booking total. `expires_at` is created at booking time with a maximum 12-hour payment window. Uploading a proof never confirms a booking. Only an Admin-approved manual transfer amount is verified; confirmation occurs when cumulative verified payment reaches required DP. Rejected proofs leave a non-expired booking in `WAITING_PAYMENT` and permit retry. Paid DP is non-refundable when the booking is cancelled. Accommodation check-in starts 13:00 WIB and check-out is no later than 12:00 WIB. All date/time decisions use `Asia/Jakarta`.

## Product Demo — Glamping, Jeep & Central Admin Booking System

**Document:** `BUSINESS-RULES.md`  
**Version:** 1.0  
**Status:** Business Rule Baseline — Demo v1  
**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`

---

# 1. Purpose

Dokumen ini mendefinisikan seluruh aturan bisnis utama untuk Product Demo Booking System.

Dokumen ini menjadi source of truth untuk menentukan:

- bagaimana booking dibuat,
- bagaimana availability dihitung,
- bagaimana inventory ditahan,
- bagaimana DP bekerja,
- bagaimana payment diverifikasi,
- bagaimana booking expired,
- bagaimana invoice dibuat,
- bagaimana check-in/check-out dilakukan,
- bagaimana Glamping dan Jeep memiliki aturan inventory yang berbeda,
- bagaimana sistem mencegah double booking,
- bagaimana edge case ditangani.

Urutan otoritas dokumentasi:

```text
PRD.md
   ↓
BUSINESS-RULES.md
   ↓
DATABASE.md
   ↓
API.md
   ↓
IMPLEMENTATION
```

Jika implementasi bertentangan dengan business rules ini, maka business rules harus dianggap benar kecuali dokumen secara eksplisit direvisi.

---

# 2. Business Rule Principles

Sistem mengikuti prinsip utama berikut.

## BR-001 — Customer Tidak Membutuhkan Akun

Customer dapat melakukan seluruh booking flow tanpa:

- registrasi,
- login,
- password,
- customer account.

Booking diidentifikasi melalui booking code.

---

## BR-002 — Admin Membutuhkan Authentication

Seluruh fitur administrasi memerlukan authenticated admin session.

Customer tidak boleh dapat mengakses endpoint admin.

---

## BR-003 — Satu Central Booking System

Glamping dan Jeep menggunakan:

- database yang sama,
- customer data yang sama,
- booking lifecycle yang sama,
- payment infrastructure yang sama,
- invoice infrastructure yang sama,
- admin dashboard yang sama.

---

## BR-004 — Booking Merupakan Source of Truth

Availability tidak boleh dianggap final hanya berdasarkan hasil availability search.

Final availability harus diperiksa ulang ketika booking dibuat.

---

## BR-005 — Browser Bukan Source of Truth

Browser tidak boleh menentukan secara authoritative:

- harga,
- total booking,
- DP,
- availability,
- payment success,
- booking status,
- invoice status.

Semua nilai kritis dihitung dan diverifikasi oleh server.

---

# 3. Business Types

Demo v1 mempunyai dua business:

```text
GLAMPING
JEEP
```

Future:

```text
HOMESTAY
```

belum termasuk scope implementasi demo.

---

# 4. Business Identification

## BR-006 — Setiap Booking Memiliki Business

Semua booking wajib mempunyai satu business.

Contoh:

```text
GLP-260830-0012
business = GLAMPING
```

atau:

```text
JEP-260830-0018
business = JEEP
```

Booking tidak boleh memiliki lebih dari satu business dalam satu transaction.

---

# 5. Customer Rules

## BR-007 — Minimum Customer Information

Setiap booking wajib mempunyai:

```text
Full Name
Email
WhatsApp Number
```

Customer juga mempunyai reservation-specific data seperti guest count.

---

## BR-008 — Email Wajib Valid

Email harus divalidasi server-side.

Email digunakan untuk:

- booking confirmation,
- invoice,
- booking ownership verification.

---

## BR-009 — WhatsApp Wajib Valid

Nomor WhatsApp wajib diisi.

Nomor harus dinormalisasi sebelum disimpan.

Contoh input:

```text
081234567890
+6281234567890
6281234567890
```

dapat dinormalisasi ke canonical representation.

Exact normalization ditentukan pada implementation.

---

## BR-010 — Customer Identity Tidak Harus Unik

Satu email atau WhatsApp dapat mempunyai banyak booking.

Sistem tidak boleh menolak booking hanya karena customer pernah booking sebelumnya.

---

## BR-011 — Customer Record Dapat Digunakan Kembali

Apabila customer menggunakan email/WhatsApp yang sama, sistem boleh menghubungkan booking baru dengan customer record yang sama.

Namun hal ini tidak boleh menyebabkan customer login secara otomatis atau memperoleh akses ke semua booking tanpa verification.

---

# 6. Booking Code

## BR-012 — Booking Code Harus Unik

Setiap booking memiliki public booking code unik.

Contoh:

```text
GLP-260830-0012
JEP-260830-0018
```

---

## BR-013 — Business Prefix

Prefix:

```text
GLP = Glamping
JEP = Jeep
```

Future:

```text
HMS = Homestay
```

---

## BR-014 — Booking Code Bukan Database ID

Public booking code tidak boleh dianggap sebagai primary database identifier.

Internal database ID dan booking code merupakan dua field berbeda.

---

## BR-015 — Booking Code Tidak Boleh Menjadi Satu-satunya Authentication

Booking lookup membutuhkan:

```text
Booking Code
+
Email atau WhatsApp
```

---

# 7. Booking Lifecycle

Booking status demo v1:

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

# 8. Booking State Definitions

## BR-016 — PENDING

`PENDING` merupakan state internal singkat selama booking sedang dibuat.

State ini tidak dimaksudkan sebagai state customer-facing jangka panjang.

---

## BR-017 — WAITING_PAYMENT

Booking berada pada `WAITING_PAYMENT` apabila:

- booking telah dibuat,
- inventory telah di-hold,
- required DP belum diverifikasi.

---

## BR-018 — CONFIRMED

Booking menjadi `CONFIRMED` hanya setelah:

```text
required DP
>=
minimum required DP
```

dan payment telah diverifikasi server-side.

---

## BR-019 — CHECKED_IN

`CHECKED_IN` berarti customer telah memulai penggunaan layanan.

Untuk Glamping:

```text
guest telah check-in
```

Untuk Jeep:

```text
tour/service dianggap started
```

Pada demo UI dapat tetap menggunakan label:

```text
Checked In
```

untuk konsistensi operasional.

---

## BR-020 — CHECKED_OUT

Untuk Glamping:

```text
guest telah check-out
```

Untuk Jeep:

```text
service/tour telah selesai secara operasional
```

---

## BR-021 — COMPLETED

`COMPLETED` berarti transaksi operasional dianggap selesai.

Untuk demo:

```text
CHECKED_OUT
→
COMPLETED
```

dapat dilakukan otomatis atau melalui process sederhana.

Apabila auto-complete belum dibutuhkan untuk demo UI, `CHECKED_OUT` boleh menjadi final operational state yang terlihat.

Database tetap harus mendukung `COMPLETED`.

---

## BR-022 — CANCELLED

Booking yang dibatalkan admin menjadi:

```text
CANCELLED
```

Booking yang telah cancelled tidak boleh check-in.

---

## BR-023 — EXPIRED

Booking menjadi `EXPIRED` apabila:

- masih `WAITING_PAYMENT`,
- payment hold deadline telah lewat,
- required DP belum berhasil diverifikasi.

Inventory harus dilepas.

---

# 9. Valid Booking Transitions

Minimum valid transitions:

```text
PENDING
→ WAITING_PAYMENT

WAITING_PAYMENT
→ CONFIRMED

WAITING_PAYMENT
→ EXPIRED

WAITING_PAYMENT
→ CANCELLED

CONFIRMED
→ CHECKED_IN

CONFIRMED
→ CANCELLED

CHECKED_IN
→ CHECKED_OUT

CHECKED_OUT
→ COMPLETED
```

---

# 10. Invalid Booking Transitions

Contoh transition yang dilarang:

```text
EXPIRED → CHECKED_IN

CANCELLED → CHECKED_IN

WAITING_PAYMENT → CHECKED_IN

COMPLETED → WAITING_PAYMENT

CHECKED_OUT → CONFIRMED
```

Server wajib memvalidasi transition.

---

# 11. Payment Status

Payment status minimum:

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

# 12. Booking Status dan Payment Status Terpisah

## BR-024

Booking dan payment tidak boleh menggunakan field status yang sama.

Contoh valid:

```text
Booking:
CONFIRMED

Payment:
PARTIALLY_PAID
```

karena customer sudah membayar DP tetapi belum melunasi total booking.

---

# 13. Money Rules

## BR-025 — Currency

Demo v1 hanya menggunakan:

```text
IDR
```

---

## BR-026 — Money Tidak Menggunakan Floating Point

Nilai rupiah disimpan sebagai integer.

Contoh:

```text
Rp850.000
```

disimpan sebagai:

```text
850000
```

---

## BR-027 — Server Menghitung Harga

Frontend boleh menampilkan estimasi.

Tetapi ketika booking dibuat:

server wajib menghitung ulang:

```text
unit price
quantity
number of nights
subtotal
additional charge
total
DP
remaining
```

---

# 14. Price Snapshot

## BR-028

Harga booking harus di-snapshot saat booking dibuat.

Misalnya saat booking:

```text
Deluxe Dome
Rp850.000
```

Admin kemudian mengubah harga menjadi:

```text
Rp950.000
```

Booking lama tetap:

```text
Rp850.000
```

---

## BR-029

Minimum financial snapshot:

```text
product name
unit price
quantity
number of nights where applicable
subtotal
additional amount
total amount
DP percentage
DP amount
amount paid
remaining amount
```

---

# 15. DP Rules

## BR-030 — Default DP

Default demo:

```text
30%
```

---

## BR-031 — DP Configurable

DP percentage tidak boleh ditulis hardcoded di frontend.

DP berasal dari business configuration atau booking configuration.

---

## BR-032 — DP Calculation

Contoh:

```text
Total
Rp900.000

DP
30%
```

maka:

```text
DP = Rp270.000
```

---

## BR-033 — Remaining Balance

Formula:

```text
remaining_balance
=
booking_total
-
verified_amount_paid
```

---

## BR-034 — Confirmation Threshold

Booking dikonfirmasi apabila verified payment memenuhi atau melebihi required DP.

Conceptually:

```text
verified_amount_paid >= required_dp_amount
```

---

## BR-035 — Full Payment Diperbolehkan

Apabila provider/payment flow menghasilkan pembayaran penuh:

```text
amount_paid = total_amount
```

maka:

```text
Booking Status = CONFIRMED
Payment Status = PAID
Remaining = 0
```

---

# 16. Payment Status Calculation

## BR-036 — UNPAID

```text
verified amount = 0
```

---

## BR-037 — PARTIALLY_PAID

```text
0 < verified amount < booking total
```

---

## BR-038 — PAID

```text
verified amount >= booking total
```

Payment amount tidak boleh secara normal melebihi total.

Overpayment menjadi exception yang harus dicatat.

---

# 17. Temporary Hold

## BR-039 — Hold Dibuat Saat Booking

Ketika booking berhasil dibuat:

```text
Booking = WAITING_PAYMENT
```

inventory langsung dianggap reserved sementara.

---

## BR-040 — Default Hold Duration

Demo default:

```text
30 minutes
```

---

## BR-041 — Hold Duration Configurable

Hold duration tidak boleh hardcoded di UI.

---

## BR-042 — Hold Deadline Server-side

System menyimpan:

```text
expires_at
```

berdasarkan server time.

Browser countdown hanya representasi visual.

---

## BR-043 — Browser Ditutup Tidak Membatalkan Hold

Apabila customer menutup browser:

hold tetap berlaku sampai:

```text
payment success
atau
expires_at
```

---

# 18. Expiration

## BR-044

Booking hanya boleh otomatis expire apabila:

```text
status = WAITING_PAYMENT
AND
expires_at <= current server time
AND
required DP belum verified
```

---

## BR-045 — Confirmed Booking Tidak Boleh Di-expire

Jika payment berhasil sebelum expiration job dijalankan:

```text
CONFIRMED
```

tidak boleh kemudian berubah menjadi:

```text
EXPIRED
```

Background worker wajib membaca current database state sebelum melakukan expiration.

---

## BR-046 — Expiration Melepas Inventory

Setelah booking menjadi:

```text
EXPIRED
```

inventory kembali available.

---

# 19. Payment Menjelang Expiry

## BR-047

Yang menentukan valid atau tidak adalah **waktu payment berhasil menurut verified provider transaction**, bukan kapan browser success page terbuka.

---

## BR-048

Jika payment berhasil sebelum `expires_at`, tetapi webhook terlambat diterima, sistem masih boleh mengkonfirmasi booking apabila provider menunjukkan successful payment terjadi sebelum expiration.

---

# 20. Payment Setelah Booking Expired

## BR-049 — Late Payment Exception

Jika:

```text
booking sudah EXPIRED
```

dan provider kemudian menunjukkan customer membayar setelah expiration deadline:

booking **tidak boleh otomatis dikonfirmasi**.

Alasannya:

inventory mungkin sudah diberikan kepada customer lain.

---

## BR-050

Late payment harus:

- dicatat sebagai verified payment,
- mempertahankan booking dalam `EXPIRED`,
- diberi operational flag:

```text
requires_review = true
```

atau equivalent exception mechanism.

---

## BR-051

Demo tidak perlu membuat automated refund untuk late payment.

Admin harus dapat melihat bahwa payment membutuhkan review.

Refund/manual resolution termasuk future production workflow.

---

# 21. Payment Gateway Authority

## BR-052

Redirect success page bukan bukti pembayaran.

---

## BR-053

Frontend tidak boleh menjalankan:

```text
payment.status = PAID
```

berdasarkan redirect URL.

---

## BR-054

Payment dianggap valid hanya setelah server melakukan verification melalui Pakasir integration.

---

# 22. Payment Verification

Server harus memvalidasi minimum:

```text
internal order reference
booking
expected payment amount
provider transaction identity
provider transaction status
```

Jika tersedia, lakukan server-to-server provider transaction verification.

---

# 23. Payment Amount Mismatch

## BR-055

Apabila Pakasir menyatakan successful tetapi amount tidak sesuai dengan expected payment:

system tidak boleh silently confirm booking.

---

## BR-056

Payment disimpan sebagai exception:

```text
PAYMENT_AMOUNT_MISMATCH
```

dan booking membutuhkan review.

---

# 24. Duplicate Webhook

## BR-057 — Idempotency

Provider dapat mengirim webhook berkali-kali.

Contoh:

```text
Webhook 1
Webhook 2
Webhook 3
```

harus menghasilkan satu logical payment processing.

---

## BR-058

Duplicate webhook tidak boleh menyebabkan:

- payment record duplicate,
- amount paid bertambah berkali-kali,
- invoice duplicate,
- confirmation event duplicate,
- email confirmation duplicate secara logical,
- inventory mutation duplicate.

---

# 25. Payment Transaction Identity

Setiap external payment transaction harus mempunyai provider transaction/reference identifier yang dapat digunakan untuk idempotency.

Jika Pakasir menggunakan combination reference tertentu, database harus memiliki unique constraint yang sesuai.

Exact field ditentukan pada `DATABASE.md`.

---

# 26. Glamping Domain

Glamping menggunakan:

```text
Glamping Type
      ↓
Physical Glamping Units
```

---

# 27. Glamping Type

Contoh:

```text
Deluxe Dome
Family Dome
```

Glamping type mempunyai:

- name,
- description,
- capacity,
- base price,
- active status.

---

# 28. Physical Glamping Unit

Contoh:

```text
Deluxe Dome

Dome 01
Dome 02
Dome 03
Dome 04
```

Physical unit digunakan untuk internal inventory.

Customer tidak memilih nomor unit.

---

# 29. Glamping Quantity

Customer memilih:

```text
Glamping Type
+
Number of Units
```

Contoh:

```text
Deluxe Dome
2 Units
```

---

# 30. Glamping Guest Capacity

## BR-059

Jumlah guest tidak boleh melebihi total supported capacity booking tanpa additional business rule.

Contoh:

```text
Deluxe capacity = 2/unit
quantity = 2

max = 4 guests
```

Jika customer memilih:

```text
5 guests
```

booking ditolak atau customer diminta menambah quantity.

Demo v1 menggunakan strict capacity.

---

# 31. Glamping Date Range

## BR-060

Glamping membutuhkan:

```text
check_in_date
check_out_date
```

---

## BR-061

Validation:

```text
check_in_date < check_out_date
```

---

## BR-062

Same-day stay:

```text
check-in 30 Aug
check-out 30 Aug
```

tidak valid.

---

# 32. Glamping Night Calculation

Formula:

```text
night_count
=
difference between check-out date and check-in date
```

Contoh:

```text
30 Aug → 31 Aug = 1 night
30 Aug → 1 Sep = 2 nights
```

---

# 33. Check-Out Date Availability

## BR-063

Check-out date **tidak memblokir malam berikutnya**.

Contoh:

Booking A:

```text
Check-in:
29 Aug

Check-out:
30 Aug
```

Booking B boleh:

```text
Check-in:
30 Aug
```

pada physical unit yang sama.

---

# 34. Glamping Date Overlap Rule

Dua booking accommodation overlap apabila:

```text
existing_check_in < requested_check_out
AND
existing_check_out > requested_check_in
```

Booking yang:

```text
existing_check_out = requested_check_in
```

tidak dianggap overlap.

---

# 35. Glamping Availability

## BR-064

Availability dihitung berdasarkan:

```text
Glamping Type
+
Date Range
+
Active Physical Units
-
Booked/Held Units
-
Blocked Units
```

---

## BR-065

Untuk booking beberapa malam, requested quantity harus tersedia untuk **seluruh date range**.

---

## BR-066

Jika:

```text
30 Aug available = 3
31 Aug available = 1
```

dan customer meminta:

```text
2 units
30 Aug → 1 Sep
```

booking tidak valid.

---

# 36. Physical Unit Assignment

Untuk demo, server boleh menentukan physical unit secara internal saat booking/confirmation sesuai concurrency strategy.

Customer tidak perlu melihat unit number.

Admin boleh melihat assigned unit apabila dibuat pada UI.

---

# 37. Glamping Price Calculation

Basic formula:

```text
subtotal
=
night_count
×
quantity
×
snapshot nightly unit price
```

Contoh:

```text
Rp850.000
× 2 nights
× 2 units

=
Rp3.400.000
```

---

# 38. Glamping Service Charge

Apabila demo menggunakan service charge:

service charge harus berasal dari configuration.

Tidak boleh hardcoded hanya untuk membuat UI terlihat menarik.

Jika belum diperlukan:

```text
service charge = 0
```

diperbolehkan.

---

# 39. Jeep Domain

Jeep menggunakan:

```text
Jeep Package
+
Tour Date
+
Departure Slot
+
Physical Jeep Inventory
```

---

# 40. Jeep Package

Contoh:

```text
Sunrise Adventure
Full Adventure Experience
```

Package mempunyai minimum:

- name,
- description,
- price per Jeep,
- passenger capacity,
- active status.

---

# 41. Jeep Physical Unit

Contoh:

```text
Jeep 01
Jeep 02
...
Jeep 08
```

Customer tidak memilih specific unit.

---

# 42. Jeep Departure Slot

Contoh:

```text
03:00
08:00
```

Package dapat memiliki satu atau lebih departure slot.

---

# 43. Jeep Availability Scope

## BR-067

Availability Jeep dihitung berdasarkan:

```text
date
+
departure slot
+
active physical Jeep units
-
held/booked units
-
blocked units
```

---

# 44. Jeep Quantity

Customer memilih jumlah:

```text
Jeep Units
```

Contoh:

```text
2 Jeeps
```

---

# 45. Jeep Passenger Capacity

## BR-068

Jika capacity:

```text
6 passengers / Jeep
```

dan quantity:

```text
2 Jeep
```

maximum:

```text
12 guests
```

Guest count lebih dari capacity harus ditolak.

---

# 46. Jeep Price Calculation

Formula:

```text
subtotal
=
package snapshot price per Jeep
×
Jeep quantity
```

Tidak menggunakan night calculation.

---

# 47. Jeep Slot Independence

## BR-069

Booking:

```text
30 Aug
03:00
```

tidak otomatis memblokir:

```text
30 Aug
08:00
```

jika business configuration mengizinkan unit digunakan kembali.

---

## BR-070 — Demo Simplification

Untuk demo v1, setiap physical Jeep dianggap hanya dapat digunakan **satu kali per defined departure slot**.

Jeep dapat tersedia pada slot lain di tanggal yang sama.

Tidak perlu menghitung travel duration overlap antar slot pada demo.

Advanced fleet scheduling masuk future scope.

---

# 48. Jeep Date Validation

Tour date tidak boleh berada di masa lalu berdasarkan business timezone.

---

# 49. Product Active Status

## BR-071

Glamping type/package yang:

```text
active = false
```

tidak boleh muncul sebagai bookable product.

Existing historical booking tetap valid dan tetap dapat dilihat.

---

# 50. Physical Unit Active Status

## BR-072

Unit inactive tidak dihitung sebagai inventory available.

Existing historical data tidak dihapus.

---

# 51. Block Date

Admin dapat memblokir inventory secara manual.

---

# 52. Block Reasons

Minimum reason:

```text
Maintenance
Private Use
Operational
Other
```

Free-text note diperbolehkan.

---

# 53. Glamping Block

Admin dapat block:

```text
specific physical unit
+
date range
```

---

# 54. Jeep Block

Admin dapat block:

```text
specific Jeep unit
+
date
+
optional departure slot
```

Jika departure slot kosong, unit dianggap blocked untuk seluruh slot di tanggal tersebut.

---

# 55. Existing Booking vs Block

## BR-073

Admin tidak boleh membuat block yang silently membatalkan confirmed booking.

Jika block conflict dengan confirmed booking:

request harus ditolak atau admin harus menyelesaikan booking conflict terlebih dahulu.

Demo menggunakan:

```text
reject conflicting block
```

---

# 56. Availability Status

UI dapat menggunakan:

```text
Available
Limited
Full
```

Tetapi authoritative value tetap numeric availability.

---

# 57. Limited Availability

Threshold visual dapat digunakan.

Contoh:

```text
remaining <= 2
→ Limited
```

Threshold merupakan UI/config rule dan tidak mempengaruhi booking logic.

---

# 58. Concurrency

## BR-074

Availability check sebelum checkout tidak menjamin inventory.

---

## BR-075

Ketika booking dibuat, server wajib menjalankan final availability check dalam concurrency-safe transaction.

---

## BR-076

Jika dua customer meminta inventory terakhir pada saat sama:

hanya satu booking yang boleh berhasil apabila inventory tidak cukup untuk keduanya.

---

# 59. Example Double Booking

Inventory:

```text
Deluxe Dome available:
1
```

Customer A:

```text
requests 1
```

Customer B:

```text
requests 1
```

Expected:

```text
one succeeds
one receives INVENTORY_NOT_AVAILABLE
```

---

# 60. Booking Creation Atomicity

Booking creation harus dianggap satu atomic operation untuk data kritis.

Jika booking gagal sebelum commit:

tidak boleh meninggalkan:

- partial booking,
- orphan hold,
- incorrect inventory reservation.

---

# 61. Inventory Hold and Assignment

Implementation boleh menggunakan:

- explicit hold records,
- booking records yang counted as active hold,
- physical unit assignments,

sesuai desain `DATABASE.md`.

Tetapi behavior harus mengikuti rules di dokumen ini.

---

# 62. Active Inventory Consumption

Status booking berikut mengonsumsi inventory:

```text
WAITING_PAYMENT
CONFIRMED
CHECKED_IN
```

Untuk accommodation, selama tanggal booking overlap.

---

# 63. Non-Consuming Booking Status

Status berikut tidak mengonsumsi future inventory:

```text
EXPIRED
CANCELLED
COMPLETED
```

`CHECKED_OUT` juga tidak mengonsumsi slot future setelah reservation range selesai.

---

# 64. Booking Creation

Minimum server flow:

```text
Validate request
      ↓
Load authoritative product
      ↓
Calculate authoritative price
      ↓
Validate date/slot
      ↓
Validate capacity
      ↓
Begin DB transaction
      ↓
Check inventory
      ↓
Reserve inventory
      ↓
Create booking
      ↓
Create financial snapshot
      ↓
Create activity event
      ↓
Commit
```

---

# 65. Payment Creation Failure

Jika booking berhasil dibuat tetapi Pakasir transaction creation gagal:

booking tetap:

```text
WAITING_PAYMENT
```

selama hold belum expired.

Customer harus memperoleh option retry payment.

---

# 66. Multiple Payment Attempts

## BR-077

Satu booking boleh mempunyai lebih dari satu payment attempt.

Contoh:

```text
Attempt 1
FAILED

Attempt 2
SUCCESS
```

---

## BR-078

Hanya verified successful transactions yang dihitung ke:

```text
amount_paid
```

---

# 67. Failed Payment

Payment failure tidak langsung membuat booking expired.

Selama:

```text
current_time < expires_at
```

customer boleh retry payment.

---

# 68. Booking Lookup

Minimum request:

```text
Booking Code
+
Email
```

atau:

```text
Booking Code
+
WhatsApp
```

---

# 69. Lookup Matching

Email comparison harus normalized secara aman.

Phone comparison menggunakan normalized phone representation.

---

# 70. Lookup Failure

Response tidak boleh mengatakan:

```text
"Booking exists but email wrong"
```

karena dapat membocorkan existence.

Gunakan generic response:

```text
Booking tidak ditemukan atau data verifikasi tidak sesuai.
```

---

# 71. Customer Booking Data Exposure

Public booking lookup hanya boleh menampilkan data customer yang diperlukan.

Tidak boleh menampilkan:

- internal admin notes,
- provider secrets,
- raw webhook payload,
- internal database IDs,
- security metadata.

---

# 72. Invoice Creation Trigger

## BR-079

Invoice pertama dibuat setelah required DP berhasil diverifikasi.

---

# 73. Invoice Uniqueness

Satu invoice initial DP confirmation hanya dibuat satu kali untuk satu logical invoice event.

Duplicate webhook tidak boleh menghasilkan invoice baru.

---

# 74. Invoice Number

Invoice number harus unik.

Contoh:

```text
INV-260830-0012
```

Format final akan ditentukan di `DATABASE.md`.

---

# 75. Invoice Data Snapshot

Invoice menggunakan data snapshot dari booking.

Bukan current product configuration.

---

# 76. Minimum Invoice Data

Invoice minimal:

```text
Business
Invoice Number
Booking Code

Customer
Email
WhatsApp

Product / Package
Reservation Date
Quantity
Guest Count

Subtotal
Total
DP Percentage
Amount Paid
Remaining

Payment Method
Payment Date
Payment Status

Issue Date
```

---

# 77. Invoice Payment Label

Jika baru DP:

jangan menulis:

```text
LUNAS
```

Gunakan:

```text
DP PAID
PARTIALLY PAID
```

dan tampilkan:

```text
Remaining Balance
```

---

# 78. Invoice Storage Failure

Jika payment sudah verified tetapi invoice generation/storage gagal:

```text
Booking tetap CONFIRMED
```

Invoice workflow harus retry.

---

# 79. Email Trigger

Booking confirmation email hanya dikirim setelah:

```text
Booking = CONFIRMED
```

---

# 80. Email Contains

Minimum:

```text
Customer name
Booking code
Product/package
Reservation information
Amount paid
Remaining
Booking status
Invoice information
Booking lookup/view CTA
```

---

# 81. Email Failure

Email failure:

```text
tidak membatalkan booking
tidak membatalkan payment
```

Email harus retry melalui background workflow.

---

# 82. Duplicate Email Protection

Satu logical booking confirmation tidak boleh dikirim berkali-kali hanya karena duplicate payment webhook.

Retry karena delivery failure diperbolehkan.

---

# 83. Check-In Eligibility

Booking dapat check-in apabila minimum:

```text
Booking Status = CONFIRMED
Required DP = verified
Reservation date is valid
```

---

# 84. Glamping Check-In Date

Default rule demo:

admin dapat check-in Glamping hanya pada:

```text
check-in date
```

berdasarkan business timezone.

---

# 85. Early Check-In

Early check-in sebelum reservation date:

```text
not allowed
```

pada demo v1.

Admin override tidak tersedia.

---

# 86. Late Check-In

Booking confirmed yang belum check-in pada check-in date tidak otomatis cancelled.

Admin masih dapat check-in selama reservation belum dianggap selesai.

No-show workflow masuk future scope.

---

# 87. Jeep Check-In / Start

Untuk Jeep:

`CHECKED_IN` merepresentasikan bahwa customer/service telah dimulai.

Admin dapat melakukan action pada tour date.

---

# 88. Check-In Payment Rule

Booking dengan:

```text
UNPAID
PENDING
```

tidak boleh check-in.

---

## BR-080

Payment minimal harus memenuhi required DP.

Pelunasan penuh **tidak diwajibkan untuk check-in pada demo v1** karena requirement client hanya mensyaratkan DP untuk dapat check-in.

---

# 89. Check-In Idempotency

Jika booking sudah:

```text
CHECKED_IN
```

klik/check-in request lagi tidak boleh membuat event duplicate.

---

# 90. Check-Out Eligibility

Check-out hanya dapat dilakukan jika:

```text
Booking = CHECKED_IN
```

---

# 91. Glamping Check-Out

Admin dapat check-out pada atau setelah check-out date.

Untuk demo, manual check-out sebelum scheduled date diperbolehkan hanya jika admin mengonfirmasi action.

Ini tidak mengubah historical booked date range.

---

# 92. Jeep Completion

Jeep dapat menggunakan:

```text
CHECKED_IN
→
CHECKED_OUT
```

untuk menandai tour selesai.

---

# 93. Cancellation Before Payment

Booking `WAITING_PAYMENT` dapat dibatalkan.

Result:

```text
Booking = CANCELLED
Inventory released
```

---

# 94. Cancellation After DP

Booking `CONFIRMED` dapat dibatalkan admin.

Result:

```text
Booking = CANCELLED
```

Payment tidak otomatis menjadi refunded.

---

# 95. Cancellation Does Not Mean Refund

## BR-081

```text
Booking CANCELLED
```

tidak sama dengan:

```text
Payment REFUNDED
```

Refund merupakan domain operation berbeda.

---

# 96. Refund Scope

Automated refund tidak termasuk demo v1.

Jika confirmed booking yang telah dibayar dibatalkan:

payment mempertahankan state pembayaran aktual.

Contoh:

```text
Booking:
CANCELLED

Payment:
PARTIALLY_PAID
```

Admin dapat menangani refund secara manual di luar demo.

---

# 97. Cancellation Reason

Admin cancellation wajib memiliki reason atau note.

Timeline harus mencatat:

```text
BOOKING_CANCELLED
```

---

# 98. Cancelled Inventory

Setelah booking cancelled:

future inventory reservation harus dilepas.

---

# 99. Admin Edit Price

Admin dapat mengubah product/package current price.

Perubahan berlaku untuk booking baru.

Tidak boleh mengubah booking snapshot lama.

---

# 100. Admin Disable Product

Jika product disabled:

tidak menerima booking baru.

Existing booking tidak otomatis cancelled.

---

# 101. Admin Edit Existing Booking

Demo v1 tidak menyediakan advanced reservation modification seperti:

- mengganti tanggal,
- mengganti tipe,
- mengganti quantity,
- menambah malam,
- pindah package.

Perubahan kompleks masuk future scope.

Hal ini mengurangi risiko inconsistency dalam demo.

---

# 102. Customer Cannot Modify Booking

Customer demo v1 tidak dapat mengubah reservation setelah booking dibuat.

Customer hanya dapat:

- melihat,
- mengecek status,
- download invoice.

---

# 103. Customer Cancellation

Self-service customer cancellation tidak termasuk demo v1.

Cancellation dilakukan admin.

---

# 104. Historical Booking

Booking historical seed boleh mempunyai status:

```text
COMPLETED
CHECKED_OUT
CANCELLED
EXPIRED
```

Seed harus mengikuti rule lifecycle secara logis.

---

# 105. Dashboard Revenue

Untuk demo:

`Revenue` berarti **verified payment amount received**, bukan total booking value.

---

# 106. Booking Value Metric

Jika UI membutuhkan:

```text
Booking Value
```

maka ini dapat menggunakan:

```text
sum booking total
```

dan harus dibedakan dari:

```text
Revenue Received
```

---

# 107. Outstanding Balance

Formula:

```text
Outstanding
=
Confirmed booking total
-
verified amount paid
```

Untuk booking cancelled, outstanding dapat dikeluarkan dari operational outstanding summary.

---

# 108. Dashboard Booking Count

Booking count harus jelas apakah menghitung:

- all,
- confirmed,
- today,
- upcoming.

KPI tidak boleh menggunakan definisi ambigu.

---

# 109. Upcoming Glamping Reservation

Upcoming reservation:

```text
booking status = CONFIRMED
AND
check-in date >= today
```

---

# 110. Upcoming Jeep Reservation

```text
booking status = CONFIRMED
AND
tour date >= today
```

---

# 111. Calendar Inventory

Calendar harus menghitung:

```text
confirmed bookings
+
active payment holds
+
inventory blocks
```

untuk menentukan availability.

---

# 112. Calendar Customer Display

Admin calendar hanya menampilkan customer booking yang relevant.

Customer-facing availability tidak menampilkan identitas customer lain.

---

# 113. Business Timezone

Seluruh business date rule menggunakan business timezone.

Default sementara:

```text
Asia/Jakarta
```

---

# 114. Date Boundary

`today` untuk:

- check-in eligibility,
- Jeep tour date,
- booking expiration display,

harus dihitung berdasarkan server/business timezone, bukan timezone browser.

---

# 115. Booking Created Timestamp

Transaction timestamp disimpan timezone-aware.

Display dikonversi ke business timezone.

---

# 116. Booking Date vs Created At

Jangan mencampurkan:

```text
reservation date
```

dengan:

```text
booking created timestamp
```

Keduanya memiliki makna berbeda.

---

# 117. Past Reservation

Customer tidak boleh membuat booking baru untuk tanggal yang sudah lewat.

---

# 118. Same-Day Booking

Same-day booking diperbolehkan selama:

- date belum dianggap unavailable,
- product active,
- inventory tersedia.
- untuk Jeep, jam departure slot masih berada di masa depan berdasarkan
  timezone bisnis `Asia/Jakarta`.

Server harus menolak quote, availability, dan booking Jeep untuk slot hari ini
yang jam keberangkatannya sudah lewat. Pemeriksaan browser hanya untuk UX dan
bukan sumber otoritas.

---

# 119. Maximum Future Booking

Demo tidak perlu membatasi booking window secara khusus.

Jika diperlukan UI dapat menampilkan 12 bulan ke depan.

Tidak perlu business rule permanen untuk v1.

---

# 120. Special Request

Special request merupakan informational text.

Special request:

- tidak mengubah harga otomatis,
- tidak menjamin fulfillment,
- tidak mengubah inventory.

---

# 121. Guest Count

Guest count harus positive integer.

Minimum:

```text
1
```

---

# 122. Quantity

Glamping unit quantity dan Jeep quantity harus positive integer.

Minimum:

```text
1
```

---

# 123. Price Tampering

Jika frontend mengirim total:

```text
Rp1
```

sedangkan server menghitung:

```text
Rp900.000
```

server wajib menggunakan:

```text
Rp900.000
```

Frontend total tidak authoritative.

---

# 124. Product Tampering

Customer tidak boleh memesan inactive/nonexistent product hanya dengan memanipulasi request payload.

Server wajib resolve product dari database.

---

# 125. Availability Tampering

Request quantity harus divalidasi ulang terhadap real inventory.

---

# 126. Booking Hold Abuse

Public booking endpoint harus protected dengan:

- server validation,
- rate limiting,
- Cloudflare Turnstile.

Tujuannya mencegah bot membuat banyak hold.

---

# 127. Turnstile Failure

Booking tidak dibuat apabila required Turnstile validation gagal.

---

# 128. Rate Limit

Rate limit harus berlaku terutama untuk:

```text
booking creation
booking lookup
payment initiation
```

Exact limit ditentukan pada implementation.

---

# 129. Personal Data

Customer data hanya digunakan dalam konteks operasional booking demo.

Data customer tidak boleh ditampilkan publicly.

---

# 130. Admin Notes

Admin notes tidak pernah muncul pada public booking lookup atau invoice kecuali field secara eksplisit ditandai customer-visible.

---

# 131. Audit Trail

Critical operation membuat event.

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

# 132. Audit Events Immutable

Audit event tidak di-edit untuk mengganti history.

Jika terjadi correction, tambahkan event baru.

---

# 133. Event Timestamp

Setiap event mempunyai server timestamp.

---

# 134. Event Actor

Apabila applicable, event harus mengetahui actor:

```text
SYSTEM
CUSTOMER
ADMIN
PAYMENT_PROVIDER
BACKGROUND_JOB
```

---

# 135. Admin Check-In Event

Minimum metadata:

```text
booking
timestamp
admin
previous status
new status
```

---

# 136. Payment Timeline

Raw sensitive provider payload tidak perlu ditampilkan di admin timeline.

Timeline menampilkan human-readable event.

---

# 137. Booking Payment Retry

Customer dapat membuka booking yang masih `WAITING_PAYMENT` untuk retry payment selama belum expired.

---

# 138. Expired Booking Payment Retry

Expired booking tidak boleh membuat payment attempt baru.

Customer harus membuat booking baru.

---

# 139. Confirmed Booking Payment Retry

Jika booking sudah confirmed dengan DP:

demo v1 tidak menyediakan online balance payment flow kedua kecuali nanti ditambahkan.

---

# 140. Remaining Payment

Remaining balance hanya informational pada demo.

Admin dapat melihat:

```text
remaining balance
```

tetapi workflow pelunasan online bukan required demo v1.

---

# 141. Manual Balance Payment

Fitur admin `Record Pelunasan` tidak diwajibkan untuk demo v1 kecuali ditambahkan pada implementation plan.

Jangan membangun tanpa requirement.

---

# 142. Invoice Scope

Invoice yang dibuat demo merupakan invoice/receipt atas booking setelah pembayaran DP.

Invoice harus tetap menunjukkan:

```text
Total
Paid
Remaining
```

---

# 143. Invoice Regeneration

Admin boleh mengunduh invoice yang sudah ada.

Default behavior tidak generate nomor invoice baru.

---

# 144. Product Deletion

Product yang sudah mempunyai booking historical tidak boleh hard-delete.

Gunakan:

```text
active = false
```

atau soft deletion strategy.

---

# 145. Unit Deletion

Physical unit historical tidak boleh hard-delete apabila pernah digunakan oleh booking.

Gunakan inactive/soft deletion.

---

# 146. Customer Deletion

Customer deletion tidak diperlukan pada demo.

Historical booking harus mempertahankan snapshot customer information yang diperlukan.

---

# 147. Booking Customer Snapshot

Minimum booking menyimpan snapshot:

```text
customer name
email
WhatsApp
```

sehingga perubahan future customer master data tidak mengubah invoice/history booking lama.

---

# 148. Booking Product Snapshot

Minimum:

```text
product name
price
capacity where relevant
```

disimpan sebagai booking snapshot.

---

# 149. Availability API Behavior

Availability response boleh dianggap stale segera setelah diterima.

UI sebaiknya memberi pesan apabila final booking gagal karena inventory sudah diambil customer lain.

Contoh:

```text
Maaf, ketersediaan baru saja berubah.
Silakan pilih pilihan lain.
```

---

# 150. No Overselling

Tidak ada kondisi business-normal dimana:

```text
confirmed quantity
>
available inventory
```

untuk date/slot yang sama.

---

# 151. Glamping Example A

Inventory:

```text
Deluxe Dome
4 units
```

Bookings:

```text
Booking A
30 Aug → 31 Aug
2 units

Booking B
30 Aug → 1 Sep
1 unit
```

Availability untuk:

```text
30 Aug → 31 Aug
```

adalah:

```text
1 unit
```

---

# 152. Glamping Example B — Checkout Boundary

Booking A:

```text
Dome 01
29 Aug → 30 Aug
```

Booking B:

```text
Dome 01
30 Aug → 31 Aug
```

Valid:

```text
YES
```

Karena first booking checkout pada tanggal second booking check-in.

---

# 153. Glamping Example C — Full Range

Availability:

```text
30 Aug = 2
31 Aug = 1
```

Request:

```text
30 Aug → 1 Sep
2 units
```

Result:

```text
REJECT
```

karena seluruh range tidak memiliki 2 unit.

---

# 154. Jeep Example A

Fleet:

```text
8 Jeep
```

30 Aug — 03:00:

```text
Booked 5
```

Available:

```text
3
```

Customer meminta:

```text
2
```

Result:

```text
ACCEPT
```

Remaining:

```text
1
```

---

# 155. Jeep Example B

Available:

```text
1
```

Customer requests:

```text
2
```

Result:

```text
REJECT
```

---

# 156. Jeep Example C — Different Slot

Jeep 01 booked:

```text
30 Aug
03:00
```

Jeep 01 dapat digunakan:

```text
30 Aug
08:00
```

pada demo v1.

---

# 157. Payment Example A

Booking:

```text
Total:
Rp1.500.000

DP:
30%

Required:
Rp450.000
```

Verified payment:

```text
Rp450.000
```

Result:

```text
Booking:
CONFIRMED

Payment:
PARTIALLY_PAID

Remaining:
Rp1.050.000
```

---

# 158. Payment Example B

Verified:

```text
Rp1.500.000
```

Result:

```text
Booking:
CONFIRMED

Payment:
PAID

Remaining:
Rp0
```

---

# 159. Payment Example C — Failed

Payment attempt:

```text
FAILED
```

Booking:

```text
WAITING_PAYMENT
```

selama hold belum expired.

---

# 160. Payment Example D — Expired

```text
expires_at:
17:30

current time:
17:31

payment:
not verified
```

Result:

```text
Booking:
EXPIRED

Inventory:
RELEASED
```

---

# 161. Payment Example E — Late Webhook But Timely Payment

```text
expires_at:
17:30

Provider paid_at:
17:29

Webhook received:
17:31
```

Jika provider verification membuktikan paid at 17:29:

```text
Booking dapat CONFIRMED
```

selama concurrency/data integrity masih memungkinkan berdasarkan hold state processing.

---

# 162. Payment Example F — Actual Late Payment

```text
expires_at:
17:30

Provider paid_at:
17:34
```

Result:

```text
Booking:
EXPIRED

Payment:
verified

requires_review:
true
```

Tidak auto-confirm.

---

# 163. Check-In Example

Booking:

```text
CONFIRMED
Payment PARTIALLY_PAID
DP fully satisfied
```

Result:

```text
CHECK-IN ALLOWED
```

---

# 164. Check-In Example — No DP

Booking:

```text
WAITING_PAYMENT
UNPAID
```

Result:

```text
CHECK-IN REJECTED
```

---

# 165. Cancellation Example

Booking:

```text
CONFIRMED
PARTIALLY_PAID
```

Admin cancels.

Result:

```text
Booking:
CANCELLED

Payment:
PARTIALLY_PAID

Inventory:
RELEASED

Refund:
NOT AUTOMATIC
```

---

# 166. Demo UI Must Reflect Real State

UI tidak boleh menampilkan:

```text
CONFIRMED
```

jika backend booking:

```text
WAITING_PAYMENT
```

---

# 167. Optimistic UI Restriction

Optimistic UI boleh digunakan untuk harmless interaction.

Tidak boleh digunakan untuk authoritative transition:

- payment success,
- booking confirmation,
- check-in,
- check-out,
- cancellation.

UI menunggu server confirmation.

---

# 168. Admin Business Filter

Filter:

```text
All Businesses
Glamping
Jeep
```

hanya mengubah query/view.

Filter tidak mengubah underlying data.

---

# 169. Cross-Business Customer

Satu customer dapat memiliki:

```text
Glamping booking
+
Jeep booking
```

Customer master dapat menampilkan keduanya.

---

# 170. Cross-Business Booking

Satu booking tidak dapat mencampur:

```text
Glamping
+
Jeep
```

Demo v1 tidak mendukung cart lintas bisnis.

Customer membuat booking terpisah.

---

# 171. Cross-Sell

Website boleh menampilkan CTA menuju bisnis lain.

Tetapi booking tetap independent.

---

# 172. Admin Product Editing

Basic editable values demo:

Glamping:

```text
name
description
price
active status
```

Jeep:

```text
package name
description
price
active status
```

Inventory physical management dapat dibatasi ke block/unblock pada demo.

---

# 173. Historical Price Integrity

Admin edit price tidak menjalankan recalculation terhadap:

```text
existing bookings
existing invoices
existing payments
```

---

# 174. Product Capacity Change

Jika capacity product berubah:

existing booking tetap menggunakan historical snapshot untuk reservation yang sudah dibuat.

New booking menggunakan current capacity.

---

# 175. Block Creation Validation

Block harus mempunyai:

```text
unit
date/date-range
reason
```

---

# 176. Block Removal

Remove block mengembalikan unit menjadi eligible inventory apabila tidak ada booking conflict.

---

# 177. Payment Provider Availability

Jika Pakasir unavailable:

customer harus mendapatkan:

```text
Payment service temporarily unavailable.
```

Booking hold dapat tetap berjalan hingga expiration.

Customer dapat retry selama valid.

---

# 178. Invoice Provider Independence

Invoice generation tidak bergantung pada Resend.

Urutan:

```text
Generate invoice
Store invoice
Send email
```

Jika email gagal, invoice tetap ada.

---

# 179. Email Provider Independence

Resend failure tidak mengubah invoice/payment/booking status.

---

# 180. Customer Email Typo

Jika customer memasukkan email salah tetapi valid format:

sistem tidak dapat menjamin email delivery.

Admin tetap melihat booking.

Customer dapat menggunakan WhatsApp + Booking Code untuk lookup.

Email correction workflow tidak wajib demo v1.

---

# 181. Duplicate Booking Submission

Jika customer double-click submit:

frontend harus prevent repeated request where possible.

Backend harus memiliki idempotency strategy untuk booking creation apabila reasonable.

Exact approach ditentukan `API.md`.

---

# 182. Checkout Refresh

Refresh payment page tidak boleh membuat booking baru.

Existing booking ID harus digunakan.

---

# 183. Success Page Refresh

Refresh success page:

- tidak membuat payment baru,
- tidak membuat invoice baru,
- tidak mengirim confirmation baru.

Page hanya membaca current booking state.

---

# 184. Admin Page Refresh

Admin action state berasal dari backend.

Refresh tidak boleh kehilangan booking/payment status.

---

# 185. Hard Business Invariants

Implementation harus menjaga invariants berikut:

```text
1. Confirmed booking memiliki required DP verified.

2. Expired booking tidak mengonsumsi inventory.

3. Cancelled booking tidak mengonsumsi future inventory.

4. Invoice amount berasal dari booking snapshot.

5. Payment success tidak berasal dari frontend redirect.

6. Customer tidak dapat melihat booking orang lain hanya dengan Booking Code.

7. Active inventory tidak boleh overbook.

8. Duplicate webhook tidak menggandakan financial effect.

9. Check-in memerlukan confirmed booking.

10. Existing booking price tidak berubah ketika product price berubah.
```

---

# 186. Rules Intentionally Deferred

Berikut sengaja belum didefinisikan untuk demo v1:

```text
Automated refunds
Balance payment online
No-show fee
Cancellation fee
Reschedule fee
Promo/voucher
Dynamic weekend pricing
Holiday pricing
Tax rules
Deposit damage
Late checkout fees
Extra guest fees
WhatsApp automation
OTA synchronization
Advanced Jeep route duration conflict
Room/unit preference selection
Customer self-service rescheduling
Customer self-service cancellation
```

Codex tidak boleh mengimplementasikan fitur tersebut tanpa requirement tambahan.

---

# 187. Database Design Requirements From Business Rules

`DATABASE.md` berikutnya harus mampu merepresentasikan minimum:

```text
businesses
customers

glamping/accommodation types
physical accommodation units

jeep packages
jeep physical units
departure slots

bookings
booking snapshots
inventory assignments/holds

payments
payment attempts
provider transactions

invoices

inventory blocks

audit/activity events

admin users/sessions
```

Exact table design belum ditentukan di dokumen ini.

---

# 188. Required Constraints for DATABASE.md

Database design berikutnya wajib menjelaskan:

1. bagaimana unique booking code dijamin,
2. bagaimana unique invoice number dijamin,
3. bagaimana duplicate provider payment dicegah,
4. bagaimana physical inventory di-lock,
5. bagaimana date overlap accommodation dihitung,
6. bagaimana Jeep slot availability dihitung,
7. bagaimana hold expiration direpresentasikan,
8. bagaimana financial snapshot disimpan,
9. bagaimana event timeline disimpan,
10. bagaimana customer ownership lookup dilakukan.

---

# 189. Required API Behavior From Business Rules

`API.md` harus menyediakan contract minimum untuk:

```text
Availability Search
Create Booking
Get Booking State
Retry Payment
Booking Lookup

Pakasir Webhook

Admin Booking List
Admin Booking Detail
Check-In
Check-Out
Cancel Booking
Calendar
Block Inventory
Payments
Customers
Product Basic Update
Invoice Download
```

---

# 190. Codex Rules

Codex wajib membaca dokumen ini sebelum membuat booking/domain logic.

Codex tidak boleh membuat keputusan berikut sendiri:

- mengubah DP default,
- mengubah hold duration,
- mengubah state lifecycle,
- mengizinkan unpaid check-in,
- menganggap success redirect sebagai payment success,
- mengubah overlap rule,
- mencampur booking Glamping dan Jeep,
- membuat customer account,
- membuat refund system,
- membuat rescheduling system.

---

# 191. Codex Edge Case Rule

Jika menemukan edge case yang belum didefinisikan:

Codex tidak boleh membuat business policy kompleks secara diam-diam.

Gunakan pendekatan:

```text
1. Preserve data integrity.
2. Fail safely.
3. Do not confirm payment/booking without proof.
4. Do not overbook inventory.
5. Record exception.
6. Surface condition for admin review where appropriate.
```

---

# 192. Definition of Business Rule Compliance

Implementation dianggap sesuai apabila:

- [ ] Customer booking tanpa login.
- [ ] Admin membutuhkan login.
- [ ] Booking code unik.
- [ ] Glamping menggunakan date-range inventory.
- [ ] Jeep menggunakan date + departure slot inventory.
- [ ] Check-out boundary tidak dianggap overlap.
- [ ] Quantity divalidasi.
- [ ] Guest capacity divalidasi.
- [ ] Price dihitung server-side.
- [ ] Price snapshot disimpan.
- [ ] DP default 30% dan configurable.
- [ ] Booking hold default 30 menit.
- [ ] Hold expiration server-side.
- [ ] Expired booking melepas inventory.
- [ ] Payment verification server-side.
- [ ] Payment redirect tidak authoritative.
- [ ] Duplicate webhook idempotent.
- [ ] Late payment tidak menyebabkan unsafe auto-confirmation.
- [ ] Invoice dibuat setelah DP verified.
- [ ] Invoice tidak duplicate.
- [ ] Email failure tidak membatalkan booking.
- [ ] Check-in membutuhkan confirmed booking.
- [ ] DP cukup untuk check-in pada demo.
- [ ] Cancellation tidak berarti refund.
- [ ] Block tidak boleh conflict dengan confirmed booking.
- [ ] Inventory concurrency-safe.
- [ ] Customer booking lookup membutuhkan ownership verification.
- [ ] Audit event tercatat.
- [ ] Core booking flow tidak menggunakan fake data.

---

# 193. Final Business Flow — Glamping

```text
Customer
   ↓
Choose Check-In / Check-Out
   ↓
Choose Guests
   ↓
Search Availability
   ↓
Choose Glamping Type
   ↓
Choose Unit Quantity
   ↓
Server Revalidates Availability
   ↓
Create Booking
   ↓
Reserve Physical Inventory
   ↓
WAITING_PAYMENT
   ↓
30 Minute Hold
   ↓
Pakasir Payment
   ↓
Server Verification
   ↓
Required DP Verified
   ↓
CONFIRMED
   ↓
Generate Invoice
   ↓
Store Invoice
   ↓
Send Resend Email
   ↓
Admin Sees Booking
   ↓
Check-In
   ↓
Check-Out
```

---

# 194. Final Business Flow — Jeep

```text
Customer
   ↓
Choose Package
   ↓
Choose Date
   ↓
Choose Departure Slot
   ↓
Choose Jeep Quantity
   ↓
Choose Guest Count
   ↓
Server Revalidates Availability
   ↓
Create Booking
   ↓
Hold Jeep Inventory
   ↓
WAITING_PAYMENT
   ↓
Pakasir Payment
   ↓
Server Verification
   ↓
Required DP Verified
   ↓
CONFIRMED
   ↓
Invoice
   ↓
Email
   ↓
Admin Dashboard
   ↓
Service Start / Check-In
   ↓
Service Complete / Check-Out
```

---

# 195. Core Rule Summary

Sistem demo ini dibangun berdasarkan lima aturan fundamental:

> **Inventory hanya dapat dijual jika benar-benar tersedia.**

> **Booking belum sah sebelum required DP berhasil diverifikasi oleh server.**

> **Payment provider, bukan browser, menentukan keberhasilan pembayaran.**

> **Harga dan detail booking lama tidak boleh berubah karena konfigurasi produk berubah.**

> **Glamping dan Jeep memiliki workflow berbeda di customer side, tetapi seluruh operasional tetap berada dalam satu centralized booking system.**

---

# 196. Next Document

Setelah `BUSINESS-RULES.md` selesai:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅

DATABASE.md               ← NEXT
API.md
UI-UX-SPEC.md
DEMO-DATA.md
IMPLEMENTATION-PLAN.md
AGENTS.md
```

`DATABASE.md` harus dibuat berikutnya karena seluruh entity, relation, constraint, index, booking hold, physical inventory assignment, financial snapshot, payment idempotency, dan concurrency strategy harus diturunkan langsung dari business rules ini sebelum Codex mulai membuat schema Drizzle.
