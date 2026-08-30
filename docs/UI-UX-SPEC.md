# UI/UX Specification

> **Client revision — 30 August 2026:** Accommodation and Jeep share the real Shakila logo, premium editorial hospitality hierarchy, core forest/cream/gold palette, typography, buttons, forms, spacing, header, and footer language. Plataran is a directional reference only; no text, photography, logo, or proprietary asset is copied. Customer payment UI shows manual bank instructions, 12-hour countdown, proof preview/upload, and Indonesian proof states. Homestay and Jeep catalog content must be labelled demo/mock until final client data arrives.

## Product Demo — Glamping, Jeep & Central Admin Booking System

> **Revision baseline:** customer availability is calendar-first, and the admin
> product uses the Shakila Group identity with Bahasa Indonesia as its default
> presentation language and English as a persisted secondary language.

**Document:** `UI-UX-SPEC.md`  
**Version:** 1.0  
**Status:** UI/UX Baseline — Demo v1

**Related Documents:**

- `docs/PRD.md`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS-RULES.md`
- `docs/DATABASE.md`
- `docs/API.md`

---

# 1. Purpose

Dokumen ini mendefinisikan arah UI/UX untuk:

1. Glamping Customer Website
2. Jeep Customer Website
3. Central Admin Dashboard

Tujuan utama dokumen ini adalah mencegah implementasi menghasilkan UI yang:

- terlihat seperti template,
- terasa seperti default shadcn,
- memiliki layout generik,
- tidak punya karakter brand,
- terlalu developer-oriented,
- tidak nyaman digunakan di mobile,
- terlihat seperti prototype murah.

Product demo harus terlihat seperti:

> **produk yang sudah siap digunakan, hanya scope fiturnya yang masih terbatas.**

---

# 2. Core Design Principle

Seluruh UI mengikuti prinsip:

> **Demo should feel production-ready, not prototype-ready.**

UI harus:

- clean,
- intentional,
- premium,
- responsive,
- consistent,
- mudah dipahami,
- memiliki visual hierarchy kuat,
- memiliki interaction feedback yang jelas.

---

# 3. Product Visual Separation

Terdapat tiga visual system berbeda:

```text
GLAMPING
Premium Hospitality

JEEP
Premium Adventure

ADMIN
Modern Operations SaaS
```

Glamping dan Jeep tidak boleh terlihat seperti website yang sama hanya dengan:

```text
warna berbeda
+
foto berbeda
```

Keduanya harus mempunyai:

- typography personality berbeda,
- section rhythm berbeda,
- card treatment berbeda,
- hero composition berbeda,
- interaction emphasis berbeda.

---

# 4. Shared UX Principles

Walaupun visual berbeda, behavior UX harus konsisten.

Shared principles:

```text
Clear pricing
Clear DP amount
Clear availability
Clear status
Minimal booking friction
No customer login
Strong CTA
Transparent confirmation
Immediate feedback
```

---

# 5. Accessibility

Minimum:

- semantic HTML,
- accessible form labels,
- keyboard navigation,
- visible focus state,
- accessible dialog,
- sufficient contrast,
- meaningful button labels,
- icons tidak menjadi satu-satunya informasi,
- status tidak hanya dibedakan berdasarkan warna.

---

# 6. Responsive Strategy

Customer sites dirancang dengan prioritas:

```text
1. Mobile
2. Desktop
3. Tablet
```

Admin:

```text
1. Desktop
2. Tablet
3. Mobile fallback
```

---

# 7. Breakpoint Philosophy

Gunakan Tailwind responsive system secara konsisten.

Tidak perlu membuat banyak custom breakpoint.

General intent:

```text
Mobile:
< 768px

Tablet:
768px – 1023px

Desktop:
>= 1024px

Large Desktop:
>= 1280px
```

Exact breakpoint mengikuti Tailwind default jika cukup.

---

# 8. Global Motion Principle

Animation harus:

- subtle,
- fast,
- purposeful.

Tidak boleh:

- excessive parallax,
- bounce berlebihan,
- animation yang memperlambat booking,
- hover effect berlebihan.

Recommended duration:

```text
Micro interaction:
150–220ms

Section reveal:
300–500ms
```

Gunakan CSS/Tailwind transition terlebih dahulu.

Framer Motion hanya jika benar-benar memberi value.

---

# 9. Icon System

Gunakan:

```text
Lucide Icons
```

Icon style:

- outline,
- consistent stroke,
- tidak mencampur berbagai icon library.

---

# 10. Customer Website Maximum Width

General content:

```text
max-width sekitar 1280–1440px
```

Text-heavy content menggunakan width lebih sempit agar mudah dibaca.

---

# 11. Spacing Philosophy

Hindari layout padat seperti dashboard pada customer site.

Gunakan:

- generous whitespace,
- clear section separation,
- intentional vertical rhythm.

Landing section desktop dapat memiliki:

```text
py-20
py-24
py-28
```

tergantung composition.

Mobile dikurangi proporsional.

---

# PART I — GLAMPING CUSTOMER EXPERIENCE

# 12. Glamping Visual Direction

Keywords:

```text
Premium
Calm
Warm
Natural
Immersive
Refined
Hospitality
Private escape
```

User harus merasa:

> “Ini tempat menginap premium.”

Bukan:

> “Ini website booking biasa.”

---

# 13. Glamping Color Direction

Suggested palette:

```text
Primary:
Deep Forest

Background:
Warm Off-White

Surface:
Soft Cream

Accent:
Muted Gold / Warm Sand

Text:
Near Black / Dark Forest

Muted:
Warm Gray
```

Contoh semantic token direction:

```text
--background
#F7F5F0

--foreground
#18211B

--primary
#233A2B

--primary-foreground
#FFFFFF

--secondary
#E8E1D5

--muted
#EFECE6

--muted-foreground
#6F756F

--accent
#B79B6C

--border
#DDD8CE
```

Exact value boleh disesuaikan saat implementation untuk visual quality.

Jangan gunakan hijau terang generic.

---

# 14. Glamping Typography

Recommended pairing:

Heading:

```text
Elegant serif/display
```

Body/UI:

```text
Clean sans-serif
```

Contoh compatible Google Font direction:

```text
Heading:
Cormorant Garamond / DM Serif Display / Instrument Serif

Body:
Inter / Manrope / Geist
```

Final font harus:

- legible,
- available via web,
- tidak terlalu decorative.

---

# 15. Glamping Typography Hierarchy

Desktop:

```text
Hero:
56–72px equivalent

H1:
48–64px

H2:
36–48px

H3:
24–32px

Body Large:
18–20px

Body:
15–17px
```

Mobile:

hero turun secara signifikan tetapi tetap impactful.

---

# 16. Glamping Header

Header desktop:

```text
Logo
Navigation
              Book Now CTA
