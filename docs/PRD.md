# Product Requirements Document (PRD)

> **Client revision — 30 August 2026:** Demo v1 now uses manual bank transfer, customer payment-proof upload, and Admin approval/rejection. The minimum DP is 50%, the authoritative payment deadline is 12 hours, and paid DP is forfeited when a customer cancels. Admin may create `ADMIN_MANUAL` and `WALK_IN` bookings through the same booking/inventory engine. The accommodation experience may present a clearly labelled mock Homestay catalog while final client data is pending. These revision requirements supersede older Pakasir, 30% DP, 30-minute hold, and separate-brand statements below.

## Product Demo — Glamping, Jeep & Central Admin Booking System

> **Brand revision:** the parent identity is **Shakila Group**. Customer brands are
> **Shakila Glamping** and **Shakila Jeep Tour**. The operational application is
> **Shakila Group Admin**. Technical slugs `glamping` and `jeep` remain unchanged.

**Document:** `PRD.md`  
**Version:** 1.0  
**Status:** Product Demo Specification  
**Target:** Functional Product Demo / Client Validation  
**Primary Developer:** Codex-assisted development  
**Products Included:** Glamping Website, Jeep Website, Central Admin Dashboard  
**Excluded for Initial Demo:** Homestay Website  

---

# 1. Product Overview

Product ini merupakan **functional product demo** untuk sistem reservasi multi-bisnis yang akan digunakan oleh bisnis wisata dan hospitality.

Demo pertama akan mencakup dua lini bisnis:

1. **Glamping**
2. **Jeep Tour**

Kedua bisnis memiliki website customer-facing yang berbeda secara visual dan branding, tetapi menggunakan **satu sistem backend, database, booking engine, payment system, dan centralized admin dashboard**.

Product demo tidak dimaksudkan sebagai mockup statis atau prototype click-through.

Semua workflow utama yang ditampilkan kepada calon client harus **benar-benar berfungsi end-to-end**, sehingga client dapat memahami pengalaman customer maupun operasional admin seperti pada produk final.

Workflow utama yang wajib dapat didemonstrasikan:

```text
Customer membuka website
        ↓
Melihat produk/paket
        ↓
Memilih tanggal
        ↓
Sistem mengecek availability
        ↓
Customer mengisi data booking
        ↓
Sistem menghitung total & DP
        ↓
Customer melakukan pembayaran
        ↓
Payment diverifikasi
        ↓
Booking dikonfirmasi
        ↓
Invoice dibuat
        ↓
Invoice dikirim melalui email
        ↓
Booking muncul di Admin Dashboard
        ↓
Admin melihat detail booking
        ↓
Admin melakukan Check-In / Check-Out
```

---

# 2. Product Vision

Membuat pengalaman demo yang memberikan kesan bahwa client sedang melihat **produk booking yang sudah siap digunakan**, bukan sekadar konsep.

Client harus dapat memahami tiga nilai utama sistem:

### 2.1 Customer Experience

Customer dapat melakukan booking dengan mudah tanpa perlu membuat akun.

### 2.2 Operational Automation

Admin tidak perlu melakukan verifikasi pembayaran secara manual karena sistem dapat menerima dan memverifikasi status pembayaran.

### 2.3 Centralized Management

Booking dari beberapa bisnis berbeda dapat dikelola dari satu admin dashboard.

---

# 3. Product Demo Philosophy

Demo harus mengikuti prinsip:

> **Small scope, complete workflow.**

Lebih baik memiliki sedikit fitur tetapi seluruh fitur tersebut bekerja dengan baik daripada memiliki banyak fitur yang belum matang.

Demo harus memenuhi karakteristik berikut:

- Functional.
- Responsive.
- Visually polished.
- Real database.
- Real booking logic.
- Real availability calculation.
- Real payment workflow.
- Real invoice generation.
- Real email delivery.
- Real centralized admin data.
- Real booking status transitions.
- Real check-in/check-out workflow.

Beberapa data historis dan analytics boleh menggunakan **seed data** agar dashboard terlihat hidup.

---

# 4. Product Objectives

## 4.1 Primary Objectives

Product demo harus mampu menunjukkan bahwa:

1. Glamping dan Jeep memiliki website masing-masing.
2. Kedua website memiliki branding dan UI yang berbeda.
3. Customer tidak perlu login untuk melakukan booking.
4. Customer dapat melihat ketersediaan berdasarkan tanggal.
5. Sistem mencegah customer memilih produk yang sudah penuh.
6. Sistem dapat menghitung harga booking.
7. Sistem dapat menghitung jumlah DP.
8. Customer dapat melakukan pembayaran DP melalui Pakasir.
9. Sistem dapat mengetahui apakah pembayaran berhasil atau belum.
10. Booking hanya dikonfirmasi setelah pembayaran DP berhasil diverifikasi.
11. Sistem menghasilkan invoice setelah pembayaran berhasil.
12. Invoice dikirim ke email customer menggunakan Resend.
13. Booking dari kedua website masuk ke satu admin dashboard.
14. Admin dapat melihat booking secara detail.
15. Admin dapat melihat status pembayaran.
16. Admin dapat melakukan check-in.
17. Admin dapat melakukan check-out.
18. Admin dapat melihat availability melalui calendar.
19. Admin dapat membedakan booking Glamping dan Jeep.
20. Sistem terlihat layak dikembangkan menjadi produk production.

---

# 5. Success Criteria

Demo dianggap berhasil apabila calon client dapat memahami workflow sistem tanpa membutuhkan penjelasan teknis mendalam.

Client harus dapat menjawab dengan jelas:

- Bagaimana customer melakukan booking?
- Bagaimana customer mengetahui tanggal tersedia?
- Bagaimana DP bekerja?
- Bagaimana sistem mengetahui customer sudah membayar?
- Apa yang diterima customer setelah membayar?
- Bagaimana admin mengetahui booking baru?
- Bagaimana admin mengetahui customer sudah membayar atau belum?
- Bagaimana admin melakukan check-in?
- Bagaimana booking Glamping dan Jeep dikelola dari satu tempat?

