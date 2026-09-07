# Shakila Client Catalog

Ingestion date: 2026-09-06 (Asia/Jakarta)

Jeep package reinspection: 2026-09-07 (Asia/Jakarta). Both pages of the primary PDF and the complete Jeep PNG were re-read for the customer-facing package update.

Scope: client-data ingestion only. This document does not change the application, database, booking logic, or existing milestone requirements.

## Data labels

- `CONFIRMED_CLIENT_DATA`: explicitly confirmed by the client context supplied for this ingestion.
- `SOURCE_DERIVED_DATA`: transcribed or normalized directly from the supplied local files.
- `TEMP_DEMO_DATA`: temporary demo value explicitly authorized for later replacement.
- `MISSING_OR_UNCERTAIN_DATA`: absent, conflicting, or not specific enough to normalize safely.

## Source inventory

| Source | Inspection result |
| --- | --- |
| `C:\Downloads\SHAKILAGRUP\GLAMPING` | 1 catalog PNG, 13 room photos, 2 MP4 videos |
| `C:\Downloads\SHAKILAGRUP\HOMESTAY` | 1 catalog PNG, 17 room/property photos, 1 MP4 video |
| `C:\Downloads\SHAKILAGRUP\JEEP` | 1 catalog PNG; no separate destination photos or videos |
| `C:\Downloads\SHAKILAGRUP\Price_List_Paket_Tour_Shakila_Untuk_Tamu.pdf` | 2-page primary Jeep/Tour & Stay price list |
| `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg` | Confirmed client logo |

## Brand and contact data

- Logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg` — `CONFIRMED_CLIENT_DATA`.
- Brand name shown in supplied assets: Shakila / Shakila Group — `SOURCE_DERIVED_DATA`.
- Logo descriptor: `CAFE • PENGINAPAN • TOUR JEEP` — `SOURCE_DERIVED_DATA`.
- Glamping catalog contact: `0878-2000-4830`, Instagram `@shakila.glamping` — `SOURCE_DERIVED_DATA` from `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping.png`.
- Jeep PNG contact: `0878-2000-4830`, `www.shakilagrup.com`, Instagram `@shakila.jeep` — `SOURCE_DERIVED_DATA` from `C:\Downloads\SHAKILAGRUP\JEEP\pricelist.png`.
- Primary Jeep PDF contact: `0851-4835-7152`, presented as Booking & Information / WhatsApp — `SOURCE_DERIVED_DATA`.
- The two Jeep contact numbers conflict; no preferred current number was provided — `MISSING_OR_UNCERTAIN_DATA`.
- The supplied sources do not provide a complete street address — `MISSING_OR_UNCERTAIN_DATA`. `Nepal Van Java` is preserved only as source location text, not normalized as an address.

## Glamping

Primary catalog source: `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping.png`.

The supplied confirmation establishes Deluxe and Twin Bed as the Glamping room types and provides their nightly prices.

| Type | Physical rooms | Breakfast | Price | Guest capacity |
| --- | ---: | --- | --- | --- |
| Deluxe | 2 — `CONFIRMED_CLIENT_DATA` | Included for 2 pax — `CONFIRMED_CLIENT_DATA` | Rp550.000/malam — `CONFIRMED_CLIENT_DATA` | Not supplied; bed type and breakfast count are not treated as capacity — `MISSING_OR_UNCERTAIN_DATA` |
| Twin Bed | 4 — `CONFIRMED_CLIENT_DATA` | Included for 2 pax — `CONFIRMED_CLIENT_DATA` | Rp600.000/malam — `CONFIRMED_CLIENT_DATA` | Not supplied; bed type and breakfast count are not treated as capacity — `MISSING_OR_UNCERTAIN_DATA` |

### Deluxe

Canonical name: Deluxe — `CONFIRMED_CLIENT_DATA`. The catalog image displays `DELUXE ROOM` — `SOURCE_DERIVED_DATA`.

Facilities transcribed from the catalog image — `SOURCE_DERIVED_DATA`:

- Tempat tidur Queen Size
- Kamar mandi dalam
- Air panas (Water Heater)
- Smart TV
- Wi-Fi Gratis
- Perlengkapan mandi
- Kopi & Teh Gratis
- Teras pribadi dengan pemandangan alam
- Breakfast for 2 pax — `CONFIRMED_CLIENT_DATA` addition requested for this ingestion

Exact media mapping:

- Catalog image: `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping.png`
- Photos:
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2359.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2361.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2369.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2370.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2371.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2502.jpg`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\Glamping Deluxe\IMG_2503.jpg`
- Video: `C:\Downloads\SHAKILAGRUP\GLAMPING\GLAMPING DELUXE.mp4` — H.264/AAC, 2560×1440, 50 fps, 32.54 seconds.
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

### Twin Bed

Canonical name: Twin Bed — `CONFIRMED_CLIENT_DATA`.

Facilities transcribed from the catalog image — `SOURCE_DERIVED_DATA`:

- Tempat tidur Double
- Kamar mandi dalam
- Air panas (Water Heater)
- Smart TV
- Wi-Fi Gratis
- Perlengkapan mandi
- Kopi & Teh Gratis
- Teras pribadi dengan pemandangan alam
- Breakfast for 2 pax — `CONFIRMED_CLIENT_DATA` addition requested for this ingestion

Exact media mapping:

- Catalog image: `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping.png`
- Photos:
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2343.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2347.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2348.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2349.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2351.HEIC`
  - `C:\Downloads\SHAKILAGRUP\GLAMPING\glamping twin\IMG_2371.HEIC`