```

Navigation:

```text
Stay
Experience
Gallery
FAQ
Contact
```

Behavior:

- transparent / lightly overlay pada hero,
- berubah menjadi solid/blur ketika scroll,
- sticky.

CTA:

```text
Book Your Stay
```

---

# 17. Glamping Mobile Header

Mobile:

```text
Logo
Menu button
```

Menu menggunakan drawer/sheet.

Primary CTA tetap mudah ditemukan.

---

# 18. Glamping Hero

Hero harus menjadi salah satu bagian paling kuat.

Layout desktop:

```text
Large full-width image / cinematic image
+
dark controlled overlay
+
left-aligned content
+
booking widget overlapping bottom
```

Content:

```text
Eyebrow
Main headline
Supporting copy
Primary CTA
Optional secondary CTA
```

Example tone:

```text
Escape Into the Mountains

Stay closer to nature without
leaving comfort behind.
```

Jangan gunakan terlalu banyak copy.

---

# 19. Hero Image Behavior

Desktop:

```text
min-height sekitar 75–90vh
```

Image:

- cover,
- strong focal point,
- avoid random stock-looking crop.

Overlay cukup untuk readability.

---

# 20. Glamping Quick Booking Widget

Desktop hero bottom:

```text
┌──────────────────────────────────────────────┐
│ Check-in │ Check-out │ Guests │ Search Stay │
└──────────────────────────────────────────────┘
```

Visual:

- elevated card,
- light background,
- rounded but not overly bubbly,
- clean shadow.

---

# 21. Mobile Booking Widget

Jangan paksa empat kolom.

Mobile:

```text
Check-in
Check-out

Guests

[ Check Availability ]
```

Sebagai full-width card di bawah hero text atau sticky CTA.

---

# 22. Date Picker UX

Date picker:

- jelas menunjukkan unavailable day,
- past dates disabled,
- check-in dan check-out state berbeda,
- selected range visually obvious,
- keyboard accessible.

Mobile dapat menggunakan full-screen/bottom sheet date picker.

---

# 23. Guests Picker

Control:

```text
Guests
[-] 2 [+]
```

atau popover.

Jangan gunakan free-text numeric input jika bisa dihindari.

---

# 24. Glamping Accommodation Section

Section heading:

```text
Find Your Stay
```

Cards tidak seperti SaaS card.

Recommended:

```text
Large image
Name
Short description
Capacity
Selected facilities
Price
View / Book CTA
```

Desktop dapat menggunakan 2-column card layout.

---

# 25. Accommodation Card

Suggested structure:

```text
[ Large Image ]

Deluxe Dome

Mountain-facing private dome
for two guests.

2 Guests · Private Bath · Breakfast

From Rp850.000 / night

[ View Stay ]
```

Hover desktop:

- image subtle scale,
- CTA movement subtle.

---

# 26. Accommodation Detail Page

Route:

```text
/stay/[slug]
```

Structure:

```text
Gallery
↓
Title + pricing
↓
Primary information
↓
Facilities
↓
Description
↓
Availability / booking card
↓
Policies
↓
Related stay
```

---

# 27. Accommodation Detail Gallery

Desktop:

```text
large primary photo
+
2–4 supporting photos
```

Mobile:

horizontal swipe/gallery.

No excessive carousel controls.

---

# 28. Sticky Booking Card — Desktop

On detail page:

```text
Right column:
Booking card
```

Contains:

```text
Price / night
Dates
Guests
Quantity
Availability
CTA
```

Can remain sticky during scroll.

---

# 29. Mobile Detail CTA

Mobile:

sticky bottom action:

```text
From Rp850.000
[ Check Availability ]
```

Tidak menutupi critical content.

---

# 30. Glamping Facilities

Gunakan icon + text.

Example:

```text
Private Bathroom
Breakfast Included
Mountain View
Hot Water
Wi-Fi
```

Jangan membuat giant icon cards jika informasi sederhana.

---

# 31. Glamping Experience Section

Dapat menggunakan asymmetric editorial layout:

```text
image       text
text        image
```

Tujuannya membuat landing terasa hospitality editorial, bukan card-list landing page.

---

# 32. Gallery Section

Gunakan:

- masonry-inspired layout,
- varied image aspect ratio,
- no excessive rounded rectangle.

Gallery harus terasa editorial.

---

# 33. Testimonials

Maximum 2–4 visible.

Design:

- understated,
- no giant quote icon,
- guest name,
- short quote,
- optional rating.

Seed data allowed.

---

# 34. FAQ

Use accordion.

Accordion harus:

- clear,
- not overly bordered,
- accessible.

---

# 35. Final Glamping CTA

Large visual section.

Example:

```text
Your mountain escape is waiting.

[ Check Availability ]
```

Dapat menggunakan image background atau soft contrast section.

---

# 36. Glamping Footer

Include:

```text
Brand
Short description
Navigation
Contact
Location
Social placeholder if needed
Copyright
```

---

# 37. Glamping Availability Page

Route:

```text
/availability
```

Desktop structure:

```text
Search Parameters
────────────────────

Dates / Guests summary

Available Stays
────────────────────

[ Stay Card ]
[ Stay Card ]
```

---

# 38. Availability Search Summary

Top card:

```text
30 Aug → 1 Sep
2 Nights
2 Guests

[ Change Search ]
```

---

# 39. Availability Result Card

Must prominently show:

```text
Product
Image
Capacity
Available Quantity
Price
Estimated total
CTA
```

Example:

```text
Deluxe Dome

3 units available

Rp850.000 / night

2 nights
Rp1.700.000

[ Select ]
```

---

# 40. Limited Availability

Example:

```text
Only 1 unit left
```

Use warning accent.

Jangan manipulative urgency.

Only show actual availability.

---

# 41. Sold Out

Card boleh tetap terlihat tetapi disabled.

```text
Sold Out
```

CTA disabled.

Do not hide all sold-out options if useful for customer context.

---

# 42. No Availability

State:

```text
No stays available for these dates.

Try changing your dates or number of guests.

[ Change Dates ]
```

Visual tetap polished.

## 42.1 Revised Glamping Availability Calendar

The primary state is a visible month calendar, not an empty date form. Desktop uses
a refined month grid with a selected-day detail panel. Each day communicates the
remaining Deluxe Dome and Family Dome inventory through restrained dots/chips; the
detail panel provides the exact unit counts and continuation action.

The component uses warm off-white surfaces, forest-green interaction states,
subtle borders, controlled elevation, and generous spacing. Past dates are disabled,
today and the selected `[checkIn, checkOut)` range are distinct, and sold-out dates
remain readable. At mobile width, the calendar stays compact and exact availability
moves into stacked cards beneath it.

States required: loading skeleton, retryable error, empty/sold-out, selected
check-in, selected range, and inventory change after final server validation.

---

# 43. Glamping Booking Page

Route:

```text
/booking
```

Desktop:

```text
Left:
Booking form