---

# 6. Demo Scope

Product demo terdiri dari empat bagian utama:

```text
Product Demo
│
├── Glamping Customer Website
│
├── Jeep Customer Website
│
├── Central Booking Backend
│
└── Central Admin Dashboard
```

Homestay belum dibuat pada fase demo pertama.

Arsitektur harus tetap memungkinkan penambahan Homestay setelah client menyetujui konsep.

---

# 7. User Roles

## 7.1 Guest / Customer

Customer tidak memiliki akun dan tidak perlu login.

Customer dapat:

- Melihat landing page.
- Melihat tipe Glamping.
- Melihat paket Jeep.
- Memilih tanggal.
- Melihat availability.
- Melakukan booking.
- Mengisi identitas.
- Melakukan pembayaran DP.
- Mendapatkan booking confirmation.
- Mendapatkan invoice melalui email.
- Mengecek booking menggunakan booking code.
- Mengunduh invoice.

---

## 7.2 Admin

Admin harus login.

Admin dapat:

- Melihat overview bisnis.
- Melihat seluruh booking.
- Memfilter booking berdasarkan bisnis.
- Melihat detail customer.
- Melihat detail reservasi.
- Melihat status pembayaran.
- Melihat invoice.
- Melihat booking timeline.
- Melakukan check-in.
- Melakukan check-out.
- Melihat availability calendar.
- Melihat customer.
- Memblokir tanggal/unit tertentu.
- Mengubah beberapa data produk dasar.

Untuk demo hanya diperlukan satu akun admin.

Database tetap harus didesain agar nantinya dapat mendukung multiple admin/staff.

---

# 8. Business Structure

Sistem memiliki konsep `Business`.

Untuk product demo terdapat:

```text
GLAMPING
JEEP
```

Setiap booking harus terhubung dengan business tertentu.

Contoh:

```text
Booking GLP-260830-0012
Business: GLAMPING

Booking JEP-260830-0018
Business: JEEP
```

Central Admin dapat menampilkan:

```text
All Businesses
Glamping
Jeep
```

---

# 9. Glamping Business Model

Glamping menggunakan konsep:

```text
Glamping Type
      ↓
Physical Units
```

Contoh:

```text
Deluxe Dome
├── Dome 01
├── Dome 02
├── Dome 03
└── Dome 04

Family Dome
├── Dome 05
└── Dome 06
```

Customer tidak perlu memilih physical unit tertentu.

Customer hanya memilih:

- Tipe Glamping.
- Check-in.
- Check-out.
- Jumlah unit.
- Jumlah tamu.

Sistem menentukan availability berdasarkan tipe.

---

# 10. Glamping Demo Products

Minimal tersedia dua tipe.

## 10.1 Deluxe Dome

Contoh data:

```text
Name:
Deluxe Dome

Capacity:
2 Guests

Inventory:
4 Units

Base Price:
Rp850.000 / night

Facilities:
Private Bathroom
Breakfast
Mountain View
Wi-Fi
Hot Water
```

---

## 10.2 Family Dome

Contoh:

```text
Name:
Family Dome

Capacity:
4 Guests

Inventory:
2 Units

Base Price:
Rp1.250.000 / night

Facilities:
Private Bathroom
Breakfast
Mountain View
Private Terrace
Wi-Fi
Hot Water
```

Data harga dapat disesuaikan ketika implementasi demo.

---

# 11. Glamping Website Pages

Minimum routes:

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

Route dapat disesuaikan selama pengalaman user tetap konsisten.

---

# 12. Glamping Landing Page

Landing page harus memiliki kualitas visual premium hospitality.

Minimum section:

### Header

- Logo.
- Navigation.
- CTA Book Now.

### Hero

- High-quality imagery.
- Primary headline.
- Supporting copy.
- Booking availability widget.

Widget minimum:

```text
Check-in
Check-out
Guests

[ Check Availability ]
```

### Accommodation Section

Menampilkan tipe Glamping.

### Experience / Facilities

Contoh:

- Mountain view.
- Breakfast.
- Campfire.
- Private bathroom.
- Wi-Fi.

### Gallery

Seed images diperbolehkan.

### Why Stay With Us

### Testimonials

Dummy/seed content diperbolehkan.

### FAQ

### Location

### Final CTA

### Footer

---

# 13. Glamping Availability Flow

Customer memilih:

```text
Check-in
Check-out
Guests
```

Kemudian sistem menghitung availability.

Contoh:

```text
Deluxe Dome

Rp850.000 / night

3 units available

[ Select ]
```

Apabila tidak tersedia:

```text
Deluxe Dome

Sold Out
```

User tidak boleh melanjutkan booking terhadap inventory yang tidak tersedia.

---

# 14. Glamping Availability Rules

Booking accommodation bersifat date-range.

Contoh:

```text
Check-in:
30 August

Check-out:
1 September
```

Inventory digunakan pada malam:

```text
30 → 31 August
31 August → 1 September
```

Availability harus dihitung untuk seluruh rentang tanggal.

Apabila salah satu malam tidak mempunyai inventory cukup, booking tidak boleh dilanjutkan.

---

# 15. Glamping Booking Flow

```text
Landing Page
      ↓
Check Availability
      ↓
Availability Results
      ↓
Select Glamping Type
      ↓
Reservation Details
      ↓
Guest Information
      ↓
Booking Summary
      ↓
Create Booking
      ↓
Payment DP
      ↓
Payment Verification
      ↓
Booking Confirmed
      ↓
Invoice + Email
```

---

# 16. Jeep Business Model

Jeep menggunakan model inventory berdasarkan **physical vehicle unit**.

Contoh:

```text
Jeep Fleet

├── Jeep 01
├── Jeep 02
├── Jeep 03
├── Jeep 04
├── Jeep 05
├── Jeep 06
├── Jeep 07
└── Jeep 08
```

Customer tidak memilih nomor Jeep.

Customer memilih:

- Paket.
- Tanggal.
- Departure slot.
- Jumlah unit Jeep.
- Jumlah penumpang.