- Video: `C:\Downloads\SHAKILAGRUP\GLAMPING\GLAMPING TWIN BED.mp4` — H.264/AAC, 2560×1440, 30 fps, 24.533 seconds.
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

Glamping marketing copy in the source describes a comfortable mountain stay with fresh air for families and couples — `SOURCE_DERIVED_DATA`. This is preserved as source copy, not independently verified.

## Homestay

Primary catalog source: `C:\Downloads\SHAKILAGRUP\HOMESTAY\pricelist.png`.

| Type | Physical rooms | Price | Capacity |
| --- | ---: | ---: | --- |
| Standard | 1 — `CONFIRMED_CLIENT_DATA` | Rp250.000/malam — `SOURCE_DERIVED_DATA` | 2 adults — `SOURCE_DERIVED_DATA` |
| Superior | 3 — `CONFIRMED_CLIENT_DATA` | Rp300.000/malam — `SOURCE_DERIVED_DATA` | 2 adults — `SOURCE_DERIVED_DATA` |
| Twin Bed | 1 — `CONFIRMED_CLIENT_DATA` | Rp400.000/malam — `SOURCE_DERIVED_DATA` | Not supplied — `MISSING_OR_UNCERTAIN_DATA` |

The poster presents these as shared Homestay facilities without item-specific distinctions — `SOURCE_DERIVED_DATA`:

- Kamar Mandi Dalam
- Air Hangat
- TV
- Free Wifi
- Welcome Drink
- Peralatan Mandi
- Menu Makan
- `Sarapan/kamar 2` (preserved literally; whether `2` means pax, portions, or another unit is `MISSING_OR_UNCERTAIN_DATA`)
- Rooftop

Standard and Superior have a stated maximum of 2 adults. More than 2 requires an extra bed at Rp100.000 — `SOURCE_DERIVED_DATA`. The source does not state that this rule applies to Twin Bed.

The poster also advertises Jeep/ojek tourism packages and pickup from airport, terminal, and station, but provides no prices, service boundaries, or pickup locations — `SOURCE_DERIVED_DATA` with missing details marked `MISSING_OR_UNCERTAIN_DATA`.

### Standard

Exact media mapping:

- Catalog image: `C:\Downloads\SHAKILAGRUP\HOMESTAY\pricelist.png`
- Photos:
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay standart\IMG_2504.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay standart\IMG_2505.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay standart\IMG_2506.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay standart\IMG_2508.jpg`
- Shared property video: `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay.mp4` — item-specific assignment is not stated in the filename; `MISSING_OR_UNCERTAIN_DATA`.
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

### Superior

Exact media mapping:

- Catalog image: `C:\Downloads\SHAKILAGRUP\HOMESTAY\pricelist.png`
- Photos:
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2371.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2395.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2402.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2403.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2426.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2427.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay Superior\IMG_2429.HEIC`
- Shared property video: `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay.mp4` — item-specific assignment is not stated in the filename; `MISSING_OR_UNCERTAIN_DATA`.
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

### Twin Bed

Exact media mapping:

- Catalog image: `C:\Downloads\SHAKILAGRUP\HOMESTAY\pricelist.png`
- Photos:
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2409.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2414.HEIC`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2501.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2506.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2507.jpg`
  - `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay TwinBed\IMG_2508.jpg`
- Shared property video: `C:\Downloads\SHAKILAGRUP\HOMESTAY\Homestay.mp4` — item-specific assignment is not stated in the filename; `MISSING_OR_UNCERTAIN_DATA`.
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

Shared Homestay video metadata: H.264/AAC, 2560×1440, 30 fps, 32.533 seconds.