Right:
Sticky reservation summary
```

Mobile:

```text
Reservation summary
↓
Form
↓
Price summary
↓
CTA
```

---

# 44. Booking Steps

Visual step indicator subtle:

```text
01 Details
02 Guest
03 Payment
```

Jangan buat giant wizard navigation.

---

# 45. Guest Form

Fields:

```text
Full Name
Email
WhatsApp
Guests
Special Request
```

Labels selalu visible.

Jangan hanya placeholder.

---

# 46. Form Validation UX

Validation:

- inline,
- near field,
- clear wording,
- validation triggered reasonably,
- do not show errors before user interacts unnecessarily.

---

# 47. Booking Summary Card

Critical UI.

Must show:

```text
Deluxe Dome

30 Aug → 1 Sep
2 Nights

1 Unit
2 Guests

Room
Rp1.700.000

Additional
Rp0

────────────────

Total
Rp1.700.000

DP 30%
Rp510.000

Pay Now
Rp510.000

Remaining
Rp1.190.000
```

---

# 48. Price Hierarchy

Visual priority:

```text
Total
↓
Pay Now / DP
↓
Remaining
```

Customer harus benar-benar paham bahwa:

```text
Pay Now != Total Booking
```

---

# 49. Booking Submit CTA

Example:

```text
Continue to Payment
```

Button full-width pada mobile.

During submit:

```text
Creating booking...
```

Disable repeated click.

---

# 50. Booking Inventory Conflict UX

Jika API:

```text
INVENTORY_NOT_AVAILABLE
```

show:

```text
Availability has changed

Someone has just booked the remaining
unit for your selected dates.

[ Check Availability Again ]
```

Do not show raw API error.

---

# 51. Payment Page

Route:

```text
/booking/payment
```

Purpose:

- show booking summary,
- countdown,
- payment method/provider UI,
- status.

---

# 52. Payment Countdown

Show:

```text
Complete payment within

29:42
```

Secondary copy:

```text
Your reservation is temporarily held until
the timer expires.
```

Countdown must use server `expiresAt`.

---

# 53. Payment Summary

Show:

```text
Booking ID
GLP-...

Total booking
Rp...

DP to pay
Rp...
```

---

# 54. Pakasir Payment Presentation

Normalized provider UI.

If redirect:

```text
[ Pay Rp510.000 ]
```

If QR presented:

- display QR clearly,
- method,
- amount,
- payment instructions.

Do not expose provider raw JSON.

---

# 55. Payment Pending State

Visual:

```text
Payment is being verified

This normally takes only a moment.
```

Show subtle spinner/progress.

---

# 56. Payment Failure

```text
Payment was not completed.

Your booking is still being held for 18 minutes.

[ Try Payment Again ]
```

Only if hold still active.

---

# 57. Booking Expired

```text
This reservation has expired.

Your temporary inventory hold has been released.

[ Search Availability Again ]
```

---

# 58. Success Page

Route:

```text
/booking/success
```

Must feel celebratory but refined.

Desktop:

```text
Success icon
Booking confirmed
Booking ID
Reservation summary
Payment summary
Email confirmation notice
CTA
```

---

# 59. Success Copy

Example:

```text
Your stay is confirmed.

We’ve received your DP payment
and sent your invoice to aldi@example.com.
```

---

# 60. Success Payment Summary

Show:

```text
Total
Rp1.700.000

Paid
Rp510.000

Remaining
Rp1.190.000
```

Status badge:

```text
PARTIALLY PAID
```

Human UI label:

```text
DP Paid
```

---

# 61. Success Actions

```text
[ View Booking ]
[ Download Invoice ]
[ Back to Home ]
```

If invoice pending:

```text
Preparing invoice...
```

No broken download button.

---

# 62. Booking Lookup Page

Glamping route:

```text
/booking/check
```

Layout:

simple focused card.

Fields:

```text
Booking ID
Email or WhatsApp
```

CTA:

```text
Find Booking
```

---

# 63. Booking Lookup Result

Show compact reservation card:

```text
Confirmed

GLP-...
Deluxe Dome

30 Aug → 1 Sep

Paid
Rp510.000

Remaining
Rp1.190.000

[ Download Invoice ]
```

---

# PART II — JEEP CUSTOMER EXPERIENCE

# 64. Jeep Visual Direction

Keywords:

```text
Adventure
Bold
Cinematic
Energetic
Premium
Rugged
Outdoor
Confident
```

User harus merasa:

> “Ini operator wisata adventure profesional.”

---

# 65. Jeep Color Direction

Suggested:

```text
Primary:
Charcoal / Volcanic Black

Background:
Warm Stone

Accent:
Burnt Orange / Rust

Secondary:
Olive / Khaki

Text:
Near Black / Off White
```

Example direction:

```text
--background
#F4F1EA

--foreground
#181817

--primary
#1B1B19

--primary-foreground
#FFFFFF

--accent
#C45A2A

--secondary
#72745B

--muted
#E7E2D8

--border
#D9D4C8
```

---

# 66. Jeep Typography

Heading:

```text
Bold sans-serif / condensed display feel
```

Body:

```text
Clean sans-serif
```

Possible direction:

```text
Heading:
Archivo Black / Barlow Condensed / Space Grotesk

Body:
Inter / Manrope / Geist
```

Avoid childish extreme fonts.

---

# 67. Jeep Hero

Hero more energetic than Glamping.

Possible composition:

```text
full-width image
+
large bold headline
+
route/destination hint
+
booking CTA
```

Example:

```text
Chase the Sunrise.
Conquer Bromo.

Private Jeep adventures
through Bromo’s iconic landscapes.

[ Book Your Jeep ]
```

---

# 68. Jeep Hero Layout

Can use:

```text
asymmetric text
+
large visual
+
small route stats
```

Example:

```text
Start 03:00
Up to 6 Guests
Private Jeep
```

---

# 69. Jeep Header

Navigation:

```text
Packages
Destinations
Fleet
FAQ
Contact
```

CTA:

```text
Book a Jeep
```

Header can be darker than Glamping.

---

# 70. Jeep Booking Widget

Quick booking:

```text
Package
Date
Departure
Guests

[ Check Jeep Availability ]
```

Can use dark card overlay on hero.

---

# 71. Jeep Package Section

Package cards should feel like tour packages, not room cards.

Structure:

```text
Image
Package label
Package name
Route highlights
Duration
Capacity
Price
CTA
```

---

# 72. Package Card Example

```text
SUNRISE TOUR