---

# 17. Jeep Packages

Minimal terdapat dua paket demo.

## 17.1 Sunrise Adventure

Contoh:

```text
Price:
Rp750.000 / Jeep

Maximum Passenger:
6

Departure:
03:00

Destinations:
Penanjakan
Bromo Sunrise
Kawah Bromo
Pasir Berbisik
```

---

## 17.2 Full Adventure Experience

Contoh:

```text
Price:
Rp950.000 / Jeep

Maximum Passenger:
6

Destinations:
Sunrise Point
Kawah Bromo
Savanna
Teletubbies Hill
Pasir Berbisik
```

---

# 18. Jeep Website Pages

Minimum routes:

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

# 19. Jeep Landing Page

Visual harus berbeda dari website Glamping.

Karakter Jeep:

- Adventure.
- Outdoor.
- Energetic.
- Bold visual hierarchy.

Minimum section:

- Header.
- Hero.
- Quick booking form.
- Tour packages.
- Destinations.
- Fleet/service advantages.
- Gallery.
- Testimonials.
- FAQ.
- CTA.
- Footer.

Website Glamping dan Jeep tidak boleh terlihat hanya sebagai website yang sama dengan warna berbeda.

---

# 20. Jeep Availability

Customer memilih:

```text
Package
Date
Departure Slot
Jeep Quantity
```

Sistem menampilkan:

```text
30 August 2026
03:00 Sunrise

Total Jeep:
8

Booked:
5

Available:
3
```

Apabila customer memilih 2:

```text
Requested:
2

Remaining:
1
```

Apabila availability hanya 1 dan customer meminta 2, sistem tidak boleh melanjutkan booking.

---

# 21. Jeep Booking Flow

```text
Landing Page
     ↓
Select Package
     ↓
Select Date
     ↓
Select Departure Slot
     ↓
Select Number of Jeep
     ↓
Guest Information
     ↓
Booking Summary
     ↓
Create Booking
     ↓
Payment DP
     ↓
Payment Verification
     ↓
Confirmation
     ↓
Invoice Email
```

---

# 22. Guest Information

Kedua bisnis menggunakan minimum customer information:

```text
Full Name *
Email *
WhatsApp Number *
Number of Guests *
Special Request
```

Validation harus dilakukan pada client dan server.

Email wajib valid karena digunakan untuk invoice.

WhatsApp wajib digunakan sebagai informasi kontak booking.

---

# 23. No Customer Authentication

Customer tidak membuat akun.

Tidak terdapat:

- Register.
- Login customer.
- Password.
- Customer dashboard authentication.

Customer mengakses booking menggunakan:

```text
Booking Code
+
Email atau WhatsApp
```

---

# 24. Booking Code

Setiap booking memiliki public booking code.

Format contoh:

### Glamping

```text
GLP-260830-0012
```

### Jeep

```text
JEP-260830-0018
```

Kode harus unik.

Format final dapat disesuaikan selama:

- Human-readable.
- Mudah disebutkan customer.
- Mengidentifikasi business.
- Tidak bergantung pada database sequential ID secara langsung.

---

# 25. Booking Status

Booking status minimum:

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

# 26. Payment Status

Payment status harus terpisah dari booking status.

Minimum:

```text
UNPAID
PENDING
PARTIALLY_PAID
PAID
FAILED
EXPIRED
REFUNDED
```

Contoh setelah pembayaran DP:

```text
Booking:
CONFIRMED

Payment:
PARTIALLY_PAID
```

---

# 27. DP System

Untuk demo gunakan configurable DP percentage.

Default demo:

```text
DP = 30%
```

Contoh:

```text
Booking Total:
Rp1.500.000

Required DP:
Rp450.000

Remaining:
Rp1.050.000
```

DP percentage tidak boleh di-hardcode langsung pada UI.

Nilainya harus berasal dari business/product configuration atau centralized configuration.

---

# 28. Booking Summary

Sebelum customer membayar, tampilkan summary lengkap.

Contoh Glamping:

```text
Deluxe Dome

30 Aug 2026
31 Aug 2026

1 Night
2 Guests
1 Unit

Accommodation
Rp850.000

Service
Rp50.000

----------------

Total
Rp900.000

DP 30%
Rp270.000

Pay Now
Rp270.000

Remaining
Rp630.000
```

Customer harus melihat:

- Produk.
- Tanggal.
- Jumlah.
- Total.
- DP.
- Sisa pembayaran.

Sebelum payment dimulai.

---

# 29. Temporary Booking Hold

Untuk mencegah inventory diambil customer lain ketika payment sedang dilakukan, booking dapat memasuki temporary hold.

Default demo target:

```text
30 minutes
```

Flow:

```text
Booking Created
      ↓
WAITING_PAYMENT
      ↓
Inventory Held
```

Apabila customer berhasil membayar:

```text
WAITING_PAYMENT
      ↓
CONFIRMED
```

Apabila expired:

```text
WAITING_PAYMENT
      ↓
EXPIRED
      ↓
Inventory Released
```

Durasi hold harus configurable.

---

# 30. Payment Gateway

Product demo menggunakan:

**Pakasir**

Pakasir bertugas sebagai payment gateway.

Frontend tidak boleh menentukan sendiri apakah pembayaran berhasil.

Status pembayaran harus diproses melalui backend.

---

# 31. Payment Flow

```text
Customer confirms booking
        ↓
Booking created
        ↓
Status WAITING_PAYMENT
        ↓
Payment transaction created
        ↓
Customer redirected / shown payment
        ↓
Customer pays DP
        ↓
Payment callback/webhook received
        ↓
Backend validates transaction
        ↓
Payment marked successful
        ↓
Booking CONFIRMED
```

---

# 32. Payment Security Rule

Redirect ke success page **tidak boleh dianggap sebagai bukti pembayaran**.

Booking hanya boleh dikonfirmasi setelah backend berhasil memverifikasi payment.

System harus melakukan idempotency handling sehingga webhook yang masuk lebih dari satu kali tidak:

- Membuat invoice ganda.
- Membuat payment record ganda.
- Mengirim confirmation email berkali-kali.
- Mengurangi inventory lebih dari sekali.

---

# 33. Payment Failure

Jika payment gagal:

```text
Payment:
FAILED
```

Customer masih dapat mencoba kembali selama booking hold belum expired.

Jika booking expired:

```text
Booking:
EXPIRED
```

Inventory dilepas.

---

# 34. Booking Success Page

Setelah pembayaran terverifikasi:

```text
Payment Successful ✓

Your Booking is Confirmed

Booking ID:
GLP-260830-0012

Amount Paid:
Rp270.000

Booking Total:
Rp900.000

Remaining:
Rp630.000

Invoice has been sent to:
customer@email.com
```

Minimum CTA:

```text
[ View Booking ]
[ Download Invoice ]
[ Back to Home ]
```

---

# 35. Invoice

Invoice dibuat setelah DP berhasil diverifikasi.

Invoice harus berupa PDF.

Minimum invoice information:

```text
Business Name
Invoice Number
Booking Code

Customer Name
Customer Email
Customer WhatsApp

Reservation Details

Subtotal
Additional Cost
Total

DP Required
Amount Paid
Remaining Balance

Payment Status
Booking Status

Transaction Date
Payment Method

Terms / Notes
```

---

# 36. Invoice Number

Invoice number berbeda dari booking code.

Contoh:

```text
Booking:
GLP-260830-0012

Invoice:
INV-260830-0012
```

Invoice number harus unik.

---

# 37. Invoice Email

Email dikirim menggunakan:

**Resend**

Setelah payment berhasil:

```text
Payment Verified
      ↓
Generate Invoice PDF
      ↓
Persist Invoice
      ↓
Send Booking Email
      ↓
Attach / Link Invoice
```

---

# 38. Booking Confirmation Email

Email harus memiliki branded design.

Subject contoh:

```text
Booking Confirmed — Deluxe Dome
```

Minimum email:

```text
Customer Name

Booking Confirmed

Booking ID
Product / Package
Reservation Date
Guest Count

Booking Total
Amount Paid
Remaining

Payment Status

View Booking CTA

Invoice
```

Email harus terlihat profesional dan mobile-friendly.

---

# 39. Invoice Storage

Invoice PDF disimpan di:

**Cloudflare R2**

Invoice tidak boleh menggunakan public permanent URL apabila tidak diperlukan.

Customer memperoleh invoice melalui:

- Attachment email, dan/atau
- Secure download endpoint.

---

# 40. Booking Lookup

Customer dapat mengecek booking tanpa login.

Minimum route:

```text
/booking/check
```

Customer menginput:

```text
Booking Code
Email / WhatsApp
```

Apabila valid:

```text
BOOKING CONFIRMED

GLP-260830-0012

Deluxe Dome

30 Aug → 31 Aug

Payment:
Rp270.000 / Rp900.000

Remaining:
Rp630.000

Status:
Confirmed

[ Download Invoice ]
```

---

# 41. Booking Lookup Security

Booking code saja tidak cukup.

Harus dikombinasikan dengan:

- Email, atau
- Nomor WhatsApp.

Response error tidak boleh membocorkan data customer lain.

---

# 42. Central Admin Dashboard

Admin dashboard merupakan satu aplikasi terpisah.

Contoh domain:

```text
admin.example.com
```

Demo mempunyai satu login admin.

---

# 43. Admin Navigation

Minimum sidebar:

```text
Overview

Bookings
Calendar
Payments
Customers

──────────

Glamping
Jeep

──────────

Settings
```

Navigation dapat disempurnakan pada UI specification.

---

# 44. Business Filter

Dashboard harus memiliki global business filter:

```text
All Businesses
Glamping
Jeep
```

Filter mempengaruhi data yang relevan seperti:

- Revenue.
- Booking.
- Calendar.
- Payment.
- Customer/activity.

---

# 45. Admin Overview

Minimum widgets:

### Revenue

```text
Revenue This Month
```

### Total Booking

### Booking Today

### Upcoming Reservations

### Payment Summary

### Business Distribution

---

# 46. Dashboard Analytics

Seed data dapat digunakan untuk:

```text
Revenue chart
Booking chart
Occupancy / utilization
Business performance
```

Analytics historis tidak harus berasal dari transaksi real selama demo.

Harus jelas secara internal mana:

- Real demo booking.
- Seeded historical data.

---

# 47. Recent Bookings

Dashboard menampilkan booking terbaru.

Minimum columns:

```text
Booking ID
Customer
Business
Reservation Date
Total
Paid
Payment Status
Booking Status
```

Booking yang baru dilakukan ketika demo harus muncul di sini.

---

# 48. Booking Management

Admin dapat melihat seluruh booking.

Minimum features:

- Search.
- Business filter.
- Booking status filter.
- Payment status filter.
- Date filter.
- Open detail.

Search dapat menggunakan:

- Booking code.
- Customer name.
- Email.
- WhatsApp.

---

# 49. Booking Table

Minimum:

| Field | Requirement |
|---|---|
| Booking ID | Required |
| Customer | Required |
| Business | Required |
| Product | Required |
| Reservation Date | Required |
| Total | Required |
| Paid | Required |
| Payment | Required |
| Booking Status | Required |

---

# 50. Booking Detail

Booking detail merupakan salah satu halaman utama demo.

Minimum section:

## Header

```text
GLP-260830-0012

CONFIRMED
PARTIALLY PAID
```

## Customer Information

```text
Full Name
Email
WhatsApp
```

## Reservation Information

Glamping:

```text
Glamping Type
Check-in
Check-out
Number of Nights
Units
Guests
```

Jeep:

```text
Package
Date
Departure Slot
Jeep Units
Guests
```

## Payment

```text
Total
Paid
Remaining
Payment Method
Transaction Reference
Payment Date
```

## Invoice

```text
Invoice Number

[ View ]
[ Download ]
```

## Actions

```text
Check In
Check Out
Cancel
```

Actions yang belum relevan dapat disabled.

