# API Specification

## Admin Web Push

The authenticated Admin namespace exposes:

```text
GET    /admin/push/status
POST   /admin/push/subscriptions
DELETE /admin/push/subscriptions
```

`POST` accepts the browser `PushSubscription` JSON (`endpoint`, `keys.p256dh`,
`keys.auth`, optional `expirationTime` and `userAgent`). `DELETE` accepts an
endpoint and only removes that endpoint for the current Admin session. Status is
per current endpoint when the `endpoint` query parameter is supplied, while the
response also reports the number of devices registered for that Admin.

The API sends non-critical Web Push events for successful booking creation and
payment-proof upload. Provider errors are caught after the transactional
operation; they never fail or roll back the booking/payment request. `404` and
`410` delivery responses remove the invalid subscription.

> **Klarifikasi client — 9 September 2026 (otoritatif):** Endpoint `check-in` dan `check-out` hanya berlaku untuk booking accommodation/bundle, bukan Jeep. Booking Jeep yang sudah `CONFIRMED` dan `PAID` diselesaikan melalui `POST /admin/bookings/:bookingCode/complete`; command ini idempotent, menghasilkan status `COMPLETED`, dan langsung melepas alokasi Jeep agar armada dapat dipesan lagi pada hari yang sama.

> **Klarifikasi client — 8 September 2026 (otoritatif):** `POST /admin/bookings/:bookingCode/settlement` mencatat pelunasan manual dengan `Idempotency-Key` UUID serta body `{ amount, method, note? }`; metode adalah `CASH`, `TRANSFER`, `MANUAL_QRIS`, atau `OTHER`. Endpoint invoice Admin mengalirkan `application/pdf` melalui sesi Admin dan tidak mengembalikan JSON signed-URL sebagai file.

> **Klarifikasi client — 6 September 2026 (otoritatif):** Customer `POST /public/bookings/:bookingCode/payments` hanya mengirim bukti transfer JPG/JPEG/PNG dan nominal yang diklaim. Admin meninjau rekening lalu menyetujui atau menolak bukti secara manual. Tidak ada endpoint Pakasir, checkout provider, redirect pembayaran, webhook provider, maupun verifikasi otomatis. Seluruh bagian lama tentang payment gateway di bawah bersifat usang dan tidak boleh diimplementasikan.

## Product Demo — Glamping, Jeep & Central Admin Booking System

> **Revision note:** public month availability and authenticated catalog/fleet
> mutation endpoints described below are additive. Existing booking, payment,
> invoice, and lifecycle contracts remain authoritative.

**Document:** `API.md`  
**Version:** 1.0  
**Status:** API Contract Baseline — Demo v1  
**API Style:** REST-like JSON API  
**Primary Backend:** Next.js Central API  
**Base Version:** `/api/v1`

**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE.md`

---

# 1. Purpose

Dokumen ini mendefinisikan kontrak API untuk komunikasi antara:

```text
Glamping Website
Jeep Website
Admin Dashboard
        ↓