The source claim places the Homestay around Nepal Van Java and mountains Sumbing, Merapi, Merbabu, Kunci, and Tidar — `SOURCE_DERIVED_DATA`. No precise address was supplied.

## Jeep and Tour packages

Primary source: `C:\Downloads\SHAKILAGRUP\Price_List_Paket_Tour_Shakila_Untuk_Tamu.pdf`.

Cross-reference source: `C:\Downloads\SHAKILAGRUP\JEEP\pricelist.png`.

Customer website brochure copy: `apps/jeep/public/brosur/price-list-paket-tour-shakila.pdf`. This is a byte-identical temporary web copy of the primary PDF, exposed at `/brosur/price-list-paket-tour-shakila.pdf`; the runtime does not reference `C:\Downloads`.

### Physical inventory

- Physical Jeep count: 12 — `CONFIRMED_CLIENT_DATA`.
- Jeep does not have a vehicle type or class. Products are differentiated by tour package, not by vehicle category — `CONFIRMED_CLIENT_DATA`.
- All tour packages draw from the same shared pool of 12 physical Jeep units — `CONFIRMED_CLIENT_DATA`.
- Individual unit identities were not supplied; demo unit codes are operational identifiers only and do not create Jeep types or classes.

### Primary Tour & Stay bundles

Family Adventure - Deluxe capacity and composition — `SOURCE_DERIVED_DATA`:

- Maximum 2 adults + 2 children under 10 years.
- 1 Deluxe room.
- 1 Jeep.

Group Adventure - Twin Bed capacity and composition — `SOURCE_DERIVED_DATA`:

- Maximum 4 adults.
- 1 Twin Bed room.
- 1 Jeep.

| Bundle | Route package | Source label | Package price | Displayed per-person equivalent |
| --- | --- | --- | ---: | ---: |
| Family Adventure - Deluxe | Medium 2 | Entry Package | Rp1.799.000 | Rp449.750/peserta* |
| Family Adventure - Deluxe | Medium 1 | Most Popular | Rp1.999.000 | Rp499.750/peserta* |
| Family Adventure - Deluxe | Long 1 | Best Value | Rp2.349.000 | Rp587.250/peserta* |
| Family Adventure - Deluxe | Long 2 | Complete Experience | Rp2.549.000 | Rp637.250/peserta* |
| Group Adventure - Twin Bed | Medium 2 | Entry Package | Rp1.899.000 | Rp474.750/orang* |
| Group Adventure - Twin Bed | Medium 1 | Most Popular | Rp2.099.000 | Rp524.750/orang* |
| Group Adventure - Twin Bed | Long 1 | Best Value | Rp2.449.000 | Rp612.250/orang* |
| Group Adventure - Twin Bed | Long 2 | `COMPLETE EXPEROENCE` in source | Rp2.649.000 | Rp662.250/orang* |

All table values are `SOURCE_DERIVED_DATA`. The asterisk attached to per-person equivalents is not explained in the PDF — `MISSING_OR_UNCERTAIN_DATA`.

All eight bundle combinations are direct bookable products on the accommodation website under **Paket Menginap + Jeep** and may also appear as cross-sell choices on the Jeep website. The PDF remains a supplementary brochure and is not the booking flow. Each bundle creates one booking and atomically reserves its source-defined room and Jeep resources. For the supplied packages, one package consumes one room of the mapped type and one Jeep from the shared pool of 12. Bundle availability is the lower of room availability and all-day Jeep availability for the selected date.

Client-confirmed stay extension rule (7 September 2026) — `CONFIRMED_CLIENT_DATA`: the package price includes one night and one Jeep tour. Customers may choose a later check-out date. The Jeep is reserved only once on the check-in/tour date, while every additional night is charged at the mapped room's nightly price: Rp550.000 for Deluxe or Rp600.000 for Twin Bed, per room per additional night. Room inventory must remain available for the complete `[check-in, check-out)` range.

Shared inclusions — `SOURCE_DERIVED_DATA`:

- 1 Jeep according to the selected route.
- 1 night of accommodation according to room type.
- Breakfast for 4 guests.
- 1 meal for 4 guests.
- Long 1 and Long 2 add lunch for 4 guests.
- Destination tickets according to the number of route points.
- Round-trip ojek where the route passes a destination that requires it.

Important conditions — `SOURCE_DERIVED_DATA`:

- Price applies to one package booking and the maximum capacity of its room type.
- Package price includes tickets according to the route; it may be adjusted if official destination tariffs change.
- Included ojek follows the route and the points that require ojek.
- Weekend/holiday surcharge: Rp50.000 per package.
- Room and Jeep availability follows the booking date.

Each of the eight bundle items maps to these exact source files:

- Primary document: `C:\Downloads\SHAKILAGRUP\Price_List_Paket_Tour_Shakila_Untuk_Tamu.pdf`
- Cross-reference catalog image: `C:\Downloads\SHAKILAGRUP\JEEP\pricelist.png`
- Separate package photos: none supplied — `MISSING_OR_UNCERTAIN_DATA`
- Package videos: none supplied — `MISSING_OR_UNCERTAIN_DATA`
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

### Route definitions

All route definitions are `SOURCE_DERIVED_DATA`.

- Medium 2 / Entry Package: Nepal Van Java → Silancur Highland → Wanamukti.
- Medium 1 / Most Popular: Nepal Van Java → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur → Air Terjun / Hutan Pinus.
- Long 1 / Best Value: Nepal Van Java → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur → Air Terjun → Hutan Pinus.
- Long 2 / Complete: Nepal Van Java → Silancur Highland → Air Terjun / Hutan Pinus → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur.

The slash in `Air Terjun / Hutan Pinus` is preserved exactly. Whether it means a choice, substitution, or combined stop is `MISSING_OR_UNCERTAIN_DATA`.

### Standalone Jeep packages from the cross-reference PNG

These are preserved separately from the PDF bundles because the PNG states standalone Jeep-tour prices and excludes destination tickets.

| Package | Price | Route |
| --- | ---: | --- |
| Short 1 | Rp400.000 | Nepal Van Java → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur |
| Short 2 | Rp500.000 | Nepal Van Java → Jalan Viral Sukoyoso → Air Terjun / Hutan Pinus |
| Medium 1 | Rp650.000 | Nepal Van Java → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur → Air Terjun / Hutan Pinus |
| Medium 2 | Rp650.000 | Nepal Van Java → Silancur Highland → Wanamukti |
| Long 1 | Rp850.000 | Nepal Van Java → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur → Air Terjun → Hutan Pinus |
| Long 2 | Rp1.000.000 | Nepal Van Java → Silancur Highland → Air Terjun / Hutan Pinus → Jalan Viral Sukoyoso → Negeri Sayur Sukomakmur |

All standalone package values are `SOURCE_DERIVED_DATA`. The exact per-unit price basis is not stated — `MISSING_OR_UNCERTAIN_DATA`. The PNG states that destination admission tickets are not included.

Customer-facing details shared by all six standalone packages:

- Included: sewa Jeep wisata according to the selected package route — `SOURCE_DERIVED_DATA` from the PNG heading and package presentation.
- Excluded: destination admission tickets — `SOURCE_DERIVED_DATA`, explicitly stated by the PNG.
- Duration, departure time, and passenger capacity are not stated — `MISSING_OR_UNCERTAIN_DATA`.
- All packages use the same shared pool of 12 Jeep units; there is no Jeep type/class — `CONFIRMED_CLIENT_DATA`.
- For capacity details or additional-unit needs, the customer-facing instruction is `Hubungi Admin` — `CONFIRMED_CLIENT_DATA`.

Each of the six standalone package items maps to:

- Catalog image: `C:\Downloads\SHAKILAGRUP\JEEP\pricelist.png`
- Route cross-reference document: `C:\Downloads\SHAKILAGRUP\Price_List_Paket_Tour_Shakila_Untuk_Tamu.pdf`
- Separate package photos: none supplied — `MISSING_OR_UNCERTAIN_DATA`
- Package videos: none supplied — `MISSING_OR_UNCERTAIN_DATA`
- Brand logo: `C:\PROJECTS\booking-demo\assets\shakila-logo.jpeg`

## Media integrity notes

- `IMG_2371.HEIC` is byte-identical in Glamping Deluxe, Glamping Twin Bed, and Homestay Superior folders. All exact paths are retained because the client supplied each mapping.
- `IMG_2506.jpg` and `IMG_2508.jpg` are byte-identical between Homestay Standard and Homestay Twin Bed folders. Both paths remain mapped to their supplied folders.
- Videos were inspected through metadata and representative frames at approximately 20%, 50%, and 80%; no frame-by-frame processing was performed.
- No source files were copied, renamed, recompressed, or modified.

## Known missing or uncertain data

- Glamping guest capacities.
- Homestay Twin Bed guest capacity.
- Meaning/unit of Homestay poster text `Sarapan/kamar 2`.
- Individual Jeep unit identities.
- Jeep departure slots and Jeep passenger capacity for standalone packages.
- Whether `Air Terjun / Hutan Pinus` denotes a choice or a combined stop.
- Current authoritative contact number where the Jeep PDF and PNG disagree.
- Complete street addresses.
- Separate Jeep destination photos and videos.