---

# 51. Activity Timeline

Setiap booking memiliki timeline.

Contoh:

```text
14:21
Booking created

14:23
Payment initiated

14:24
Payment verified

14:24
Booking confirmed

14:25
Invoice generated

14:25
Confirmation email sent
```

Setelah admin check-in:

```text
30 Aug 14:02
Guest checked in
```

---

# 52. Check-In

Admin dapat melakukan check-in.

Minimum requirement:

Booking harus:

```text
Booking Status = CONFIRMED
```

dan required DP harus sudah dibayar.

Jika belum:

```text
Unable to Check In

Required DP payment has not been received.
```

---

# 53. Check-In Confirmation

Admin harus mendapatkan confirmation modal.

Contoh:

```text
Confirm Check-In

Aldi Pratama

Deluxe Dome

30 Aug 2026

[ Cancel ]
[ Confirm Check-In ]
```

Setelah berhasil:

```text
Booking Status:
CHECKED_IN
```

Timeline harus diperbarui.

---

# 54. Check-Out

Booking dengan status:

```text
CHECKED_IN
```

dapat di-check-out.

Setelah berhasil:

```text
CHECKED_OUT
```

Activity timeline diperbarui.

---

# 55. Admin Calendar

Calendar harus menjadi visual representation dari availability dan reservation.

Admin dapat memfilter:

```text
Glamping
Jeep
```

Untuk Glamping calendar dapat menampilkan occupancy per tipe.

Contoh:

```text
30 AUG

Deluxe Dome
3 / 4

Family Dome
2 / 2
FULL
```

---

# 56. Calendar Detail

Klik tanggal membuka detail.

Contoh:

```text
30 August

Deluxe Dome

GLP-0012
Aldi Pratama

GLP-0013
Budi Santoso
```

Untuk Jeep:

```text
30 August

Sunrise 03:00

5 / 8 Jeep Booked

JEP-0018
Budi Santoso
2 Jeep
```

---

# 57. Block Date

Admin dapat membuat inventory unavailable secara manual.

Contoh Glamping:

```text
Dome 03

Blocked:
30 Aug → 1 Sep

Reason:
Maintenance
```

Untuk demo minimum:

- Create block.
- Remove block.
- Reason.
- Date range.

Blocked unit tidak dihitung sebagai available inventory.

---

# 58. Payment Management

Admin memiliki halaman pembayaran.

Minimum:

```text
Transaction ID
Booking ID
Customer
Business
Amount
Method
Status
Timestamp
```

Admin dapat membuka payment detail.

Tidak perlu melakukan full accounting/reconciliation pada fase demo.

---

# 59. Customer Management

Admin dapat melihat customer list.

Minimum:

```text
Name
Email
WhatsApp
Total Booking
Business
Last Booking
```

Customer detail dapat menampilkan booking history.

Advanced CRM tidak termasuk scope.

---

# 60. Product Management

Untuk demo, admin hanya perlu basic product controls.

## Glamping

Admin dapat:

- Edit price.
- Edit basic description.
- Enable/disable type.
- Change inventory availability through block date.

## Jeep

Admin dapat:

- Edit package price.
- Enable/disable package.
- Edit basic package detail.
- Block unit/date.

Full CMS tidak diperlukan.

## 60.1 Revised Catalog and Physical Inventory Management

For the product demo revision, basic product controls include create and update,
not only editing seeded records.

Glamping Admin must support:

- create/edit/activate/deactivate accommodation types,
- create/edit/activate/deactivate physical accommodation units,
- safe server-generated slugs,
- inventory totals derived from active physical units.

Jeep Admin must support:

- create/edit/activate/deactivate packages,
- create/edit/activate/deactivate physical Jeep units,
- create/edit/activate/deactivate package departure slots.

Transactional records are never hard-deleted. A physical unit with an active or
future reservation cannot be deactivated. Historical booking product, price, and
capacity snapshots must remain unchanged after catalog edits.

---

## 60.2 Calendar-First Public Availability

The primary public availability experience must expose real month inventory before
requiring a search form submission.

Glamping shows each date with remaining active inventory per accommodation type.
Jeep shows a date-first view followed by package and departure-slot availability.
Active holds, confirmed/in-use reservations, inventory blocks, and inactive units
must all affect the display. Calendar results are advisory; booking creation remains
the final transactional authority.

---

# 61. Admin Authentication

Admin wajib login.

Minimum:

```text
Email
Password
```

Untuk demo:

- 1 seeded admin account.
- Protected admin routes.
- Secure server-side session.

Customer routes tidak menggunakan admin authentication.

---

# 62. UI/UX Quality Requirement

Product demo tidak boleh terlihat seperti default developer dashboard.

Penggunaan shadcn/ui diperbolehkan sebagai component primitive, tetapi harus dikustomisasi.

---

# 63. Glamping Visual Direction

Keywords:

```text
Premium
Warm
Nature
Elegant
Calm
Hospitality
Immersive photography
```

Characteristics:

- Large photography.
- Strong typography.
- Generous whitespace.
- Refined cards.
- Soft motion.
- Mobile-first booking experience.

---

# 64. Jeep Visual Direction

Keywords:

```text
Adventure
Bold
Outdoor
Energetic
Premium tour operator
```

Website Jeep harus secara visual terasa sebagai brand berbeda.

---

# 65. Admin Visual Direction

Keywords:

```text
Modern SaaS
Professional
Dense but clean
Operational
Fast scanning
Clear statuses
```

Dashboard harus mengutamakan:

- Information hierarchy.
- Easy status identification.
- Quick actions.
- Readability.

---

# 66. Status UI

Status menggunakan badge yang konsisten.

Examples:

```text
CONFIRMED
WAITING PAYMENT
CHECKED IN
COMPLETED
CANCELLED
```

Payment:

```text
PAID
PARTIALLY PAID
UNPAID
FAILED
```

Warna dan styling ditentukan pada UI specification.

---

# 67. Responsive Requirement

Customer websites harus optimal untuk:

```text
Mobile
Tablet
Desktop
```