Sunrise Adventure

Penanjakan
Kawah Bromo
Pasir Berbisik

03:00 Departure
Up to 6 Guests

Rp750.000 / Jeep

[ View Adventure ]
```

---

# 73. Package Detail

Route:

```text
/packages/[slug]
```

Sections:

```text
Hero
Package overview
Route timeline
Destinations
What's included
Availability CTA
FAQ
```

---

# 74. Jeep Route Timeline

Visually show:

```text
03:00 Pickup
↓
04:00 Sunrise Point
↓
07:00 Bromo Crater
↓
09:00 Whispering Sands
```

Seed content okay.

---

# 75. Jeep Destination Visuals

Use full bleed images or alternating panels.

Avoid tiny icon grid for destinations.

---

# 76. Jeep Availability Page

Inputs:

```text
Package
Tour Date
Departure Slot
Guests
```

Result:

```text
Sunrise Adventure

30 Aug 2026
03:00

3 Jeeps available

Minimum for 8 guests:
2 Jeeps

Rp750.000 / Jeep
```

## 76.1 Revised Jeep Date and Slot Availability

The primary state is a visible date selector/calendar. Selecting a date immediately
shows every active package and its active departure-slot cards with remaining Jeep
inventory. The visual language is charcoal, sand, and controlled burnt orange and
must not reuse the Glamping presentation. Guest and Jeep quantity controls appear
after a package/slot is selected. Past dates are disabled and no blind form submit
is required to discover availability.

---

# 77. Jeep Quantity Selector

Explicit:

```text
Number of Jeeps

[-] 2 [+]
```

Show:

```text
Supports up to 12 guests
```

---

# 78. Jeep Availability Urgency

Allowed:

```text
Only 2 Jeeps remaining
```

only when real.

No fake urgency.

---

# 79. Jeep Checkout

Same functional pattern as Glamping but tailored.

Summary:

```text
Sunrise Adventure

30 Aug 2026
03:00 Departure

2 Jeeps
8 Guests

Rp750.000 x 2

Total
Rp1.500.000

DP 30%
Rp450.000

Pay Now
Rp450.000
```

---

# 80. Jeep Success Page

Use same domain status but adventure branding.

Copy:

```text
Your Bromo adventure is booked.
```

Not same exact visual as Glamping success page.

---

# 81. Jeep Booking Lookup

Same functional behavior.

Can reuse shared form logic, but visuals follow Jeep brand.

---

# PART III — ADMIN DASHBOARD

# 82. Admin Visual Direction

Keywords:

```text
Modern SaaS
Operational
Professional
Fast
Clear
Dense but breathable
Reliable
```

Admin should feel closer to:

```text
Linear
Stripe Dashboard
Vercel
Modern hotel management SaaS
```

than generic Bootstrap admin.

---

# 83. Admin Color Direction

Admin default:

```text
Light theme
```

Dark theme not required Demo v1.

Suggested:

```text
Background:
#F7F8FA

Surface:
#FFFFFF

Text:
#18181B

Muted:
#71717A

Border:
#E4E4E7
```

Business identity colors may appear only as subtle category indicators.

---

# 84. Admin Typography

Use single sans-serif family.

Recommended:

```text
Geist
Inter
Manrope
```

Admin typography hierarchy clean and compact.

---

# 85. Admin Shell

Desktop:

```text
┌──────── Sidebar ────────┬──────────────────────────────┐
│                         │ Header                       │
│                         ├──────────────────────────────┤
│                         │                              │
│                         │ Main Content                 │
│                         │                              │
└─────────────────────────┴──────────────────────────────┘
```

---

# 86. Sidebar Width

Approx:

```text
240–270px
```

Should not dominate screen.

---

# 87. Sidebar Structure

```text
Brand

Overview

OPERATIONS
Bookings
Calendar
Payments
Customers

BUSINESS
Glamping
Jeep

SYSTEM
Settings

Admin Profile
```

---

# 88. Sidebar Active State

Use:

- subtle surface background,
- stronger text,
- small icon,
- optional left indicator.

Avoid oversized pill nav.

---

# 89. Admin Mobile Sidebar

Tablet/mobile:

collapse to sheet/drawer.

Desktop sidebar persistent.

---

# 90. Admin Header

Contains:

```text
Page title
Optional description

Business selector
Date/period control if relevant
Admin avatar/profile
```

---

# 91. Global Business Selector

UI:

```text
All Businesses
Glamping
Jeep
```

Prefer compact select/dropdown in header.

Show business badge/icon.

---

# 92. Overview Page

Route:

```text
/
```

or:

```text
/dashboard
```

Composition:

```text
Greeting/header
↓
KPI cards
↓
Revenue chart
↓
Business breakdown / occupancy
↓
Recent bookings
↓
Today's activities/upcoming
```

---

# 93. Overview Header

Example:

```text
Good evening, Admin

Here’s what’s happening across
your businesses today.
```

Display current date.

Avoid huge dashboard hero.

---

# 94. KPI Cards

Minimum:

```text
Revenue Received
Total Bookings
Today's Bookings
Upcoming Reservations
```

Optional:

```text
Outstanding Balance
```

---

# 95. KPI Card Design

Compact.

Structure:

```text
Label
Value
Comparison/subtext
Icon
```

Example:

```text
Revenue Received

Rp38.750.000

+12.4% from last month
```

Seed comparisons allowed if backed by seed data.

---

# 96. KPI Semantics

Revenue card must mean:

```text
verified money received
```

Never use total booking value while labeling it Revenue.

---

# 97. Revenue Chart

Default:

```text
Line or area chart
```

Do not use unnecessary 3D/chart effects.

Controls:

```text
7 Days
30 Days
This Month
```

Business selector global handles scope.

---

# 98. Chart Tooltip

Tooltip:

```text
25 Aug 2026

Revenue
Rp2.450.000

Bookings
4
```

Clean styling.

---

# 99. Recent Bookings

Table/card.

Columns desktop:

```text
Booking
Customer
Business
Product
Date
Payment
Status
Total
```

---

# 100. Recent Booking Status

Business visual:

```text
Glamping
Jeep
```

using subtle badge.

Booking status distinct from payment status.

---

# 101. Booking Status Visual

Recommended semantic style:

```text
WAITING_PAYMENT
Amber

CONFIRMED
Blue / Indigo

CHECKED_IN
Purple

CHECKED_OUT
Slate

COMPLETED
Green

CANCELLED
Red

EXPIRED
Gray
```

Exact token chosen implementation side.

Label must remain readable without color.

---

# 102. Payment Status Visual

```text
UNPAID
Neutral / Red muted