Central API
```

API menjadi boundary utama untuk:

- availability,
- booking,
- payment,
- booking lookup,
- invoice,
- admin operations,
- calendar,
- check-in/check-out,
- customers,
- product management,
- inventory block,
- Pakasir webhook.

Frontend tidak boleh mengakses database secara langsung.

---

# 2. API Principles

## API-001 — Centralized API

Seluruh aplikasi menggunakan satu Central API.

Dilarang membuat business-critical API terpisah di masing-masing customer app.

---

## API-002 — Server is Authoritative

Frontend tidak authoritative untuk:

- availability,
- price,
- DP,
- payment status,
- booking status,
- inventory,
- check-in,
- invoice status.

---

## API-003 — JSON

Default request/response format:

```http
Content-Type: application/json
```

Exception:

- invoice PDF download,
- provider-specific webhook content jika dibutuhkan.

---

# 3. Base URL

Local development:

```text
http://localhost:3003/api/v1
```

Demo/staging:

```text
https://api.demo-domain.com/api/v1
```

Production domain ditentukan kemudian.

Frontend tidak boleh hardcode domain API.

Gunakan:

```text
NEXT_PUBLIC_API_BASE_URL
```

---

# 4. API Groups

API dibagi menjadi:

```text
/api/v1/public/*
/api/v1/admin/*
/api/v1/webhooks/*
/api/v1/auth/*
```

---

# 5. Public API

Digunakan oleh:

```text
Glamping
Jeep
```

Public bukan berarti seluruh endpoint bebas abuse protection.

Public booking/lookup endpoint tetap menggunakan:

- server validation,
- rate limiting,
- Turnstile jika diwajibkan.

---

# 6. Admin API

Path:

```text
/api/v1/admin/*
```

Memerlukan authenticated admin session.

Server wajib melakukan authentication dan authorization.

UI menyembunyikan button tidak cukup sebagai security.

---

# 7. Webhook API

Path:

```text
/api/v1/webhooks/*
```

Digunakan oleh external provider seperti Pakasir.

Tidak menggunakan admin session.

Verification dilakukan melalui provider-specific mechanism dan server-to-server verification.

---

# 8. Response Envelope

Semua JSON API menggunakan consistent envelope.

Success:

```json
{
  "data": {},
  "error": null,
  "meta": null
}
```

Error:

```json
{
  "data": null,
  "error": {
    "code": "INVENTORY_NOT_AVAILABLE",
    "message": "Selected inventory is no longer available."
  },
  "meta": null
}
```

---

# 9. Metadata

Untuk paginated endpoint:

```json
{
  "data": [],
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 87,
    "totalPages": 5
  }
}
```

---

# 10. API Error Format

Minimum:

```json
{
  "code": "INVALID_INPUT",
  "message": "Please check the submitted data."
}
```

Optional development/internal context tidak dikirim kepada customer.

---

# 11. Validation Error

Validation error dapat menyertakan field details:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid.",
    "fields": {
      "email": [
        "Please enter a valid email address."
      ]
    }
  },
  "meta": null
}
```

Field errors tidak boleh mengandung stack trace.

---

# 12. HTTP Status Convention

Recommended:

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

---

# 13. Domain Error Codes

Minimum stable error codes:

```text
VALIDATION_ERROR
INVALID_INPUT

BUSINESS_NOT_FOUND
PRODUCT_NOT_FOUND
PRODUCT_NOT_ACTIVE

INVENTORY_NOT_AVAILABLE
INVALID_DATE_RANGE
INVALID_GUEST_COUNT
INVALID_QUANTITY
INVALID_DEPARTURE_SLOT

BOOKING_NOT_FOUND
BOOKING_EXPIRED
BOOKING_CANCELLED
BOOKING_ALREADY_CONFIRMED
BOOKING_STATE_CONFLICT
BOOKING_LOOKUP_FAILED

PAYMENT_NOT_FOUND
PAYMENT_NOT_VERIFIED
PAYMENT_ALREADY_COMPLETED
PAYMENT_AMOUNT_MISMATCH
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_EXCEPTION

INVOICE_NOT_AVAILABLE

CHECK_IN_NOT_ALLOWED
CHECK_OUT_NOT_ALLOWED
CANCELLATION_NOT_ALLOWED

INVENTORY_BLOCK_CONFLICT

TURNSTILE_FAILED
RATE_LIMITED

UNAUTHORIZED
FORBIDDEN

INTERNAL_ERROR
```

---

# 14. Error Code Stability

Frontend boleh bergantung pada:

```text
error.code
```

Frontend tidak boleh bergantung pada exact human-readable:

```text
error.message
```

karena copy dapat berubah.

---

# 15. Request ID

API sebaiknya menghasilkan:

```text
X-Request-Id
```

untuk critical request.

Client dapat menyimpan/display request ID pada generic support error jika dibutuhkan.

---

# 16. Business Identifier

Public API menggunakan business slug:

```text
glamping
jeep
```

atau explicit field:

```json
{
  "business": "glamping"
}
```

Jangan expose internal UUID jika tidak diperlukan.

---

# 17. Money Representation

API amount menggunakan integer IDR.

Example:

```json
{
  "totalAmount": 900000,
  "requiredDpAmount": 270000,
  "remainingAmount": 630000,
  "currency": "IDR"
}
```

Jangan return:

```json
{
  "totalAmount": "Rp900.000"
}
```

sebagai value authoritative.

Formatting rupiah dilakukan UI.

---

# 18. Dates

Business-local date menggunakan:

```text
YYYY-MM-DD
```

Example:

```json
{
  "checkInDate": "2026-08-30",
  "checkOutDate": "2026-08-31"
}
```

---

# 19. Times

Departure time:

```text
HH:mm
```

Example:

```json
{
  "departureTime": "03:00"
}
```

---

# 20. Transaction Timestamp

Server timestamp menggunakan ISO 8601.

Example:

```text
2026-08-25T09:21:40.000Z
```

Frontend mengubah display ke business timezone.

---

# 21. Pagination

Admin list menggunakan:

```text
page
pageSize
```

Default:

```text
page = 1
pageSize = 20
```

Maximum:

```text
pageSize = 100
```

---

# 22. Sort Convention

Query:

```text
sort=createdAt
order=desc
```

Allowed sort field harus di-whitelist.

Jangan memasukkan raw query field langsung menjadi SQL order expression.

---

# 23. Public Product — Glamping

## GET `/public/glamping/types`

Mengambil active Glamping types.

### Request

```http
GET /api/v1/public/glamping/types
```

### Response

```json
{
  "data": [
    {
      "slug": "deluxe-dome",
      "name": "Deluxe Dome",
      "description": "Premium dome accommodation.",
      "basePrice": 850000,
      "capacityPerUnit": 2,
      "currency": "IDR",
      "isActive": true
    }
  ],
  "error": null,
  "meta": null
}
```

---

# 24. Glamping Type Detail

## GET `/public/glamping/types/:slug`

Example:

```http
GET /api/v1/public/glamping/types/deluxe-dome
```

404 jika tidak ada/inactive.

---

# 25. Glamping Availability

## POST `/public/glamping/availability`

Availability menggunakan POST agar input date range/guest/quantity mudah divalidasi dan tidak perlu query string panjang.

### Request

```json
{
  "checkInDate": "2026-08-30",
  "checkOutDate": "2026-09-01",
  "guestCount": 2
}
```

Optional filter:

```json
{
  "accommodationTypeSlug": "deluxe-dome"
}
```

---

# 26. Glamping Availability Response

```json
{
  "data": {
    "checkInDate": "2026-08-30",
    "checkOutDate": "2026-09-01",
    "nightCount": 2,
    "guestCount": 2,
    "types": [
      {
        "slug": "deluxe-dome",
        "name": "Deluxe Dome",
        "capacityPerUnit": 2,
        "unitPrice": 850000,
        "availableQuantity": 3,
        "minimumUnitsRequiredForGuests": 1,
        "currency": "IDR",
        "status": "AVAILABLE"
      },
      {
        "slug": "family-dome",
        "name": "Family Dome",
        "capacityPerUnit": 4,
        "unitPrice": 1250000,
        "availableQuantity": 0,
        "minimumUnitsRequiredForGuests": 1,
        "currency": "IDR",
        "status": "FULL"
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 27. Glamping Availability Status

UI helper status:

```text
AVAILABLE
LIMITED
FULL
```

Authoritative inventory adalah:

```text
availableQuantity
```

---

# 28. Availability is Not Reservation

Response availability tidak membuat hold.

Tidak mempunyai guarantee inventory tetap tersedia.

Final availability dicek ulang pada create booking.

---

# 29. Public Jeep Packages

## Public accommodation + Jeep bundles

`GET /api/v1/public/glamping/bundles` lists the eight source-derived Tour & Stay products. `GET /api/v1/public/glamping/bundles/:slug` returns one product. `POST /api/v1/public/glamping/bundles` accepts `bundleSlug`, `checkInDate`, and `checkOutDate` and returns atomic bundle availability across the full stay. Quote and booking requests use `business: "bundle"` with both dates; the server prices the included first night plus additional room nights, reserves the Jeep once on the tour date, and creates no partial reservation when either the room or shared Jeep resource is unavailable.

## GET `/public/jeep/packages`

Response:

```json
{
  "data": [
    {
      "slug": "sunrise-adventure",
      "name": "Sunrise Adventure",
      "description": "Private sunrise Jeep tour.",
      "pricePerUnit": 750000,
      "capacityPerUnit": 6,
      "currency": "IDR",
      "isActive": true,
      "departureSlots": [
        {
          "id": "public-slot-id",
          "name": "Sunrise",
          "departureTime": "03:00"
        }
      ]
    }
  ],
  "error": null,
  "meta": null
}
```

Public slot identifier tidak harus internal database UUID.

Implementation dapat menggunakan opaque public ID.

---

# 30. Jeep Package Detail

## GET `/public/jeep/packages/:slug`

Example:

```http
GET /api/v1/public/jeep/packages/sunrise-adventure
```

---

# 31. Jeep Availability

## POST `/public/jeep/availability`

### Request

```json
{
  "packageSlug": "sunrise-adventure",
  "tourDate": "2026-08-30",
  "departureSlotId": "slot_public_id",
  "guestCount": 8
}
```

---

# 32. Jeep Availability Response

```json
{
  "data": {
    "package": {
      "slug": "sunrise-adventure",
      "name": "Sunrise Adventure",
      "pricePerUnit": 750000,
      "capacityPerUnit": 6
    },
    "tourDate": "2026-08-30",
    "departureSlot": {
      "id": "slot_public_id",
      "name": "Sunrise",
      "departureTime": "03:00"
    },
    "guestCount": 8,
    "availableQuantity": 3,
    "minimumUnitsRequiredForGuests": 2,
    "currency": "IDR",
    "status": "AVAILABLE"
  },
  "error": null,
  "meta": null
}
```

---

## 32.1 Public Month Availability

Month views are additive advisory endpoints:

```text
POST /public/glamping/calendar
POST /public/jeep/calendar
```

Request:

```json
{
  "startDate": "2026-08-01",
  "endDate": "2026-09-06"
}
```

Glamping returns a `days` array whose inventory rows contain `productSlug`,
`productName`, `totalUnits`, `heldUnits`, `confirmedUnits`, `blockedUnits`, and
`availableUnits`. Jeep returns the same day structure grouped by active package
and departure slot. The maximum accepted window is 62 days. Results use active
physical resources and current PostgreSQL reservations/blocks; they do not create
a hold and never replace final transactional allocation.

---

# 33. Quote Endpoint

Customer UX dapat membutuhkan price preview sebelum booking.

Recommended endpoint:

```text
POST /public/bookings/quote
```

Quote bukan booking.

Tidak membuat hold.

---

# 34. Booking Quote — Glamping

### Request

```json
{
  "business": "glamping",
  "productSlug": "deluxe-dome",
  "checkInDate": "2026-08-30",
  "checkOutDate": "2026-09-01",
  "quantity": 2,
  "guestCount": 4
}
```

---

# 35. Glamping Quote Response

```json
{
  "data": {
    "business": "glamping",
    "product": {
      "slug": "deluxe-dome",
      "name": "Deluxe Dome"
    },
    "reservation": {
      "checkInDate": "2026-08-30",
      "checkOutDate": "2026-09-01",
      "nightCount": 2,
      "quantity": 2,
      "guestCount": 4
    },
    "pricing": {
      "currency": "IDR",
      "unitPrice": 850000,
      "subtotalAmount": 3400000,
      "additionalAmount": 0,
      "totalAmount": 3400000,
      "dpPercentage": 30,
      "requiredDpAmount": 1020000,
      "remainingAfterDp": 2380000
    }
  },
  "error": null,
  "meta": null
}
```

---

# 36. Booking Quote — Jeep

### Request

```json
{
  "business": "jeep",
  "packageSlug": "sunrise-adventure",
  "tourDate": "2026-08-30",
  "departureSlotId": "slot_public_id",
  "quantity": 2,
  "guestCount": 8
}
```

---

# 37. Quote Security Rule

Quote amount tetap bukan amount authoritative untuk booking.

Create booking menghitung ulang pricing.

Frontend tidak mengirim quote total untuk dipercaya server.

---

# 38. Create Booking

## POST `/public/bookings`

Ini merupakan critical endpoint.

Requires:

```text
Turnstile
Idempotency key
Server validation
Final inventory check
Server price recalculation
```

---

# 39. Idempotency Header

Client wajib mengirim:

```http
Idempotency-Key: <uuid>
```

Contoh:

```text
4a387b76-7f94-4321-8500-929d44a9f9fd
```

Frontend membuat satu key per booking submit intent.

Double-click menggunakan key sama.

---

# 40. Idempotency Behavior

Jika request yang sama dikirim ulang dengan key yang sama:

API return existing booking.

Tidak membuat booking baru.

Jika key sama digunakan untuk semantically different request:

return:

```text
IDEMPOTENCY_CONFLICT
```

Tambahkan error code ini ke implementation jika dibutuhkan.

---

# 41. Turnstile Token

Booking request menyertakan:

```json
{
  "turnstileToken": "..."
}
```

Token diverifikasi server-side sebelum booking dibuat.

---

# 42. Create Glamping Booking Request

```json
{
  "business": "glamping",

  "reservation": {
    "productSlug": "deluxe-dome",
    "checkInDate": "2026-08-30",
    "checkOutDate": "2026-09-01",
    "quantity": 2,
    "guestCount": 4
  },

  "customer": {
    "fullName": "Aldi Pratama",
    "email": "aldi@example.com",
    "whatsapp": "081234567890"
  },

  "specialRequest": "Late arrival if possible.",

  "turnstileToken": "..."
}
```

---

# 43. Create Jeep Booking Request

```json
{
  "business": "jeep",

  "reservation": {
    "packageSlug": "sunrise-adventure",
    "tourDate": "2026-08-30",
    "departureSlotId": "slot_public_id",
    "quantity": 2,
    "guestCount": 8
  },

  "customer": {
    "fullName": "Aldi Pratama",
    "email": "aldi@example.com",
    "whatsapp": "081234567890"
  },

  "specialRequest": null,

  "turnstileToken": "..."
}
```

---

# 44. Booking Creation Response

HTTP:

```text
201 Created
```

Response:

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "business": "glamping",
    "bookingStatus": "WAITING_PAYMENT",
    "paymentStatus": "UNPAID",

    "expiresAt": "2026-08-25T10:30:00.000Z",

    "customer": {
      "fullName": "Aldi Pratama",
      "email": "aldi@example.com"
    },

    "pricing": {
      "currency": "IDR",
      "subtotalAmount": 3400000,
      "additionalAmount": 0,
      "totalAmount": 3400000,
      "dpPercentage": 30,
      "requiredDpAmount": 1020000,
      "verifiedPaidAmount": 0,
      "remainingAmount": 3400000
    },

    "payment": {
      "canInitiate": true
    }
  },
  "error": null,
  "meta": null
}
```

Catatan:

Sebelum DP dibayar:

```text
remainingAmount
```

adalah total unpaid booking amount.

UI dapat juga menampilkan amount remaining after required DP menggunakan pricing calculation.

---

# 45. Inventory Conflict Response

If inventory berubah sejak availability search:

HTTP:

```text
409 Conflict
```

```json
{
  "data": null,
  "error": {
    "code": "INVENTORY_NOT_AVAILABLE",
    "message": "The selected inventory is no longer available."
  },
  "meta": null
}
```

Frontend:

- jangan auto retry booking tanpa user knowledge,
- tampilkan availability changed state,
- minta user memilih ulang.

---

# 46. Create Payment Attempt

## POST `/public/bookings/:bookingCode/payments`

Membuat/retry Pakasir payment attempt.

Ownership proof diperlukan.

Untuk initial flow, server dapat menggunakan short-lived booking access token yang diberikan setelah create booking.

---

# 47. Booking Access Token

Setelah create booking, response dapat menyediakan:

```json
{
  "bookingAccessToken": "opaque-short-lived-token"
}
```

Token:

- bukan booking code,
- scoped ke booking,
- digunakan agar customer tidak perlu mengirim email setiap API request,
- expiry terbatas.

Exact token mechanism dapat berupa signed server token.

Jangan simpan secret customer di token plaintext.

---

# 48. Payment Attempt Request

```json
{
  "bookingAccessToken": "...",
  "amountType": "REQUIRED_DP"
}
```

Demo v1 hanya mendukung:

```text
REQUIRED_DP
```

Online remaining balance payment deferred.

---

# 49. Payment Attempt Response

Example:

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",

    "paymentAttempt": {
      "id": "public-payment-attempt-id",
      "status": "PENDING",
      "requestedAmount": 1020000,
      "currency": "IDR",

      "provider": "PAKASIR",

      "checkoutUrl": "provider-checkout-url",
      "qrString": null,
      "expiresAt": "2026-08-25T10:30:00.000Z"
    }
  },
  "error": null,
  "meta": null
}
```

Exact fields Pakasir disesuaikan berdasarkan actual integration.

Frontend hanya menggunakan normalized fields.

---

# 50. Provider Abstraction

Frontend tidak boleh bergantung pada raw Pakasir response shape.

`@booking/payment` normalize provider response menjadi internal contract.

---

# 51. Payment Initiation Restrictions

Payment attempt tidak dapat dibuat jika booking:

```text
EXPIRED
CANCELLED
CHECKED_IN
CHECKED_OUT
COMPLETED
```

---

# 52. Payment Retry

Allowed:

```text
WAITING_PAYMENT
```

selama:

```text
now < expiresAt
```

---

# 53. Booking Status Endpoint

## GET `/public/bookings/:bookingCode/status`

Digunakan oleh:

- payment page,
- success page,
- polling.

Requires booking access token.

Header example:

```http
Authorization: Booking <token>
```

---

# 54. Booking Status Response

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "bookingStatus": "CONFIRMED",
    "paymentStatus": "PARTIALLY_PAID",

    "pricing": {
      "currency": "IDR",
      "totalAmount": 3400000,
      "requiredDpAmount": 1020000,
      "verifiedPaidAmount": 1020000,
      "remainingAmount": 2380000
    },

    "invoice": {
      "status": "GENERATED",
      "available": true
    },

    "updatedAt": "2026-08-25T10:03:20.000Z"
  },
  "error": null,
  "meta": null
}
```

---

# 55. Payment Polling

Frontend boleh poll:

```text
GET /public/bookings/:bookingCode/status
```

saat customer kembali dari provider.

Recommended:

```text
2–3 seconds
```

untuk short period.

Jangan poll indefinitely.

---

# 56. Polling Stop Conditions

Stop jika:

```text
bookingStatus = CONFIRMED
bookingStatus = EXPIRED
bookingStatus = CANCELLED

paymentStatus = FAILED
```

atau timeout UX tercapai.

Jika masih pending setelah timeout:

tampilkan:

```text
Payment is still being verified.
```

dan allow refresh/status recheck.

---

# 57. Redirect Success Behavior

Success route tidak boleh menganggap:

```text
?status=success
```

sebagai payment authority.

Always fetch booking state.

---

# 58. Booking Lookup

## POST `/public/bookings/lookup`

Requires:

- booking code,
- email OR WhatsApp,
- Turnstile.

---

# 59. Lookup Request — Email

```json
{
  "bookingCode": "GLP-260830-001234",
  "email": "aldi@example.com",
  "turnstileToken": "..."
}
```

---

# 60. Lookup Request — WhatsApp

```json
{
  "bookingCode": "GLP-260830-001234",
  "whatsapp": "081234567890",
  "turnstileToken": "..."
}
```

---

# 61. Lookup Response

```json
{
  "data": {
    "booking": {
      "bookingCode": "GLP-260830-001234",
      "business": "glamping",
      "bookingStatus": "CONFIRMED",
      "paymentStatus": "PARTIALLY_PAID",

      "customer": {
        "fullName": "Aldi Pratama"
      },

      "reservation": {
        "type": "ACCOMMODATION",
        "productName": "Deluxe Dome",
        "checkInDate": "2026-08-30",
        "checkOutDate": "2026-09-01",
        "nightCount": 2,
        "quantity": 2,
        "guestCount": 4
      },

      "pricing": {
        "currency": "IDR",
        "totalAmount": 3400000,
        "verifiedPaidAmount": 1020000,
        "remainingAmount": 2380000
      },

      "invoice": {
        "available": true
      }
    },

    "bookingAccessToken": "..."
  },
  "error": null,
  "meta": null
}
```

---

# 62. Lookup Failure

Wrong booking/email combination:

HTTP:

```text
404
```

Generic:

```json
{
  "data": null,
  "error": {
    "code": "BOOKING_LOOKUP_FAILED",
    "message": "Booking could not be found with the provided information."
  },
  "meta": null
}
```

Jangan memberitahu apakah booking code-nya valid.

---

# 63. Public Invoice Download

## GET `/public/bookings/:bookingCode/invoice`

Requires valid booking access token.

Possible behavior:

```text
302 short-lived signed R2 URL
```

atau secure API streaming.

Preferred demo:

API generate short-lived signed URL kemudian redirect.

---

# 64. Invoice Not Ready

HTTP:

```text
409
```

```json
{
  "data": null,
  "error": {
    "code": "INVOICE_NOT_AVAILABLE",
    "message": "The invoice is not available yet."
  },
  "meta": null
}
```

---

# 65. Pakasir Webhook

## POST `/webhooks/pakasir`

Endpoint:

```text
/api/v1/webhooks/pakasir
```

Provider payload shape mengikuti Pakasir actual specification.

Handler tidak boleh expose internal response detail kepada browser.

---

# 66. Webhook Processing

Required sequence:

```text
Receive request
↓
Parse provider payload
↓
Resolve provider order reference
↓
Verify provider transaction
↓
Lock payment/booking
↓
Detect duplicate
↓
Validate amount
↓
Update payment attempt
↓
Update payment aggregate
↓
Confirm booking if eligible
↓
Create events
↓
Commit
↓
Trigger post-payment async workflow
↓
Return success
```

---

# 67. Webhook Does Not Generate Email Synchronously

Webhook tidak menunggu:

```text
PDF
R2
Resend
```

Payment verification + database state transition harus selesai dulu.

Invoice/email diproses async.

---

# 68. Duplicate Webhook

Response terhadap already-processed valid webhook harus tetap successful/idempotent.

Jangan return 500 hanya karena transaction sebelumnya sudah diproses.

---

# 69. Invalid Webhook

Jika tidak valid:

return provider-compatible failure response.

Internal logging harus mencatat event.

Jangan leak verification detail.

---

# 70. Admin Authentication

Auth endpoints mengikuti Better Auth implementation.

Tidak perlu membuat custom auth protocol apabila Better Auth sudah menyediakan.

---

# 71. Admin API Authentication

Setiap:

```text
/api/v1/admin/*
```

harus melakukan:

```text
get authenticated session
↓
validate active admin
↓
authorize operation
```

---

# 72. Admin Current User

Optional normalized endpoint:

## GET `/admin/me`

Response:

```json
{
  "data": {
    "id": "public-admin-id",
    "name": "Demo Admin",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN"
  },
  "error": null,
  "meta": null
}
```

---

# 73. Admin Overview

## GET `/admin/dashboard/overview`

Query:

```text
business=all|glamping|jeep
period=this_month
```

Example:

```http
GET /api/v1/admin/dashboard/overview?business=all&period=this_month
```

---

# 74. Dashboard Overview Response

```json
{
  "data": {
    "period": {
      "key": "this_month",
      "startDate": "2026-08-01",
      "endDate": "2026-08-31"
    },

    "kpis": {
      "revenueReceived": 38750000,
      "bookingValue": 69200000,
      "bookingCount": 46,
      "todayBookingCount": 5,
      "upcomingReservationCount": 7,
      "outstandingAmount": 21450000
    },

    "businessBreakdown": [
      {
        "business": "glamping",
        "bookingCount": 28,
        "revenueReceived": 23750000
      },
      {
        "business": "jeep",
        "bookingCount": 18,
        "revenueReceived": 15000000
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 75. Dashboard Chart

## GET `/admin/dashboard/chart`

Query:

```text
business
metric
period
```

Allowed metric:

```text
revenue
bookings
```

Example response:

```json
{
  "data": {
    "metric": "revenue",
    "series": [
      {
        "date": "2026-08-20",
        "value": 1750000
      },
      {
        "date": "2026-08-21",
        "value": 2450000
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 76. Admin Recent Bookings

Can be:

```text
GET /admin/bookings?page=1&pageSize=5&sort=createdAt&order=desc
```

No separate endpoint required unless UI benefits.

---

# 77. Admin Booking List

## GET `/admin/bookings`

Supported filters:

```text
page
pageSize
business
bookingStatus
paymentStatus
dateFrom
dateTo
search
sort
order
```

---

# 78. Booking List Request

Example:

```http
GET /api/v1/admin/bookings?business=glamping&bookingStatus=CONFIRMED&page=1&pageSize=20
```

---

# 79. Booking List Response

```json
{
  "data": [
    {
      "bookingCode": "GLP-260830-001234",

      "customer": {
        "fullName": "Aldi Pratama",
        "email": "aldi@example.com",
        "whatsapp": "+6281234567890"
      },

      "business": {
        "slug": "glamping",
        "name": "Glamping"
      },

      "productName": "Deluxe Dome",

      "reservationDateLabel": "30 Aug – 1 Sep 2026",

      "totalAmount": 3400000,
      "verifiedPaidAmount": 1020000,
      "remainingAmount": 2380000,
      "currency": "IDR",

      "bookingStatus": "CONFIRMED",
      "paymentStatus": "PARTIALLY_PAID",

      "createdAt": "2026-08-25T09:21:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 28,
    "totalPages": 2
  }
}
```

---

# 80. Admin Booking Search

`search` dapat match:

```text
booking code
customer full name
email
normalized WhatsApp
```

Server-side search.

---

# 81. Admin Booking Detail

## GET `/admin/bookings/:bookingCode`

Response lebih lengkap.

---

# 82. Glamping Booking Detail Response

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "business": {
      "slug": "glamping",
      "name": "Glamping"
    },

    "bookingStatus": "CONFIRMED",
    "paymentStatus": "PARTIALLY_PAID",
    "requiresReview": false,

    "customer": {
      "fullName": "Aldi Pratama",
      "email": "aldi@example.com",
      "whatsapp": "+6281234567890"
    },

    "reservation": {
      "type": "ACCOMMODATION",

      "productName": "Deluxe Dome",
      "checkInDate": "2026-08-30",
      "checkOutDate": "2026-09-01",
      "nightCount": 2,
      "quantity": 2,
      "guestCount": 4,

      "assignedUnits": [
        {
          "code": "DOME-01",
          "name": "Dome 01"
        },
        {
          "code": "DOME-03",
          "name": "Dome 03"
        }
      ]
    },

    "pricing": {
      "currency": "IDR",
      "unitPrice": 850000,
      "subtotalAmount": 3400000,
      "additionalAmount": 0,
      "totalAmount": 3400000,
      "dpPercentage": 30,
      "requiredDpAmount": 1020000,
      "verifiedPaidAmount": 1020000,
      "remainingAmount": 2380000
    },

    "invoice": {
      "invoiceNumber": "INV-260830-001234",
      "status": "GENERATED",
      "available": true
    },

    "specialRequest": "Late arrival if possible.",

    "createdAt": "2026-08-25T09:21:00.000Z",
    "confirmedAt": "2026-08-25T09:25:00.000Z",
    "checkedInAt": null,
    "checkedOutAt": null
  },
  "error": null,
  "meta": null
}
```

---

# 83. Jeep Booking Detail

Reservation section:

```json
{
  "reservation": {
    "type": "JEEP",
    "packageName": "Sunrise Adventure",
    "tourDate": "2026-08-30",
    "departureSlot": {
      "name": "Sunrise",
      "departureTime": "03:00"
    },
    "quantity": 2,
    "guestCount": 8,
    "assignedUnits": [
      {
        "code": "JEEP-02",
        "name": "Jeep 02"
      },
      {
        "code": "JEEP-04",
        "name": "Jeep 04"
      }
    ]
  }
}
```

---

# 84. Booking Timeline

## GET `/admin/bookings/:bookingCode/events`

Response:

```json
{
  "data": [
    {
      "type": "BOOKING_CREATED",
      "title": "Booking created",
      "description": null,
      "actorType": "CUSTOMER",
      "createdAt": "2026-08-25T09:21:00.000Z"
    },
    {
      "type": "PAYMENT_VERIFIED",
      "title": "DP payment verified",
      "description": "Rp1.020.000 received via QRIS.",
      "actorType": "PAYMENT_PROVIDER",
      "createdAt": "2026-08-25T09:24:20.000Z"
    },
    {
      "type": "BOOKING_CONFIRMED",
      "title": "Booking confirmed",
      "actorType": "SYSTEM",
      "createdAt": "2026-08-25T09:24:20.000Z"
    }
  ],
  "error": null,
  "meta": null
}
```

Could also be embedded in detail response.

Implementation may choose one endpoint if performance acceptable.

---

# 85. Check-In

## POST `/admin/bookings/:bookingCode/check-in`

### Request

Optional:

```json
{
  "note": null
}
```

---

# 86. Check-In Success

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "bookingStatus": "CHECKED_IN",
    "checkedInAt": "2026-08-30T07:02:10.000Z"
  },
  "error": null,
  "meta": null
}
```

---

# 87. Check-In Conflict

If DP insufficient:

HTTP:

```text
409
```

```json
{
  "data": null,
  "error": {
    "code": "CHECK_IN_NOT_ALLOWED",
    "message": "The required DP payment has not been verified."
  },
  "meta": null
}
```

---

# 88. Check-In Idempotency

Jika sudah:

```text
CHECKED_IN
```

API tidak membuat event kedua.

Can return current state with:

```text
200
```

atau conflict.

Recommended:

return `200` current state untuk idempotent admin UX.

---

# 89. Check-Out

## POST `/admin/bookings/:bookingCode/check-out`

Optional:

```json
{
  "note": null
}
```

---

# 90. Check-Out Response

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "bookingStatus": "CHECKED_OUT",
    "checkedOutAt": "2026-09-01T03:10:00.000Z"
  },
  "error": null,
  "meta": null
}
```

---

# 91. Cancel Booking

## POST `/admin/bookings/:bookingCode/cancel`

Request:

```json
{
  "reason": "CUSTOMER_REQUEST",
  "note": "Customer requested cancellation."
}
```

Reason values:

```text
CUSTOMER_REQUEST
OPERATIONAL
DUPLICATE
OTHER
```

---

# 92. Cancel Response

```json
{
  "data": {
    "bookingCode": "GLP-260830-001234",
    "bookingStatus": "CANCELLED",
    "cancelledAt": "2026-08-26T04:30:00.000Z"
  },
  "error": null,
  "meta": null
}
```

Payment status tidak otomatis berubah menjadi refunded.

---

# 93. Admin Payment List

## GET `/admin/payments`

Filters:

```text
page
pageSize
business
status
provider
dateFrom
dateTo
search
method
requiresReview
sort
order
```

All pagination, filtering, search, and ordering happen server-side. The default
`pageSize` is 20. `search` matches customer name/contact, booking code, provider
order/reference, and provider transaction reference.

---

# 94. Payment List Response

```json
{
  "data": [
    {
      "paymentAttemptId": "public-payment-id",
      "bookingCode": "GLP-260830-001234",

      "customerName": "Aldi Pratama",

      "business": "glamping",

      "provider": "PAKASIR",
      "requestedAmount": 1020000,
      "verifiedAmount": 1020000,
      "currency": "IDR",

      "method": "QRIS",
      "status": "SUCCESS",

      "providerPaidAt": "2026-08-25T09:24:10.000Z"
    }
  ],
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 30,
    "totalPages": 2
  }
}
```

---

# 95. Admin Payment Detail

## GET `/admin/payments/:paymentAttemptId`

Can expose:

```text
provider reference
amount
method
timestamps
booking link
exception state
```

Do not expose provider secret/raw credential.

---

## 95.1 Admin Catalog and Physical Inventory Mutations

All endpoints require an authenticated Admin session and use the standard
`data/error/meta` envelope.

```text
GET  /admin/glamping/types
POST /admin/glamping/types
PATCH /admin/glamping/types/:typeId
DELETE /admin/glamping/types/:typeId

GET  /admin/glamping/types/:typeId/units
POST /admin/glamping/types/:typeId/units
PATCH /admin/glamping/units/:unitId
DELETE /admin/glamping/units/:unitId

GET  /admin/jeep/packages
POST /admin/jeep/packages
PATCH /admin/jeep/packages/:packageId
DELETE /admin/jeep/packages/:packageId

GET  /admin/jeep/packages/:packageId/slots
POST /admin/jeep/packages/:packageId/slots
PATCH /admin/jeep/slots/:slotId
DELETE /admin/jeep/slots/:slotId

GET  /admin/jeep/units
POST /admin/jeep/units
PATCH /admin/jeep/units/:unitId
DELETE /admin/jeep/units/:unitId
```

Product create requests accept name, description, positive integer IDR price,
positive integer capacity, and active state. Slugs are normalized and made unique
server-side. Unit requests accept normalized unique code, name, and active state.
Slot requests accept name, optional `HH:mm` departure time, and active state.
When the client has not supplied an official time, `departureTime` is `null` and
the neutral name `Jadwal Keberangkatan` is used.

Deactivation returns `409 INVENTORY_IN_USE` when a physical unit has an active or
future `HELD`, `CONFIRMED`, or `IN_USE` reservation. DELETE hard-deletes only
records without history. A record referenced by booking, reservation, inventory
block, or bundle history is deactivated and returns `disposition: ARCHIVED` so
historical snapshots remain linked.

---

# 96. Admin Customer List

## GET `/admin/customers`

Filters:

```text
page
pageSize
search
business
```

---

# 97. Customer List Response

```json
{
  "data": [
    {
      "id": "public-customer-id",
      "fullName": "Aldi Pratama",
      "email": "aldi@example.com",
      "whatsapp": "+6281234567890",
      "totalBookings": 3,
      "businesses": [
        "glamping",
        "jeep"
      ],
      "lastBookingAt": "2026-08-25T09:21:00.000Z"
    }
  ],
  "error": null,
  "meta": {}
}
```

---

# 98. Customer Detail

## GET `/admin/customers/:customerId`

Response includes:

```text
profile
booking history
total booking count
verified spending
last booking
```

No advanced CRM.

---

# 99. Admin Calendar

## GET `/admin/calendar`

Query differs by business.

General:

```text
business
startDate
endDate
```

---

# 100. Glamping Calendar Request

```http
GET /api/v1/admin/calendar?business=glamping&startDate=2026-08-01&endDate=2026-08-31
```

---

# 101. Glamping Calendar Response

```json
{
  "data": {
    "business": "glamping",
    "days": [
      {
        "date": "2026-08-30",

        "inventory": [
          {
            "productSlug": "deluxe-dome",
            "productName": "Deluxe Dome",
            "totalUnits": 4,
            "heldUnits": 0,
            "confirmedUnits": 3,
            "blockedUnits": 0,
            "availableUnits": 1
          },
          {
            "productSlug": "family-dome",
            "productName": "Family Dome",
            "totalUnits": 2,
            "heldUnits": 0,
            "confirmedUnits": 2,
            "blockedUnits": 0,
            "availableUnits": 0
          }
        ]
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 102. Jeep Calendar Response

```json
{
  "data": {
    "business": "jeep",
    "days": [
      {
        "date": "2026-08-30",

        "slots": [
          {
            "departureSlotId": "slot-public-id",
            "name": "Sunrise",
            "departureTime": "03:00",

            "totalUnits": 8,
            "heldUnits": 1,
            "confirmedUnits": 5,
            "blockedUnits": 0,
            "availableUnits": 2
          }
        ]
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 103. Calendar Day Booking Detail

## GET `/admin/calendar/day`

Query:

```text
business
date
product/slot optional
```

Response dapat digunakan calendar drawer.

Example:

```json
{
  "data": {
    "date": "2026-08-30",
    "bookings": [
      {
        "bookingCode": "GLP-260830-001234",
        "customerName": "Aldi Pratama",
        "productName": "Deluxe Dome",
        "quantity": 2,
        "bookingStatus": "CONFIRMED"
      }
    ]
  },
  "error": null,
  "meta": null
}
```

---

# 104. Inventory Unit List

## GET `/admin/inventory/units`

Query:

```text
business
product optional
active optional
```

Used by block date UI.

---

# 105. Inventory Block List

## GET `/admin/inventory/blocks`

Filters:

```text
business
startDate
endDate
resourceId
```

---

# 106. Create Inventory Block

## POST `/admin/inventory/blocks`

Glamping:

```json
{
  "business": "glamping",
  "resourceType": "ACCOMMODATION_UNIT",
  "resourceId": "public-unit-id",
  "startDate": "2026-08-30",
  "endDate": "2026-09-01",
  "reason": "MAINTENANCE",
  "note": "Bathroom maintenance."
}
```

---

# 107. Jeep Block

Whole date:

```json
{
  "business": "jeep",
  "resourceType": "JEEP_UNIT",
  "resourceId": "public-jeep-id",
  "startDate": "2026-08-30",
  "departureSlotId": null,
  "reason": "MAINTENANCE",
  "note": null
}
```

Specific slot:

```json
{
  "business": "jeep",
  "resourceType": "JEEP_UNIT",
  "resourceId": "public-jeep-id",
  "startDate": "2026-08-30",
  "departureSlotId": "slot-public-id",
  "reason": "OPERATIONAL",
  "note": null
}
```

---

# 108. Block Conflict Response

If confirmed reservation conflicts:

```text
409 Conflict
```

```json
{
  "data": null,
  "error": {
    "code": "INVENTORY_BLOCK_CONFLICT",
    "message": "This unit already has an active reservation during the selected period."
  },
  "meta": null
}
```

---

# 109. Remove Inventory Block

## DELETE `/admin/inventory/blocks/:blockId`

Instead of DB hard delete:

server sets:

```text
removed_at
```

Response:

```text
204 No Content
```

or normalized JSON success.

---

# 110. Admin Glamping Type List

## GET `/admin/glamping/types`

Includes inactive products.

---

# 111. Update Glamping Type

## PATCH `/admin/glamping/types/:id`

Allowed Demo v1:

```json
{
  "name": "Deluxe Dome",
  "description": "Updated description",
  "basePrice": 900000,
  "isActive": true
}
```

Not all fields required.

---

# 112. Glamping Product Update Rule

Changing:

```text
basePrice
```

only affects new bookings.

Never updates historical booking snapshots.

---

# 113. Admin Jeep Package List

## GET `/admin/jeep/packages`

---

# 114. Update Jeep Package

## PATCH `/admin/jeep/packages/:id`

Allowed:

```json
{
  "name": "Sunrise Adventure",
  "description": "Updated package",
  "pricePerUnit": 800000,
  "isActive": true
}
```

---

# 115. Product Delete Endpoint

DELETE pada produk, unit, dan jadwal mengembalikan salah satu disposition:

```text
DELETED  — belum pernah memiliki history
ARCHIVED — memiliki booking/reservation/history; dinonaktifkan dari katalog publik
```

---

# 116. Admin Invoice Download

## GET `/admin/bookings/:bookingCode/invoice`

Requires admin session.

Returns signed URL/stream.

Admin does not require customer ownership token.

---

# 117. Admin Retry Invoice

Optional P1 endpoint:

```text
POST /admin/bookings/:bookingCode/invoice/retry
```

Hanya tersedia jika invoice:

```text
FAILED
```

Tidak membuat invoice number baru.

---

# 118. Admin Email Retry

Optional:

```text
POST /admin/bookings/:bookingCode/email/retry
```

Jika confirmation email failed.

Must not create another invoice.

Implementation Plan menentukan apakah masuk Demo v1 UI.

---

# 119. Booking Status Admin Modification

Tidak boleh menyediakan endpoint generic:

```text
PATCH /booking
{
  "status": "..."
}
```

Karena dapat bypass business rules.

Gunakan explicit commands:

```text
check-in
check-out
cancel
```

---

# 120. Payment Status Admin Modification

Demo tidak menyediakan generic:

```text
PATCH payment status
```

Payment provider verification authoritative.

Manual payment adjustment deferred.

---

# 121. Public API CORS

Allowed origins:

```text
Glamping app
Jeep app
local dev origins
```

Admin API includes Admin origin.

Do not use:

```text
Access-Control-Allow-Origin: *
```

untuk credential-sensitive API.

---

# 122. Admin Credentials

Admin requests membutuhkan session cookies/headers sesuai Better Auth.

Jika cross-origin antara:

```text
admin.demo-domain.com
api.demo-domain.com
```

cookie/session/CORS configuration harus diuji.

Architecture implementation boleh memilih shared parent-domain cookie strategy atau bearer session mechanism yang didukung Better Auth.

Jangan membuat custom insecure token karena lebih mudah.

---

# 123. CSRF

Admin mutation endpoint harus memanfaatkan CSRF protection strategy yang compatible dengan auth/session architecture.

SameSite cookie saja tidak boleh diasumsikan cukup tanpa memahami deployment topology.

---

# 124. Public Mutation Security

Public:

```text
create booking
booking lookup
create payment
```

memerlukan:

- input validation,
- rate limit,
- Turnstile where specified,
- idempotency where needed.

---

# 125. Rate-Limit Targets

Minimum endpoints:

```text
POST /public/bookings
POST /public/bookings/lookup
POST /public/bookings/:code/payments
```

Exact numbers ditentukan implementation.

---

# 126. Availability Rate Limit

Availability dapat memiliki looser rate limit.

Jangan sampai normal customer calendar browsing terlalu mudah diblokir.

---

# 127. API Contract Validation

Shared Zod contracts berada:

```text
@booking/contracts
```

or:

```text
@booking/validation
```

depending implementation responsibility.

Recommended:

```text
contracts
├── schemas
├── DTOs
└── response types
```

---

# 128. Request Schema Reuse

Frontend dapat menggunakan shared request schemas untuk UX validation.

Server tetap menjalankan schema validation ulang.

---

# 129. Response Runtime Validation

Internal API clients dapat runtime-validate response pada development/critical paths.

Tidak wajib memvalidasi every internal response dua kali jika types already strongly controlled.

---

# 130. Versioning

Demo uses:

```text
/api/v1
```

Breaking contract future:

```text
/api/v2
```

Minor additive field tidak membutuhkan v2.

---

# 131. Field Naming

API uses:

```text
camelCase
```

Database uses:

```text
snake_case
```

Mapping dilakukan server/domain layer.

---

# 132. Null Policy

Gunakan `null` untuk known absent optional value.

Jangan random mencampur:

```text
undefined
null
""
```

di serialized API.

Example:

```json
{
  "specialRequest": null
}
```

---

# 133. Enum Serialization

Enums menggunakan uppercase snake-case:

```text
WAITING_PAYMENT
PARTIALLY_PAID
CHECKED_IN
```

Business slug tetap lowercase:

```text
glamping
jeep
```

---

# 134. Public Identifier Policy

API tidak perlu expose raw internal UUID pada customer routes.

Admin dapat menggunakan opaque public identifiers untuk units/customer if needed.

Booking tetap menggunakan human-readable booking code.

---

# 135. API Logging

Critical endpoint logs:

```text
request ID
endpoint
result
booking code if available
provider reference if relevant
duration
error code
```

Never log:

```text
API secrets
auth passwords
raw credentials
full sensitive provider payload
```

---

# 136. Booking Creation Log

Minimum structured context:

```text
requestId
business
bookingCode
result
```

Customer email/phone sebaiknya tidak ditulis penuh ke generic infrastructure log.

---

# 137. Webhook Logging

Store/log:

```text
request ID
provider
provider order reference
result
idempotent duplicate yes/no
```

No secrets.

---

# 138. API Timeout Strategy

External provider requests seperti Pakasir harus memiliki bounded timeout.

Jangan biarkan API request menggantung tanpa batas.

---

# 139. Provider Retry

Payment transaction creation dapat retry secara controlled jika network failure ambiguous.

Harus mempertahankan provider order idempotency/reference untuk mencegah transaction duplicate.

Exact provider behavior disesuaikan dokumentasi Pakasir saat implementation.

---

# 140. Database Transaction vs Provider Call

Jangan menahan long PostgreSQL transaction saat menunggu external HTTP provider jika tidak perlu.

Recommended:

```text
Create booking DB transaction
COMMIT

↓
Create provider payment attempt

↓
Persist attempt result
```

Jika provider fails, booking tetap WAITING_PAYMENT.

---

# 141. Webhook Provider Verification

Provider verification HTTP call dapat dilakukan sebelum critical DB transaction apabila data yang diperlukan sudah tersedia.

Kemudian transaction singkat untuk mutate database.

---

# 142. Async Post-Payment Endpoint

Inngest handler tidak perlu menjadi public REST API.

Gunakan integration mechanism Inngest sesuai library.

Event payload hanya mengirim identifiers minimum.

Example:

```json
{
  "bookingId": "internal-id"
}
```

Worker membaca authoritative data dari database.

---

# 143. Event Payload Rule

Jangan mengirim seluruh booking/customer/invoice sensitive data dalam background event kalau worker dapat membacanya dari database.

---

# 144. Invoice Generation Idempotency

Worker selalu:

```text
check invoice by booking
```

sebelum generate.

Unique booking invoice DB constraint menjadi final guard.

---

# 145. Customer Confirmation Email Idempotency

Use logical event/state check sehingga duplicate `payment/verified` event tidak mengirim duplicate customer confirmation.

---

# 146. Demo Payment Mode

Demo dapat memakai provider test/sandbox flow apabila tersedia.

API contract tidak berubah antara:

```text
test
production
```

Provider adapter yang mengetahui credentials/environment.

---

# 147. Mock Payment Restriction

Automated E2E test boleh mock provider adapter.

Client demo end-to-end yang ditunjukkan ke client harus menggunakan real/test Pakasir integration sesuai environment.

Jangan expose button:

```text
Mark as Paid
```

pada customer demo.

---

# 148. Public Status Privacy

Status endpoint requires booking access token.

Jangan membuat:

```text
GET /bookings/GLP-XXX/status
```

public hanya dengan booking code.

---

# 149. Access Token Expiration

Booking access token recommended lifetime:

cukup untuk flow payment/lookup session.

Example:

```text
1–24 hours
```

Exact duration ditentukan implementation.

Lookup dapat menerbitkan token baru setelah ownership verification.

---

# 150. Access Token Scope

Token harus contain/resolve:

```text
booking identity
scope
expiry
```

Possible scopes:

```text
booking:read
invoice:read
payment:create
```

Initial create booking token dapat memiliki all needed customer scopes.

---

# 151. Access Token Does Not Authorize Mutation of Reservation

Customer token tidak boleh memungkinkan:

```text
change date
change quantity
cancel
check-in
```

karena fitur tersebut out of scope.

---

# 152. Admin Dashboard Business Filter

All admin endpoint yang applicable menerima:

```text
business=all
business=glamping
business=jeep
```

Do not implement filtering only in browser.

---

# 153. Dashboard Seed and Real Data

API tidak membedakan:

```text
seed
real
```

records.

Semua stored as normal database records.

---

# 154. API Does Not Return Fake Analytics

Analytics berasal dari database aggregates.

Seeded history membuat angka terlihat mature.

---

# 155. List Empty Response

Empty collection:

```json
{
  "data": [],
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 0,
    "totalPages": 0
  }
}
```

Bukan 404.

---

# 156. Detail Not Found

Detail resource tidak ada:

```text
404
```

---

# 157. Conflict vs Validation

Example:

```text
quantity = 0
→ 422 VALIDATION_ERROR
```

```text
quantity = 2 valid input
but inventory now only 1
→ 409 INVENTORY_NOT_AVAILABLE
```

---

# 158. Product Disabled During Checkout

If quote displayed product but admin disables before submit:

Create Booking returns:

```text
409 PRODUCT_NOT_ACTIVE
```

or `422`.

Recommended:

```text
409
```

because current server state conflicts with user flow.

---

# 159. Expired Booking Payment Request

```text
POST /bookings/:code/payments
```

on expired booking:

```text
409 BOOKING_EXPIRED
```

---

# 160. Payment Already Satisfied

If booking already confirmed with required DP:

another initial DP attempt:

```text
409 PAYMENT_ALREADY_COMPLETED
```

Demo v1 has no remaining online payment.

---

# 161. Invoice Response Timing

Booking may become:

```text
CONFIRMED
```

before invoice:

```text
GENERATED
```

Success page must handle:

```text
invoice.status = PENDING
```

without treating booking as failed.

---

# 162. Email Status

Public API does not need expose email delivery status.

Admin timeline may show:

```text
EMAIL_SENT
EMAIL_FAILED
```

---

# 163. Booking Expiry Countdown

Frontend obtains:

```text
expiresAt
```

from API.

Countdown is UI only.

At zero:

frontend refreshes booking state.

Do not locally mutate to EXPIRED without server response.

---

# 164. Business Timezone Metadata

Public product/bootstrap response may include:

```json
{
  "business": {
    "timezone": "Asia/Jakarta"
  }
}
```

if frontend calendar needs it.

Do not use browser timezone to validate past/future reservation.

---

# 165. Business Public Config

Optional:

## GET `/public/businesses/:slug`

Response:

```json
{
  "data": {
    "slug": "glamping",
    "name": "Bromo Glamping",
    "timezone": "Asia/Jakarta",
    "currency": "IDR",
    "booking": {
      "dpPercentage": 30,
      "holdMinutes": 30
    }
  },
  "error": null,
  "meta": null
}
```

Do not expose internal config/secrets.

---

# 166. Health Endpoint

## GET `/health`

or:

```text
/api/v1/health
```

Response:

```json
{
  "status": "ok"
}
```

Could include limited version metadata.

Do not expose database credentials or infrastructure details.

---

# 167. Readiness

Optional deployment check:

```text
/api/v1/health/ready
```

Can verify DB connectivity.

Protect detail from public leak.

---

# 168. API Documentation Generation

OpenAPI generation optional.

For demo, `API.md` + shared Zod contracts sufficient.

If OpenAPI can be generated cheaply from contracts, allowed.

Do not delay implementation solely to build documentation infrastructure.

---

# 169. No GraphQL

Demo v1 uses REST-like API.

Do not introduce GraphQL.

---

# 170. No tRPC Requirement

Do not introduce tRPC unless architecture docs are intentionally revised.

Central API has separate deployed app and public contract, so REST-like HTTP boundary is preferred.

---

# 171. No Server Actions for Cross-App Domain API

Server Actions may be used for app-local UI operations where harmless.

Critical cross-application business operations must remain behind Central API contract.

Do not bypass Central API by adding direct DB Server Actions to Glamping/Admin.

---

# 172. API Client Structure

Recommended frontend structure:

```text
lib/
└── api/
    ├── client.ts
    ├── errors.ts
    ├── glamping.ts
    ├── jeep.ts
    ├── bookings.ts
    └── admin.ts
```

Admin may split API client by features.

---

# 173. `fetch` Wrapper

API client handles:

```text
base URL
headers
JSON parse
error envelope
credentials where applicable
request IDs if needed
```

Do not hide domain behavior inside generic fetch wrapper.

---

# 174. Client Error Class

Frontend may normalize error:

```ts
ApiError {
  code
  message
  fieldErrors?
  status
}
```

UI can map:

```text
INVENTORY_NOT_AVAILABLE
```

to appropriate customer UX.

---

# 175. TanStack Query Keys

Use structured keys.

Examples:

```text
["glamping", "availability", params]

["booking", bookingCode, "status"]

["admin", "bookings", filters]

["admin", "calendar", filters]
```

Avoid random string keys.

---

# 176. Query Invalidation

After admin:

```text
check-in
check-out
cancel
block inventory
product edit
```

invalidate relevant:

```text
booking detail
booking list
dashboard
calendar
availability if applicable
```

---

# 177. Availability Cache

Availability should be considered short-lived.

Frontend may cache very briefly for UX.

Do not use long stale cache.

Create booking always revalidates.

---

# 178. Admin Dashboard Cache

Dashboard may have short cache/refetch behavior.

Transactional detail should refresh after mutations.

---

# 179. Public Product Cache

Product marketing data may be cached more aggressively.

Admin product edit should eventually invalidate/revalidate public content.

Exact Next.js caching strategy defined implementation-side.

---

# 180. API Mutation Success Feedback

Mutation response returns enough authoritative data for UI update.

Example check-in returns:

```text
new status
timestamp
```

No need client invent result.

---

# 181. Admin Mutation Reasoning

Cancel and block require reason because operations affect inventory/history.

Check-in/out notes optional.

---

# 182. Generic Admin Update Restriction

Avoid generic update endpoint:

```text
PATCH /bookings/:id
```

with arbitrary fields.

Explicit command-oriented endpoints preserve invariants.

---

# 183. Admin Product Patch Is Allowed

Product configuration is resource-like and may use PATCH because it does not represent lifecycle command.

---

# 184. File Upload

Demo v1 tidak membutuhkan admin media upload API.

Marketing images may remain bundled in apps.

R2 API only used server-side for invoices.

---

# 185. Invoice File Security

Signed R2 URL:

- short-lived,
- not stored permanently in DB,
- regenerated when requested.

DB only stores:

```text
r2ObjectKey
```

---

# 186. Request Body Size

Booking and admin JSON request body should have reasonable size limit.

Special request/note lengths must be bounded.

Recommended:

```text
specialRequest <= 1000 chars
admin note <= 2000 chars
```

Exact validation can be adjusted.

---

# 187. Search Length

Search input bounded.

Example:

```text
1–100 chars
```

Sanitized through parameterized DB query.

---

# 188. SQL Injection

API must use Drizzle/query parameters.

Never interpolate raw user search into SQL string.

---

# 189. Raw SQL Exception

Raw SQL used for DB locking/constraints must still parameterize user values.

---

# 190. Authorization Error

Unauthenticated admin request:

```text
401 UNAUTHORIZED
```

Authenticated but insufficient role future:

```text
403 FORBIDDEN
```

---

# 191. Customer Unauthorized Booking Token

Invalid/expired booking access token:

```text
401
```

Generic error.

Do not leak booking details.

---

# 192. API Timezone Rule

API business date input interpreted using business timezone.

Do not convert:

```text
2026-08-30
```

to browser-local date before domain validation.

---

# 193. ISO Date Validation

Reject invalid:

```text
2026-02-31
30-08-2026
```

Request contract requires:

```text
YYYY-MM-DD
```

---

# 194. Payment Currency

Pakasir request amount must equal authoritative booking required payment amount in IDR.

Frontend amount ignored for provider creation.

---

# 195. Provider Order Reference

Provider order reference should map unambiguously to:

```text
payment attempt
booking
```

Do not use customer-supplied reference.

---

# 196. Payment Attempt Public ID

Frontend sees opaque:

```text
paymentAttemptId
```

Provider order/reference does not need to be exposed unless useful.

---

# 197. Payment Exception Admin Visibility

Booking detail if:

```text
requiresReview = true
```

must surface exception summary.

Example:

```json
{
  "requiresReview": true,
  "reviewReason": "LATE_PAYMENT"
}
```

Possible reasons:

```text
LATE_PAYMENT
PAYMENT_AMOUNT_MISMATCH
INVENTORY_CONFLICT_AFTER_LATE_WEBHOOK
```

---

# 198. Review Resolution

Manual resolution workflow is out of scope Demo v1.

Admin may see state but no advanced resolve/refund action required.

---

# 199. API Acceptance Criteria — Public

- [ ] Active Glamping types can be fetched.
- [ ] Active Jeep packages can be fetched.
- [ ] Glamping availability works.
- [ ] Jeep availability works.
- [ ] Quote works.
- [ ] Booking is created server-side.
- [ ] Create Booking uses idempotency.
- [ ] Booking verifies Turnstile.
- [ ] Inventory conflicts return 409.
- [ ] Payment attempt can be created.
- [ ] Payment provider response is normalized.
- [ ] Booking status can be polled securely.
- [ ] Booking can be looked up with ownership verification.
- [ ] Invoice can be downloaded securely.
- [ ] Booking code alone cannot expose customer booking.

---

# 200. API Acceptance Criteria — Payment

- [ ] Pakasir webhook endpoint exists.
- [ ] Webhook is verified server-side.
- [ ] Expected amount validated.
- [ ] Duplicate webhook is idempotent.
- [ ] Payment aggregate updates transactionally.
- [ ] Required DP confirms booking.
- [ ] Late payment does not unsafe-confirm.
- [ ] Payment amount mismatch becomes exception.
- [ ] Redirect success does not mutate payment.
- [ ] Invoice/email do not block webhook response.

---

# 201. API Acceptance Criteria — Admin

- [ ] Admin APIs require session.
- [ ] Dashboard overview works.
- [ ] Business filtering server-side works.
- [ ] Booking pagination works.
- [ ] Search works.
- [ ] Booking detail works.
- [ ] Timeline works.
- [ ] Check-in works.
- [ ] Check-out works.
- [ ] Cancel works.
- [ ] Payment list works.
- [ ] Customer list/detail works.
- [ ] Calendar works.
- [ ] Inventory blocks work.
- [ ] Product price/status updates work.
- [ ] Historical booking snapshot remains unchanged after product edit.

---

# 202. Critical API E2E — Glamping

```text
GET Glamping Types
↓
POST Availability
↓
POST Quote
↓
POST Create Booking
↓
POST Payment Attempt
↓
Pakasir Payment
↓
Webhook
↓
GET Booking Status
↓
CONFIRMED
↓
POST Booking Lookup
↓
GET Invoice
```

---

# 203. Critical API E2E — Jeep

```text
GET Packages
↓
POST Availability
↓
POST Quote
↓
POST Create Booking
↓
POST Payment
↓
Webhook
↓
Booking Confirmed
↓
Admin Booking Detail
```

---

# 204. Critical Admin E2E

```text
Admin Login
↓
GET Dashboard
↓
GET Bookings
↓
GET Booking Detail
↓
POST Check-In
↓
GET Booking Detail
↓
POST Check-Out
```

---

# 205. API Test Strategy

Minimum test categories:

## Contract tests

Request schema rejects invalid input.

## Integration

API + PostgreSQL.

## Concurrency

Booking endpoint handles last-unit race.

## Payment

Duplicate webhook.

## Authorization

Customer/admin boundary.

## E2E

Critical flow with provider adapter test environment.

---

# 206. API Mocking Rules

Unit/integration tests may mock:

```text
Pakasir
Resend
R2
```

Core:

```text
booking
inventory
payment state transition
```

must still be tested against real test PostgreSQL where relevant.

---

# 207. API Implementation Location

Recommended:

```text
apps/api/app/api/v1/
```

Example:

```text
public/
├── glamping/
├── jeep/
└── bookings/

admin/
├── bookings/
├── dashboard/
├── calendar/
├── customers/
├── payments/
└── inventory/

webhooks/
└── pakasir/
```

---

# 208. Thin Route Handler Rule

Route handler should primarily:

```text
authenticate
validate
call domain service
map response/error
```

Do not place entire booking transaction logic directly inside route file.

---

# 209. Domain Service Location

Critical logic resides:

```text
@booking/booking
@booking/payment
@booking/invoice
```

API app orchestrates.

---

# 210. API Contract Source

Shared contract examples:

```text
@booking/contracts/public
@booking/contracts/admin
```

Exact folder structure implementation-dependent.

Do not manually duplicate request interfaces across apps.

---

# 211. Codex API Rules

Codex must not:

- create customer login,
- expose database ID unnecessarily,
- trust frontend total,
- trust frontend payment result,
- bypass Turnstile on required endpoints,
- omit booking idempotency,
- make availability create holds,
- remove final inventory revalidation,
- create generic booking status PATCH,
- create generic payment status PATCH,
- return raw Pakasir payload to UI,
- make webhook wait for Resend,
- expose invoice R2 object permanently,
- allow booking lookup by booking code only,
- filter admin data only client-side,
- leak raw database errors.

---

# 212. API Definition of Done

API milestone is considered functionally complete when:

```text
1. Customer can query Glamping availability.
2. Customer can query Jeep availability.
3. Server calculates price.
4. Customer can create a booking once.
5. Double-click does not duplicate booking.
6. Inventory is held.
7. Customer can initiate Pakasir payment.
8. Server can process verified provider payment.
9. Duplicate webhook does not duplicate financial effect.
10. Booking becomes confirmed only after required DP.
11. Booking status can be polled.
12. Customer can securely look up booking.
13. Invoice can be accessed after generation.
14. Admin can list and inspect bookings.
15. Admin can check in/out.
16. Admin can cancel.
17. Admin calendar returns real inventory state.
18. Admin can block/unblock inventory.
19. Product price edits only affect future bookings.
20. Core contracts have automated tests.
```

---

# 213. API Route Summary

## Public

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

POST /public/bookings/:bookingCode/payments
GET  /public/bookings/:bookingCode/status

POST /public/bookings/lookup
GET  /public/bookings/:bookingCode/invoice
```

## Webhooks

```text
POST /webhooks/pakasir
```

## Admin

```text
GET  /admin/me

GET  /admin/dashboard/overview
GET  /admin/dashboard/chart

GET  /admin/bookings
GET  /admin/bookings/:bookingCode
GET  /admin/bookings/:bookingCode/events

POST /admin/bookings/:bookingCode/check-in
POST /admin/bookings/:bookingCode/check-out
POST /admin/bookings/:bookingCode/cancel

GET  /admin/payments
GET  /admin/payments/:id

GET  /admin/customers
GET  /admin/customers/:id

GET  /admin/calendar
GET  /admin/calendar/day

GET    /admin/inventory/units
GET    /admin/inventory/blocks
POST   /admin/inventory/blocks
DELETE /admin/inventory/blocks/:id

GET   /admin/glamping/types
PATCH /admin/glamping/types/:id

GET   /admin/jeep/packages
PATCH /admin/jeep/packages/:id

GET /admin/bookings/:bookingCode/invoice
```

---

# 214. Documentation Status

Setelah dokumen ini:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅
DATABASE.md               ✅
API.md                    ✅

UI-UX-SPEC.md             ← NEXT
DEMO-DATA.md
IMPLEMENTATION-PLAN.md
AGENTS.md

CODING
```

Dokumen berikutnya adalah **`UI-UX-SPEC.md`**.

Dokumen tersebut harus menjadi blueprint visual dan interaction yang jauh lebih spesifik daripada PRD, khususnya agar Codex tidak menghasilkan UI seperti default AI/shadcn template.

`UI-UX-SPEC.md` berikutnya harus mendefinisikan:

```text
Glamping design system
Glamping landing page
Glamping availability UX
Glamping booking checkout
Payment state
Success page
Booking lookup

Jeep visual identity
Jeep landing page
Package detail
Jeep availability UX
Jeep checkout

Admin design language
Sidebar
Dashboard
Charts
Booking table
Booking detail
Payment presentation
Timeline
Calendar
Customers
Responsive behavior

Loading
Skeleton
Empty states
Errors
Dialogs
Toasts
Micro-interactions
Animation
Mobile layout
```

Targetnya nanti Codex bukan cuma tahu **fiturnya harus ada**, tapi juga **bagaimana produk harus terasa ketika dipakai**.
## Explicit Product Demo Endpoints

The following endpoints exist only when the corresponding explicit demo adapter is selected. They still mutate authoritative PostgreSQL state and enforce booking access/admin sessions.

```text
POST /api/v1/public/bookings/:bookingCode/payments

Demo settlement uses the same protected payment resource with an explicit body:

```json
{
  "action": "complete | fail",
  "orderId": "DEMO-..."
}
```

An empty request body on this endpoint initiates the configured payment provider. The
`action` form is accepted only by the explicit demo provider and therefore remains
unavailable when `APP_MODE` is not `demo`.
GET  /api/v1/public/bookings/:bookingCode/email-preview
```

The completion command verifies the server-owned attempt amount, is transactional and idempotent, confirms only an active booking whose required DP threshold is met, and then invokes the configured post-payment adapter. It is never enabled by missing Pakasir configuration: `APP_MODE=demo` and `PAYMENT_PROVIDER=demo` must both be explicit.

With `INVOICE_STORAGE=direct`, the existing authenticated invoice endpoint returns metadata by default and streams a generated PDF when called with `?download=1`. With `EMAIL_PROVIDER=preview`, the email-preview endpoint returns rendered HTML and records a preview event with `delivered: false`.

The Admin namespace uses the signed demo session cookie in product-demo mode and exposes the documented dashboard, booking, lifecycle, calendar, inventory, payment, customer, catalog, and settings resources. Browser requests must use credentials and state-changing cross-origin requests are origin-checked.

## Admin Reports Addendum — 22 September 2026

The authenticated Admin namespace also exposes a read-only report resource:

```text
GET /api/v1/admin/reports
  ?business=accommodation|jeep
  &period=today|this_week|this_month|custom
  [&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD]
  [&format=json|xlsx|pdf]
```

The report period is based on `bookings.created_at` interpreted in
`Asia/Jakarta`. `this_week` is Monday through Sunday and `custom` is an
inclusive date range. `accommodation` combines Glamping and Homestay catalog
types under the Glamping business; `jeep` is reported separately.

The default `json` response is an authenticated Admin API envelope. `xlsx` and
`pdf` are generated server-side from the same database query and streamed as
private, non-cached downloads. No report file is persisted. Export labels are
Bahasa Indonesia and do not expose raw database enums. Revenue excludes
cancelled/expired bookings and refunded payments. Empty periods return zero
summary values and `Tidak ada data pada periode ini.`.