Mobile sangat penting karena mayoritas customer diperkirakan akan melakukan booking melalui smartphone.

Admin minimum harus usable pada:

```text
Desktop
Tablet
```

Mobile admin boleh memiliki layout terbatas tetapi tidak rusak.

---

# 68. Loading States

Semua asynchronous interaction penting harus memiliki loading state.

Contoh:

```text
Checking availability...
Creating booking...
Waiting for payment...
Verifying payment...
Generating invoice...
```

Tidak boleh terjadi blank UI tanpa feedback.

---

# 69. Error States

Minimum:

- Availability fetch failed.
- Booking creation failed.
- Payment failed.
- Payment pending.
- Invoice unavailable.
- Booking lookup failed.
- Network error.
- Session expired.

Error harus menggunakan user-friendly copy.

---

# 70. Empty States

Admin harus mempunyai empty states yang didesain.

Contoh:

```text
No bookings found

Try changing the selected filters.
```

Jangan menampilkan tabel kosong tanpa konteks.

---

# 71. Success States

Success state penting:

- Booking created.
- Payment verified.
- Email sent.
- Check-in successful.
- Check-out successful.
- Date blocked.
- Setting updated.

Gunakan toast atau contextual feedback.

---

# 72. Demo Seed Data

Admin tidak boleh terlihat kosong saat presentasi pertama.

Seed minimum:

```text
30–50 historical bookings
20–40 customers
Mix of Glamping and Jeep
Different statuses
Historical payments
Revenue history
Availability variation
```

---

# 73. Suggested Seed Status Distribution

Contoh:

```text
Confirmed:
15

Checked In:
3

Completed:
18

Waiting Payment:
4

Cancelled:
3

Expired:
4
```

Angka dapat disesuaikan.

---

# 74. Real vs Seed Data

Data yang dibuat selama live demo harus benar-benar menggunakan system workflow.

Contoh:

Client melakukan booking.

Dashboard sebelumnya:

```text
47 bookings
```

Setelah booking:

```text
48 bookings
```

Booking tersebut harus dapat dibuka dan memiliki:

- Real customer information.
- Real payment status.
- Real invoice.
- Real timeline.

---

# 75. Demo Presentation Flow

Product harus mendukung presentation scenario berikut.

---

## Scene 1 — Glamping Landing Page

Presenter membuka website Glamping.

Menunjukkan:

- Premium landing page.
- Booking widget.
- Accommodation types.

---

## Scene 2 — Search Availability

Presenter memilih:

```text
Check-in
Check-out
Guests
```

Sistem menampilkan real availability.

---

## Scene 3 — Create Booking

Presenter memilih Glamping dan mengisi informasi customer.

Gunakan email yang dapat dibuka ketika demo.

---

## Scene 4 — Booking Summary

Presenter menunjukkan:

```text
Booking Total
DP
Remaining Balance
```

---

## Scene 5 — Payment

Customer membayar melalui Pakasir.

---

## Scene 6 — Booking Confirmation

Website menunjukkan:

```text
Booking Confirmed
```

Dengan Booking ID.

---

## Scene 7 — Email

Presenter meminta client membuka email.

Customer menerima:

```text
Booking Confirmation
+
Invoice PDF
```

---

## Scene 8 — Admin Dashboard

Presenter membuka Central Admin.

Booking baru terlihat.

---

## Scene 9 — Booking Detail

Presenter membuka booking.

Menunjukkan:

- Customer.
- Reservation.
- Payment.
- Invoice.
- Timeline.

---

## Scene 10 — Check-In

Presenter melakukan check-in.

Status berubah secara langsung.

---

## Scene 11 — Jeep

Presenter menunjukkan bahwa website Jeep memiliki visual berbeda tetapi booking masuk ke admin yang sama.

Tidak perlu melakukan payment kedua apabila waktu presentasi terbatas.

---

# 76. Technical Stack

Product demo menggunakan stack berikut.

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Lucide
```

## Forms

```text
React Hook Form
Zod
```

## Data Fetching

```text
Server Components where appropriate
TanStack Query for highly interactive client data
```

## Backend

```text
Next.js server capabilities / API layer
TypeScript
Zod
```

Detailed backend architecture akan ditentukan di `ARCHITECTURE.md`.

---

# 77. Database

```text
PostgreSQL
```

ORM:

```text
Drizzle ORM
```

Database provider dapat menggunakan managed PostgreSQL seperti Neon.

Final decision dicatat di `ARCHITECTURE.md`.

---

# 78. External Services

```text
Payment:
Pakasir

Email:
Resend

Object Storage:
Cloudflare R2

Bot Protection:
Cloudflare Turnstile

DNS:
Cloudflare
```

Optional / recommended:

```text
Error Monitoring:
Sentry

Background Workflow:
Inngest
```

---

# 79. Repository Strategy

Recommended monorepo:

```text
project/
│
├── apps/
│   ├── glamping/
│   ├── jeep/
│   └── admin/
│
├── packages/
│   ├── database/
│   ├── booking/
│   ├── payment/
│   ├── invoice/
│   ├── email/
│   ├── validation/
│   ├── auth/
│   └── ui/
│
└── docs/
    ├── PRD.md
    ├── UI-UX-SPEC.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── BUSINESS-RULES.md
    ├── DEMO-DATA.md
    └── IMPLEMENTATION-PLAN.md
```

Exact repo structure dapat berubah setelah technical architecture dibuat.

---

# 80. Non-Functional Requirements

## Performance

Customer-facing page harus terasa cepat.

Target:

- Optimized images.
- Lazy loading where appropriate.
- Minimal blocking scripts.
- Fast availability feedback.
- Responsive booking form.

---

## Reliability

Critical operations:

```text
Create booking
Payment verification
Availability calculation
Invoice generation
```

harus berjalan secara deterministic dan tidak bergantung hanya pada state browser.

---

## Security

Minimum:

- Server-side validation.
- Protected admin routes.
- No sensitive secrets exposed client-side.
- Payment verification server-side.
- Sanitized customer input.
- Rate limiting where needed.
- Turnstile on abuse-sensitive forms.
- Secure invoice access.
- No sequential private customer URL exposure.

---

# 81. Concurrency Requirement

System tidak boleh menyebabkan overbooking saat dua customer booking secara bersamaan.

Critical booking creation harus menggunakan database-safe concurrency strategy.

Contoh masalah yang harus dicegah:

```text
Available Deluxe Dome:
1