PENDING
Amber

PARTIALLY_PAID
Blue

PAID
Green

FAILED
Red

REFUNDED
Purple/Gray
```

---

# 103. Booking Management Page

Header:

```text
Bookings

Manage reservations across all businesses.
```

Actions:

- no primary “create booking” required Demo v1 unless desired.

---

# 104. Booking Filter Bar

Desktop:

```text
[ Search bookings... ]

[ Business ]
[ Booking Status ]
[ Payment Status ]
[ Date ]

[ Reset ]
```

Search width prominent.

---

# 105. Booking Table

Columns:

```text
Booking ID
Customer
Business
Reservation
Amount
Paid
Payment
Status
Created
```

Avoid too many columns.

Additional details on row click.

---

# 106. Table Row

Clickable full row.

Hover subtle.

Booking ID monospaced or semibold.

Customer:

```text
Aldi Pratama
aldi@example.com
```

---

# 107. Table Responsive

Tablet:

hide lower-priority columns.

Mobile:

convert to stacked booking cards rather than horizontal scroll if practical.

Admin mobile is secondary.

---

# 108. Pagination

Bottom:

```text
Showing 1–20 of 87

< Previous     1 2 3     Next >
```

---

# 109. Booking Empty State

```text
No bookings found

Try changing your search or filters.
```

Include reset button.

---

# 110. Booking Detail Page

One of the most important admin demo pages.

Top:

```text
← Back to bookings

GLP-260830-001234

Confirmed
DP Paid
```

Right actions:

```text
Cancel
Check In
```

depending state.

---

# 111. Booking Detail Layout

Desktop recommended:

```text
Main content 2/3
+
Right sidebar 1/3
```

Main:

```text
Reservation
Customer
Payment
Timeline
```

Sidebar:

```text
Status
Quick actions
Invoice
Booking metadata
```

---

# 112. Booking Detail Header

Example:

```text
GLP-260830-001234

Deluxe Dome
30 Aug – 1 Sep 2026

CONFIRMED     DP PAID
```

---

# 113. Customer Card

```text
Customer

Aldi Pratama
aldi@example.com
+62 812-3456-7890
```

Actions optional:

```text
Copy Email
Copy WhatsApp
```

No need WhatsApp integration.

---

# 114. Reservation Card — Glamping

```text
Stay Details

Deluxe Dome

Check-in
30 Aug 2026

Check-out
1 Sep 2026

2 Nights
2 Units
4 Guests

Assigned
Dome 01
Dome 03
```

---

# 115. Reservation Card — Jeep

```text
Tour Details

Sunrise Adventure

30 Aug 2026
03:00 Departure

2 Jeeps
8 Guests

Assigned
Jeep 02
Jeep 04
```

---

# 116. Payment Card

Must clearly separate:

```text
Total
Paid
Remaining
```

Example:

```text
Total Booking
Rp3.400.000

DP Required
Rp1.020.000

Verified Paid
Rp1.020.000

Remaining
Rp2.380.000
```

Payment method/reference below.

---

# 117. Payment Progress

Optional visual bar:

```text
30% paid
```

Only if useful.

Do not imply that 30% means operational completion.

---

# 118. Invoice Card

```text
Invoice

INV-260830-001234

Generated
25 Aug 2026, 16:25

[ View Invoice ]
[ Download ]
```

If pending:

```text
Preparing invoice...
```

---

# 119. Timeline

Vertical activity timeline.

Example:

```text
● Booking created
  25 Aug, 14:21

● Payment initiated
  25 Aug, 14:23

● DP payment verified
  25 Aug, 14:24

● Booking confirmed
  25 Aug, 14:24

● Invoice generated
  25 Aug, 14:25

● Confirmation email sent
  25 Aug, 14:25
```

---

# 120. Timeline Visual

Use:

- subtle line,
- event icon/dot,
- timestamp,
- title,
- optional description.

Avoid giant event cards.

---

# 121. Check-In Action

Button appears when eligible:

```text
Check In Guest
```

Click opens confirmation dialog.

---

# 122. Check-In Dialog

```text
Check in this guest?

Aldi Pratama
Deluxe Dome

30 Aug 2026

Payment requirement
DP Paid ✓

[ Cancel ]
[ Confirm Check-In ]
```

---

# 123. Check-In Success

After success:

- status updates,
- toast,
- timeline update,
- CTA changes.

Toast:

```text
Guest checked in successfully.
```

---

# 124. Check-In Blocked

If not eligible:

Button can be disabled with explanation or action returns dialog.

Example:

```text
Check-in unavailable

Required DP has not been verified.
```

---

# 125. Check-Out Dialog

```text
Complete check-out?

This will mark the reservation as checked out.

[ Cancel ]
[ Confirm Check-Out ]
```

---

# 126. Cancel Booking

Secondary destructive action.

Not primary visual CTA.

Open dialog:

```text
Cancel booking

This will release future inventory.

Reason
[ Select ]

Note
[ Optional ]

[ Keep Booking ]
[ Cancel Booking ]
```

---

# 127. Cancellation Payment Warning

If already paid:

show:

```text
This booking has received Rp1.020.000.

Cancelling the booking will not automatically
refund the payment.
```

Important.

---

# 128. Calendar Page

Major demo feature.

Header:

```text
Availability Calendar

View occupancy and reservations.
```

Controls:

```text
Business
Month navigation
Today
```

---

# 129. Glamping Calendar

Desktop month grid.

Each day may show:

```text
Deluxe
3 / 4

Family
2 / 2 Full
```

Do not overcrowd.

If many items:

show maximum and:

```text
+2 more
```

---

# 130. Calendar Day State

Today:

subtle outline/highlight.

Selected day:

distinct background.

Full:

status text + dot.

Do not color entire calendar cell bright red.

---

# 131. Calendar Drawer

Click day opens right-side drawer:

```text
30 August 2026

Availability
────────────
Deluxe Dome
3 / 4 occupied

Family Dome
2 / 2 occupied

Bookings
────────────
GLP-0012 Aldi Pratama
GLP-0013 Budi Santoso
```

---

# 132. Jeep Calendar

Show per departure slot.

Example:

```text
30 Aug

03:00
6 / 8 booked

08:00
3 / 8 booked
```

---

# 133. Calendar Mobile

Admin mobile may switch from month grid to:

```text
agenda/list mode
```

Better than forcing tiny grid.

---

# 134. Inventory Block UX

Available from Calendar or business inventory page.

Action:

```text
Block Unit
```

Form:

```text
Unit
Date / Date Range
Departure Slot if Jeep
Reason
Note
```

---

# 135. Inventory Block Success

Toast:

```text
Dome 03 blocked successfully.
```

Calendar refetches.

---

# 136. Inventory Conflict

Dialog:

```text
This unit cannot be blocked