Customer A checks availability:
1

Customer B checks availability:
1

Customer A books
Customer B books
```

Hasil yang benar:

```text
Customer A:
Booking accepted

Customer B:
Inventory no longer available
```

Atau sebaliknya.

Tidak boleh keduanya confirmed apabila inventory hanya satu.

Detail strategy didefinisikan pada `BUSINESS-RULES.md` dan `DATABASE.md`.

---

# 82. Data Integrity Requirements

Booking total yang sudah dibuat tidak boleh berubah hanya karena admin kemudian mengubah harga produk.

Booking harus menyimpan snapshot data penting seperti:

- Product name.
- Unit price.
- Quantity.
- DP percentage.
- Total amount.

Invoice harus merepresentasikan harga ketika booking terjadi.

---

# 83. Auditability

Critical event harus tercatat.

Minimum events:

```text
BOOKING_CREATED
PAYMENT_CREATED
PAYMENT_VERIFIED
BOOKING_CONFIRMED
BOOKING_EXPIRED
INVOICE_GENERATED
EMAIL_SENT
CHECKED_IN
CHECKED_OUT
BOOKING_CANCELLED
```

Admin booking timeline menggunakan event tersebut.

---

# 84. Out of Scope for Product Demo

Fitur berikut tidak perlu diimplementasikan pada fase demo kecuali kemudian diputuskan secara khusus:

```text
Homestay customer website
Customer account/login
Customer loyalty
Voucher/coupon engine
Complex seasonal pricing
Advanced accounting
Automated refund system
Partial refund
WhatsApp API integration
OTA integration
Traveloka integration
Booking.com integration
Google Calendar synchronization
Google Maps advanced integration
Advanced CRM
Staff scheduling
Complex role permission
Multi-currency
Multi-language
Tax accounting
Accounting software integration
Advanced report builder
Excel export complex
Loyalty points
Affiliate/referral
Review management
Dynamic pricing engine
Automated balance payment reminders
Full CMS
```

---

# 85. Features That May Be Simulated

Untuk menjaga scope, berikut dapat menggunakan seed/demo data:

- Testimonials.
- Historical analytics.
- Historical revenue.
- Historical bookings.
- Existing customer history.
- Gallery content.
- Review scores.

Tetapi visualnya tetap harus production-quality.

---

# 86. Features That MUST Be Real

Berikut tidak boleh fake:

```text
Availability calculation
Inventory
Booking creation
Booking ID
DP calculation
Payment workflow
Payment verification
Booking confirmation
Invoice generation
Invoice email
Booking lookup
Admin booking visibility
Booking detail
Booking timeline
Check-in
Check-out
Inventory release after expiration
```

---

# 87. Acceptance Criteria — Glamping

Glamping demo selesai apabila:

- [ ] Landing page responsive.
- [ ] Minimal 2 Glamping types tersedia.
- [ ] User dapat memilih check-in/check-out.
- [ ] System dapat menghitung availability.
- [ ] Sold-out type tidak dapat dipesan.
- [ ] User dapat memilih jumlah unit.
- [ ] User dapat mengisi guest information.
- [ ] Booking summary menampilkan harga.
- [ ] DP dihitung dengan benar.
- [ ] Booking dapat dibuat tanpa login.
- [ ] Inventory hold bekerja.
- [ ] Payment dapat dilakukan.
- [ ] Payment dapat diverifikasi.
- [ ] Booking menjadi confirmed setelah DP.
- [ ] Invoice dibuat.
- [ ] Email dikirim.
- [ ] Booking dapat dicari kembali.
- [ ] Booking muncul di Admin Dashboard.

---

# 88. Acceptance Criteria — Jeep

Jeep demo selesai apabila:

- [ ] Landing page responsive.
- [ ] Minimal 2 packages tersedia.
- [ ] User dapat memilih package.
- [ ] User dapat memilih date.
- [ ] User dapat memilih departure slot.
- [ ] User dapat melihat Jeep availability.
- [ ] User dapat memilih Jeep quantity.
- [ ] Quantity tidak dapat melebihi availability.
- [ ] Booking summary benar.
- [ ] DP dihitung dengan benar.
- [ ] Booking dapat dibuat tanpa login.
- [ ] Payment flow bekerja.
- [ ] Payment verification bekerja.
- [ ] Booking confirmed setelah DP.
- [ ] Invoice dapat dibuat.
- [ ] Email terkirim.
- [ ] Booking muncul pada admin.
- [ ] Admin dapat membuka detail booking.

---

# 89. Acceptance Criteria — Admin Dashboard

Admin demo selesai apabila:

- [ ] Admin login bekerja.
- [ ] Admin routes protected.
- [ ] Overview memiliki seeded analytics.
- [ ] Real booking muncul di recent booking.
- [ ] Business filter bekerja.
- [ ] Booking list bekerja.
- [ ] Search bekerja.
- [ ] Status filtering bekerja.
- [ ] Booking detail lengkap.
- [ ] Customer information tampil.
- [ ] Reservation detail tampil.
- [ ] Payment detail tampil.
- [ ] Invoice tersedia.
- [ ] Activity timeline tersedia.
- [ ] Check-in bekerja.
- [ ] Check-out bekerja.
- [ ] Calendar tersedia.
- [ ] Calendar dapat menampilkan availability.
- [ ] Block date bekerja.
- [ ] Payment page tersedia.
- [ ] Customer page tersedia.

---

# 90. Acceptance Criteria — UX

- [ ] Tidak terdapat obvious placeholder UI pada main demo flow.
- [ ] Tidak menggunakan default shadcn styling tanpa customization.
- [ ] Customer website memiliki clear visual identity.
- [ ] Glamping dan Jeep memiliki branding berbeda.
- [ ] Loading state tersedia.
- [ ] Error state tersedia.
- [ ] Empty state tersedia.
- [ ] Success feedback tersedia.
- [ ] Mobile booking experience nyaman.
- [ ] Forms mudah dipahami.
- [ ] Booking CTA jelas.
- [ ] Price transparan.
- [ ] DP dan remaining balance jelas.

---

# 91. Acceptance Criteria — Payment

- [ ] Payment status tidak ditentukan oleh frontend.
- [ ] Booking tidak confirmed hanya karena redirect success.
- [ ] Backend memverifikasi payment.
- [ ] Duplicate payment callback aman.
- [ ] Payment amount sesuai booking.
- [ ] Transaction reference disimpan.
- [ ] Successful payment menghasilkan timeline event.
- [ ] Invoice tidak dibuat berkali-kali karena duplicate webhook.

---

# 92. Acceptance Criteria — Email & Invoice

- [ ] Invoice memiliki unique invoice number.
- [ ] PDF invoice dapat dibuka.
- [ ] PDF memiliki data booking benar.
- [ ] Amount paid benar.
- [ ] Remaining balance benar.
- [ ] Customer menerima email.
- [ ] Email mobile-friendly.
- [ ] Email memiliki Booking ID.
- [ ] Email memiliki reservation information.
- [ ] Invoice dapat diakses dari booking lookup/admin.

---

# 93. Implementation Priority

## P0 — Must Work

```text
Database
Booking
Availability
DP calculation
Pakasir payment
Payment verification
Invoice
Resend email
Admin booking
Booking detail
Check-in
```

## P1 — Demo Quality

```text
Premium landing pages
Calendar
Customer management
Payment list
Timeline
Seed analytics
Responsive polish
Animations
Error states
```

## P2 — Optional Polish

```text
Advanced product editing
Additional charts
Advanced search
Additional animation
Minor admin customization
```

P2 tidak boleh menghambat P0/P1.

---

# 94. Recommended Development Sequence

Coding tidak dilakukan sekaligus.

Recommended sequence:

```text
Phase 01
Project Foundation