There is an active booking during
the selected period.

GLP-260830-001234
Aldi Pratama

[ View Booking ]
```

---

# 137. Payments Page

Header:

```text
Payments

Track verified and pending transactions.
```

Filters:

```text
Search
Business
Status
Date
```

The revised Payments page is server-driven and adds method, date range, requires
review, search, and ordering controls. Search covers booking code, customer name,
email, WhatsApp, provider order/reference, and provider transaction reference.
Default page size is 20 and localized pagination preserves all active query filters.

---

## 137.1 Admin Bilingual Presentation

Shakila Group Admin defaults to Bahasa Indonesia. English is selectable from the
top bar with proper flag components and the preference persists locally. The
translation dictionary covers navigation, headings, descriptions, KPIs, controls,
forms, filters, table headings, dialogs, loading/error/empty states, status labels,
inventory, settings, and pagination. Database values are translated only at the
presentation boundary.

---

# 138. Payment Table

Columns:

```text
Transaction
Booking
Customer
Business
Amount
Method
Status
Paid At
```

---

# 139. Payment Detail

Drawer/page:

```text
Provider
Order reference
Transaction reference
Requested amount
Verified amount
Method
Status
Timestamp
Booking link
```

Raw provider payload not shown.

---

# 140. Payment Exception

Requires review visible prominently.

Example:

```text
Requires Review

Late payment received after booking expiration.
```

Use warning panel.

Do not auto-resolve in Demo v1.

---

# 141. Customers Page

Header:

```text
Customers

People who have booked across your businesses.
```

---

# 142. Customer Table

```text
Customer
Contact
Businesses
Bookings
Last Booking
```

Optional verified spending.

---

# 143. Customer Detail

Header:

```text
Aldi Pratama

aldi@example.com
+62...
```

Summary:

```text
Total bookings
Total verified spend
Last booking
Businesses used
```

History table below.

---

# 144. Business Management — Glamping

Admin business page:

```text
Glamping
```

Sections:

```text
Accommodation Types
Units
Blocked Dates
```

Demo editing limited.

---

# 145. Glamping Type Card/List

Show:

```text
Deluxe Dome
Rp850.000 / night
4 Units
Active
```

Action:

```text
Edit
```

---

# 146. Edit Glamping Dialog

Fields:

```text
Name
Description
Base Price
Active
```

Do not expose complex schema.

---

# 147. Jeep Management

Similar operational quality.

Packages:

```text
Sunrise Adventure
Rp750.000 / Jeep
Active
```

---

# 148. Toast System

Use shadcn Sonner/toast equivalent.

Toast types:

```text
Success
Error
Warning
Info
```

Duration moderate.

Important failure should also remain visible in page state, not toast only.

---

# 149. Modal/Dialog Principle

Use dialog for:

- confirmation,
- destructive action,
- focused small form.

Do not put large multi-section management page inside modal.

---

# 150. Drawer/Sheet Principle

Use side drawer for:

- calendar day details,
- payment quick detail,
- mobile filters.

---

# 151. Loading State — Customer

Customer flow must never appear frozen.

Examples:

```text
Checking availability...
Creating your booking...
Preparing payment...
Verifying your payment...
```

---

# 152. Skeletons

Use skeleton for:

- product cards,
- booking table,
- dashboard KPI,
- calendar initial load.

Do not skeleton simple button mutations.

---

# 153. Button Loading

Example:

```text
[ Continue to Payment ]
```

becomes:

```text
[ Creating Booking... ]
```

with spinner.

Width should remain stable to avoid layout shift.

---

# 154. Admin Loading

Page-level skeleton should resemble actual layout.

Avoid generic:

```text
Loading...
```

centered on full screen.

---

# 155. Error Page

Customer site generic:

```text
Something went wrong

We couldn’t load this page right now.

[ Try Again ]
[ Back Home ]
```

---

# 156. Admin Error State

```text
Unable to load bookings

There was a problem loading booking data.

[ Retry ]
```

Retain filters if possible.

---

# 157. Offline/Network Error

Use clear copy:

```text
Connection lost.

Check your internet connection and try again.
```

Do not imply payment failed solely due to browser network loss.

---

# 158. Payment Network Error

Important:

if payment verification fetch fails:

```text
We’re having trouble checking your payment status.

Your payment may still have been received.

[ Check Again ]
```

Never show:

```text
Payment Failed
```

without authoritative response.

---

# 159. Empty State Philosophy

Empty state should explain:

```text
what is empty
why it may be empty
what to do next
```

---

# 160. Booking Table Empty

```text
No bookings match these filters.

[ Reset Filters ]
```

---

# 161. Calendar Empty

If no booking:

```text
No reservations for this date.
```

Still show inventory availability.

---

# 162. Admin First Load With Seed

Demo admin should not normally show empty dashboard because seed data exists.

---

# 163. Form Input Styling

Customer:

- larger input height,
- comfortable touch targets,
- softer border treatment.

Admin:

- compact but accessible.

---

# 164. Touch Target

Mobile actionable controls should generally be:

```text
44px+
```

effective touch height.

---

# 165. Date Formatting

Customer-facing Indonesian locale can use:

```text
30 Agustus 2026
```

or abbreviated:

```text
30 Agu 2026
```

depending space.

Admin can use compact:

```text
30 Aug 2026
```

Language consistency determined at implementation.

---

# 166. Product Language

Demo UI default:

```text
Bahasa Indonesia
```

or a polished Indonesian-first interface.

English can remain for selected common hospitality labels if visually appropriate, but avoid random mixing.

Recommended final:

```text
Primary UI copy:
Bahasa Indonesia

Brand/marketing headline:
may use English sparingly
```

---

# 167. Currency Formatting

Display:

```text
Rp850.000
```

Avoid:

```text
Rp 850,000.00
```

for Indonesian customer UI.

---

# 168. Booking ID Styling

Use monospace/semibold:

```text
GLP-260830-001234
```

with copy action admin.

---

# 169. Status Copy Customer

Internal:

```text
PARTIALLY_PAID
```

Customer-facing:

```text
DP Sudah Dibayar
```

Admin can show:

```text
Partially Paid
```

or Indonesian equivalent.

---

# 170. Customer Payment Status Labels

Recommended:

```text
UNPAID
Belum Dibayar

PENDING
Menunggu Pembayaran

PARTIALLY_PAID
DP Sudah Dibayar

PAID
Lunas

FAILED
Pembayaran Gagal

EXPIRED
Pembayaran Kedaluwarsa
```

---

# 171. Customer Booking Status Labels

```text
WAITING_PAYMENT
Menunggu Pembayaran

CONFIRMED
Booking Dikonfirmasi

CHECKED_IN
Sudah Check-In

CHECKED_OUT
Sudah Check-Out

CANCELLED
Dibatalkan

EXPIRED
Booking Kedaluwarsa
```

---

# 172. Confirmation Feedback

Every significant mutation must produce immediate visible feedback.

Examples:

```text
Booking created
Payment verified
Check-in successful
Check-out successful
Block created
Price updated
```

---

# 173. Optimistic UI

Allowed for:

```text
filter toggle
accordion
local selection
```

Not allowed for:

```text
payment success
booking confirmation
check-in
check-out
cancel
inventory block final state
```

---

# 174. Animation — Landing

Allowed:

- image reveal,
- text fade/slide,
- section stagger subtle,
- hover image scale.

Do not animate every card into view dramatically.

---

# 175. Animation — Admin

Minimal.

Allowed:

- dropdown,
- dialog,
- sheet,
- table state,
- chart transition,
- hover.

Admin should feel fast, not theatrical.

---

# 176. Responsive Booking Flow

Customer mobile flow should never require horizontal scrolling.

Summary may collapse into accordion where useful.

---

# 177. Sticky Mobile Booking CTA

Glamping/Jeep detail pages may use:

```text
Price
[ Book Now ]
```

sticky bottom bar.

Checkout page should not stack another sticky bar if it obstructs fields.

---

# 178. Mobile Payment Page

Payment CTA/QR should be first-class.

Do not shrink QR into tiny card.

---

# 179. Mobile Success

Critical information order:

```text
Success
Booking ID
Reservation
Paid
Remaining
Invoice
Actions
```

---

# 180. Desktop Customer Layout

Avoid placing everything inside centered cards.

Use:

- full-width hero,
- editorial section,
- contained booking components.

---

# 181. Card Radius

Customer:

moderate radius.

Admin:

smaller/moderate radius.

Avoid:

```text
rounded-3xl
```

on every single element.

---

# 182. Shadow Usage

Use subtle shadows only for:

- floating booking widget,
- dropdown,
- dialog,
- elevated cards.

Do not shadow every card.

---

# 183. Border Usage

Admin relies more on borders than shadows.

Customer hospitality pages can rely on spacing and surface contrast.

---

# 184. shadcn Usage

Allowed primitives:

```text
Button
Dialog
Sheet
Select
Popover
Calendar
Input
Textarea
Dropdown
Table
Tooltip
Badge
Tabs
Accordion
Skeleton
Sonner
```

But:

- modify spacing,
- typography,
- radius,
- variants,
- layout,
- visual context.

Do not ship default shadcn demo style.

---

# 185. Component Reuse Rule

Reuse behavior when appropriate.

Do not force visual reuse.

Example:

```text
Booking status badge
```

can be shared.

But:

```text
Glamping accommodation card
Jeep package card
```

must remain separate components.

---

# 186. Shared Customer Components

Potential:

```text
CurrencyAmount
BookingStatus
PaymentStatus
GuestCounter
DateRangePicker core logic
FormField
ApiErrorState
BookingLookup core behavior
```

---

# 187. Brand Components

Glamping:

```text
GlampingHero
StayCard
ExperienceSection
StayBookingCard
```

Jeep:

```text
JeepHero
AdventurePackageCard
RouteTimeline
JeepBookingWidget
```

---

# 188. Admin Components

```text
AdminShell
Sidebar
BusinessSwitcher
KpiCard
BookingTable
StatusBadge
PaymentSummary
BookingTimeline
CalendarGrid
InventoryBlockDialog
```

---

# 189. Page Title Pattern — Admin

Example:

```text
Bookings
Manage reservations across all businesses.
```

Heading:

```text
24–30px
```

not giant marketing heading.

---

# 190. Admin Content Width

Main content may use:

```text
max width 1600px
```

or fluid within viewport.

Dashboard/table benefits from width.

---

# 191. Destructive Color Rule

Red reserved primarily for:

```text
cancel
failure
critical conflict
```

Do not use red decoratively.

---

# 192. Success Color Rule

Green primarily for:

```text
success
paid
completed
```

Do not paint entire screen green.

---

# 193. Warning Color Rule

Amber:

```text
waiting
limited
review required
```

---

# 194. Business Differentiation in Admin

Use subtle labels:

```text
Glamping
Jeep
```

with icon or small accent.

Do not recolor entire dashboard based on business filter.

Admin remains one coherent product.

---

# 195. Demo Presentation Mode

The UI should support a smooth demo story.

Presenter should be able to:

```text
1. Open Glamping.
2. Search availability.
3. Book.
4. Pay DP.
5. Show success.
6. Open email/invoice.
7. Open Admin.
8. Find booking immediately.
9. Show payment.
10. Check-in.
11. Open Jeep.
12. Show different booking model.
```

No hidden technical steps should be required.

---

# 196. Demo Data Visual Consistency

Seed names, dates, prices, product names, and statuses must feel coherent.

Avoid obviously generated data like:

```text
Test User 1
Dummy Booking
Lorem Ipsum
```

---

# 197. Image Quality

Customer websites require high-quality images.

Avoid:

- stretched image,
- visible watermarks,
- extremely generic corporate stock,
- mismatched aspect ratios.

Images may initially be curated demo assets.

---

# 198. Placeholder Image Rule

Do not display:

```text
placeholder.svg
```

in client-facing demo.

If image unavailable, use intentional neutral fallback.

---

# 199. Copy Quality

Avoid generic AI-style copy:

```text
Experience the best glamping experience
with unforgettable memories.
```

Copy should be concise and specific.

---

# 200. CTA Language

Glamping:

```text
Cek Ketersediaan
Pilih Penginapan
Pesan Sekarang
Lanjut ke Pembayaran
```

Jeep:

```text
Lihat Paket
Cek Jeep Tersedia
Pesan Jeep
Mulai Petualangan
```

Admin:

```text
Check In
Check Out
Batalkan Booking
Block Unit
```

---

# 201. Customer Route UX Summary — Glamping

```text
/
↓
/availability
↓
/stay/[slug]
↓
/booking
↓
/booking/payment
↓
/booking/success

Optional later:
/booking/check
```

Flow may skip detail route depending entry point.

---

# 202. Customer Route UX Summary — Jeep

```text
/
↓
/packages/[slug]
↓
/availability
↓
/booking
↓
/booking/payment
↓
/booking/success

Optional:
/booking/check
```

---

# 203. Admin Route UX Summary

```text
/login
/dashboard

/bookings
/bookings/[bookingCode]

/calendar

/payments
/payments/[id]

/customers
/customers/[id]

/glamping
/jeep