Phase 02
Database & Seed

Phase 03
Booking Engine

Phase 04
Glamping Customer Website

Phase 05
Jeep Customer Website

Phase 06
Payment Integration

Phase 07
Invoice + Email

Phase 08
Central Admin

Phase 09
Calendar & Operations

Phase 10
UI/UX Polish

Phase 11
Demo Testing

Phase 12
Demo Deployment
```

Detail implementation task akan dibuat pada:

```text
IMPLEMENTATION-PLAN.md
```

---

# 95. Codex Development Rule

PRD ini merupakan product source of truth.

Codex tidak boleh:

- Mengubah requirement inti tanpa alasan.
- Menambahkan fitur besar yang tidak ada di scope.
- Mengganti business flow tanpa dokumentasi.
- Mengasumsikan customer membutuhkan login.
- Menganggap success redirect sebagai payment verification.
- Menggunakan fake availability.
- Menggunakan fake invoice pada final demo flow.
- Menduplikasi booking logic di setiap frontend.

Apabila terdapat ambiguity teknis, ikuti urutan:

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
```

---

# 96. Definition of Done

Product demo dianggap siap diperlihatkan kepada client apabila skenario berikut dapat dilakukan tanpa intervensi developer:

```text
1. Open Glamping website.

2. Choose available dates.

3. Select Glamping type.

4. Complete booking form.

5. View booking summary.

6. Pay DP.

7. Receive successful confirmation.

8. Receive email.

9. Open invoice.

10. Open Central Admin.

11. See new booking.

12. Open booking details.

13. Verify payment status.

14. View timeline.

15. Check customer in.

16. Booking status updates correctly.

17. Switch Admin to Jeep.

18. Open Jeep website.

19. Show different booking model.

20. Demonstrate Jeep availability.
```

Tidak boleh terdapat broken page, obvious fake workflow, console-breaking error, atau placeholder utama selama demo.

---

# 97. Final Product Demo Scope Summary

Product demo terdiri dari:

### Glamping

```text
Premium Landing Page
Glamping Types
Availability
Date Range Booking
Guest Information
Booking Summary
DP Payment
Confirmation
Invoice
Email
Booking Lookup
```

### Jeep

```text
Adventure Landing Page
Packages
Date Selection
Departure Slot
Jeep Availability
Unit Quantity
Guest Information
Booking Summary
DP Payment
Confirmation
Invoice
Email
Booking Lookup
```

### Central Admin

```text
Login
Overview
Business Filter
Bookings
Booking Detail
Payments
Customers
Calendar
Activity Timeline
Invoice
Check-In
Check-Out
Block Date
```

### Infrastructure

```text
Shared Backend
Shared PostgreSQL Database
Shared Booking Engine
Pakasir
Resend
Cloudflare R2
Cloudflare Turnstile
```

---

# 98. Product Expansion After Client Approval

Apabila demo diterima client, fondasi product digunakan untuk melanjutkan ke production.

Potential next phase:

```text
Demo
 ↓
Client Workflow Approval
 ↓
Requirement Adjustment
 ↓
Homestay Integration
 ↓
Production Business Rules
 ↓
Advanced Admin
 ↓
Production Security
 ↓
Deployment
 ↓
Go Live
```

Homestay nantinya menggunakan model:

```text
Room Type
    ↓
Physical Rooms
```

dan memanfaatkan booking engine accommodation yang sama dengan Glamping dengan business-specific configuration.

---

# 99. Core Principle

Semua keputusan produk pada fase demo harus mengikuti prinsip:

> **The demo should feel smaller than the final product, not cheaper than the final product.**

Scope boleh terbatas.

Kualitas workflow, UI/UX, booking logic, payment experience, invoice, dan admin experience tidak boleh terasa sebagai prototype sementara.

Tujuan akhirnya adalah membuat calon client dapat membayangkan sistem ini digunakan secara nyata untuk operasional bisnis mereka.