/settings
```

Exact route names may be adapted.

---

# 204. Demo v1 UI — Must Be Fully Designed

The following cannot remain visually incomplete:

```text
Glamping Landing
Glamping Availability
Glamping Booking
Glamping Payment
Glamping Success

Jeep Landing
Jeep Package
Jeep Availability
Jeep Booking

Admin Login
Admin Overview
Booking List
Booking Detail
Calendar
Payment List
Customer List
```

---

# 205. Lower Priority UI

Can receive simpler design if timeline limited:

```text
Settings
Product edit
Payment detail
Customer detail
Inventory block history
```

Still must remain consistent.

---

# 206. No Obvious Placeholder Rule

Main demo flow cannot include:

```text
Coming Soon
Lorem Ipsum
TODO
Placeholder
Chart coming soon
```

---

# 207. Admin Login Page

Simple premium login screen.

Desktop composition:

```text
Left visual / brand panel
Right login form
```

or centered elevated panel.

No need registration.

Fields:

```text
Email
Password
```

---

# 208. Admin Login Copy

Example:

```text
Welcome back

Sign in to manage bookings
across your businesses.
```

---

# 209. Admin Login Error

Generic:

```text
Email atau password tidak valid.
```

Do not expose whether email exists.

---

# 210. Admin Session Expired

When session expires:

```text
Your session has expired.

Please sign in again.
```

Redirect to login preserving safe return URL.

---

# 211. Keyboard Shortcuts

Not required Demo v1.

Do not spend time on command palette.

---

# 212. Dark Mode

Not required Demo v1.

Do not implement unless time remains after core polish.

---

# 213. Multi-language

Not required.

Do not build i18n infrastructure solely for demo.

---

# 214. Print Styles

Invoice is PDF.

Customer webpage print styles not required.

---

# 215. SEO

Customer landing should have:

- metadata,
- title,
- description,
- OG image,
- semantic heading.

Admin:

```text
noindex
```

---

# 216. Page Performance UX

Use blur placeholder/optimized image.

Avoid layout shift from images.

Hero image should not block all text rendering.

---

# 217. Success Criteria — Glamping UI

- [ ] Visual identity feels premium hospitality.
- [ ] Hero has strong visual impact.
- [ ] Booking CTA obvious.
- [ ] Mobile booking flow is comfortable.
- [ ] Availability is easy to understand.
- [ ] Sold out state is clear.
- [ ] Pricing and DP are transparent.
- [ ] Payment state is understandable.
- [ ] Success page looks final.
- [ ] Invoice download is easy to find.
- [ ] No default template feel.

---

# 218. Success Criteria — Jeep UI

- [ ] Jeep has clearly different identity from Glamping.
- [ ] Hero communicates adventure.
- [ ] Packages are easy to compare.
- [ ] Route information is visually engaging.
- [ ] Date/slot selection is clear.
- [ ] Jeep availability is easy to understand.
- [ ] Quantity/guest relationship is clear.
- [ ] DP presentation is transparent.
- [ ] Mobile UX works.
- [ ] Website does not feel like recolored Glamping.

---

# 219. Success Criteria — Admin UI

- [ ] Sidebar hierarchy clear.
- [ ] Dashboard not cluttered.
- [ ] Business switcher easy to find.
- [ ] KPI meaning clear.
- [ ] Booking table scan-friendly.
- [ ] Statuses easy to distinguish.
- [ ] Booking detail feels complete.
- [ ] Payment and remaining amount prominent.
- [ ] Timeline easy to follow.
- [ ] Check-in action clear.
- [ ] Cancellation warning appropriate.
- [ ] Calendar easy to read.
- [ ] Empty/loading/error states designed.
- [ ] Dashboard does not feel like default shadcn.

---

# 220. Codex UI Rules

Codex must not:

- generate all pages with identical card layout,
- use default shadcn visual without customization,
- use gradient everywhere,
- create giant rounded cards everywhere,
- overuse shadows,
- overuse animations,
- use fake availability urgency,
- hide important price information,
- combine payment status and booking status,
- use only color to communicate status,
- build desktop-only customer flow,
- place all page content inside centered cards,
- create Glamping and Jeep using same hero composition,
- fill pages with generic lorem ipsum,
- create random copy without matching brand tone,
- use placeholder dashboard charts with no database data.

---

# 221. Codex Component Rule

Before making shared component, ask:

```text
Is the behavior shared?
```

not:

```text
Do these two components both happen to be cards?
```

Visual uniqueness is more important than forced reuse.

---

# 222. Codex Page Completion Rule

A page is not complete if it only handles happy path.

Critical page should address relevant:

```text
loading
success
error
empty
disabled
mobile
```

states.

---

# 223. UI Quality Gate

Before a UI milestone is marked complete:

```text
Desktop screenshot reviewed
Mobile screenshot reviewed
No horizontal overflow
No broken spacing
No placeholder text
No placeholder image
No inconsistent button variants
No raw API errors
No inaccessible dialog
No form without labels
No payment ambiguity
```

---

# 224. Demo Quality Review

Before client demo, manually test:

### Glamping

```text
375px mobile
768px tablet
1440px desktop
```

### Jeep

same.

### Admin

```text
1024px
1440px
1920px
```

---

# 225. Final UI Philosophy

Glamping should communicate:

> **comfort, nature, privacy, premium hospitality.**

Jeep should communicate:

> **adventure, confidence, excitement, professional tour operation.**

Admin should communicate:

> **clarity, control, efficiency, reliability.**

---

# 226. Definition of Done

UI/UX is considered ready for client demo when:

```text
Customer can complete booking
without needing explanation.

Customer clearly understands:
what they are booking,
when they are booking,
how much it costs,
how much DP is required,
how much remains,
whether payment succeeded.

Admin can immediately understand:
who booked,
which business,
when,
how much has been paid,
what remains,
booking status,
payment status,
what action should be taken next.
```

---

# 227. Documentation Status

After this document:

```text
PRD.md                    ✅
ARCHITECTURE.md           ✅
BUSINESS-RULES.md         ✅
DATABASE.md               ✅
API.md                    ✅
UI-UX-SPEC.md             ✅

DEMO-DATA.md              ← NEXT
IMPLEMENTATION-PLAN.md
AGENTS.md

CODING
```

Next document is:

```text
DEMO-DATA.md
```

It will define:

- demo business names,
- product names,
- prices,
- Glamping units,
- Jeep packages,
- Jeep fleet,
- departure slots,
- seeded customers,
- seeded bookings,
- seeded payments,
- dashboard revenue,
- upcoming bookings,
- invoice examples,
- admin account,
- demo dates,
- realistic activity timeline,
- demo presentation scenario.

The goal is to ensure the first time the system runs, it already feels like a living operational product rather than an empty new installation.
