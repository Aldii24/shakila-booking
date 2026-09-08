type CatalogPackageBase = {
  slug: string;
  name: string;
  priceAmountIdr: number;
  description: string;
  stops: readonly string[];
  inclusions: readonly string[];
  exclusions: readonly string[];
};

export type StandaloneJeepPackage = CatalogPackageBase & {
  kind: "JEEP_ONLY";
  category: "Paket Pendek" | "Paket Menengah" | "Paket Panjang";
};

export type TourStayPackage = CatalogPackageBase & {
  kind: "TOUR_STAY";
  category: "Paket Tour & Stay";
  bundleName: "Family Adventure - Deluxe" | "Group Adventure - Twin Bed";
  routeName: "Medium 2" | "Medium 1" | "Long 1" | "Long 2";
  badge: "Paket Awal" | "Paling Populer" | "Nilai Terbaik" | "Pengalaman Lengkap";
  capacity: string;
  composition: readonly string[];
  displayedPerPersonAmountIdr: number;
  displayedPerPersonUnit: "peserta*" | "orang*";
  importantInformation: readonly string[];
};

export type JeepCatalogPackage = StandaloneJeepPackage | TourStayPackage;

const routes = {
  "medium-2": ["Nepal Van Java", "Silancur Highland", "Wanamukti"],
  "medium-1": ["Nepal Van Java", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur", "Air Terjun / Hutan Pinus"],
  "long-1": ["Nepal Van Java", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur", "Air Terjun", "Hutan Pinus"],
  "long-2": ["Nepal Van Java", "Silancur Highland", "Air Terjun / Hutan Pinus", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur"],
} as const;

const standaloneInclusions = ["Sewa Jeep wisata sesuai rute paket"] as const;
const standaloneExclusions = ["Tiket masuk destinasi wisata"] as const;
const tourStayInclusions = [
  "1 unit Jeep sesuai rute paket",
  "1 malam penginapan sesuai tipe kamar",
  "Sarapan untuk 4 tamu",
  "1 kali makan untuk 4 tamu",
  "Tiket wisata sesuai jumlah titik pada rute paket",
  "Ojek wisata pulang-pergi jika rute melewati destinasi yang membutuhkan ojek",
] as const;
const longRouteInclusion = "Tambahan makan siang untuk 4 tamu";
const tourStayImportantInformation = [
  "Harga berlaku untuk 1 booking paket dan kapasitas maksimal sesuai tipe kamar",
  "Harga dapat disesuaikan jika tarif resmi destinasi berubah",
  "Ketersediaan kamar dan Jeep mengikuti tanggal booking",
] as const;

export const jeepBrochurePath = "/brosur/price-list-paket-tour-shakila.pdf";

export const jeepCatalogPackages: readonly StandaloneJeepPackage[] = [
  {
    kind: "JEEP_ONLY",
    slug: "short-1",
    name: "Paket Pendek 1",
    category: "Paket Pendek",
    priceAmountIdr: 400000,
    description: "Paket sewa Jeep wisata dengan rute Nepal Van Java, Jalan Viral Sukoyoso, dan Negeri Sayur Sukomakmur.",
    stops: ["Nepal Van Java", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
  {
    kind: "JEEP_ONLY",
    slug: "short-2",
    name: "Paket Pendek 2",
    category: "Paket Pendek",
    priceAmountIdr: 500000,
    description: "Paket sewa Jeep wisata dengan rute Nepal Van Java, Jalan Viral Sukoyoso, serta Air Terjun atau Hutan Pinus.",
    stops: ["Nepal Van Java", "Jalan Viral Sukoyoso", "Air Terjun / Hutan Pinus"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
  {
    kind: "JEEP_ONLY",
    slug: "medium-1",
    name: "Paket Menengah 1",
    category: "Paket Menengah",
    priceAmountIdr: 650000,
    description: "Paket sewa Jeep wisata dengan empat titik rute dari Nepal Van Java hingga Air Terjun atau Hutan Pinus.",
    stops: routes["medium-1"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
  {
    kind: "JEEP_ONLY",
    slug: "medium-2",
    name: "Paket Menengah 2",
    category: "Paket Menengah",
    priceAmountIdr: 650000,
    description: "Paket sewa Jeep wisata menuju Nepal Van Java, Silancur Highland, dan Wanamukti.",
    stops: routes["medium-2"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
  {
    kind: "JEEP_ONLY",
    slug: "long-1",
    name: "Paket Panjang 1",
    category: "Paket Panjang",
    priceAmountIdr: 850000,
    description: "Paket sewa Jeep wisata dengan lima titik rute, termasuk Air Terjun dan Hutan Pinus sebagai tujuan terpisah.",
    stops: routes["long-1"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
  {
    kind: "JEEP_ONLY",
    slug: "long-2",
    name: "Paket Panjang 2",
    category: "Paket Panjang",
    priceAmountIdr: 1000000,
    description: "Paket sewa Jeep wisata dengan lima titik rute melalui Nepal Van Java, Silancur Highland, dan kawasan Sukomakmur.",
    stops: routes["long-2"],
    inclusions: standaloneInclusions,
    exclusions: standaloneExclusions,
  },
] as const;

const routeOptions = [
  { key: "medium-2", name: "Medium 2", badge: "Paket Awal" },
  { key: "medium-1", name: "Medium 1", badge: "Paling Populer" },
  { key: "long-1", name: "Long 1", badge: "Nilai Terbaik" },
  { key: "long-2", name: "Long 2", badge: "Pengalaman Lengkap" },
] as const;

const bundleOptions = [
  {
    key: "family-deluxe",
    name: "Family Adventure - Deluxe",
    capacity: "Maksimal 2 dewasa dan 2 anak di bawah 10 tahun",
    composition: ["1 kamar Deluxe", "1 Jeep"],
    participantUnit: "peserta*",
    prices: { "medium-2": 1799000, "medium-1": 1999000, "long-1": 2349000, "long-2": 2549000 },
    equivalents: { "medium-2": 449750, "medium-1": 499750, "long-1": 587250, "long-2": 637250 },
  },
  {
    key: "group-twin-bed",
    name: "Group Adventure - Twin Bed",
    capacity: "Maksimal 4 dewasa",
    composition: ["1 kamar Twin Bed", "1 Jeep"],
    participantUnit: "orang*",
    prices: { "medium-2": 1899000, "medium-1": 2099000, "long-1": 2449000, "long-2": 2649000 },
    equivalents: { "medium-2": 474750, "medium-1": 524750, "long-1": 612250, "long-2": 662250 },
  },
] as const;

export const tourStayCatalogPackages: readonly TourStayPackage[] = bundleOptions.flatMap((bundle) =>
  routeOptions.map((route) => ({
    kind: "TOUR_STAY" as const,
    slug: `tour-stay-${bundle.key}-${route.key}`,
    name: `${bundle.name} - ${route.name}`,
    category: "Paket Tour & Stay" as const,
    bundleName: bundle.name,
    routeName: route.name,
    badge: route.badge,
    priceAmountIdr: bundle.prices[route.key],
    displayedPerPersonAmountIdr: bundle.equivalents[route.key],
    displayedPerPersonUnit: bundle.participantUnit,
    capacity: bundle.capacity,
    composition: bundle.composition,
    description: `${bundle.name} dengan perjalanan Jeep rute ${route.name}, mulai satu malam menginap dengan pilihan tambah malam, makan, tiket wisata, dan ojek sesuai ketentuan rute.`,
    stops: routes[route.key],
    inclusions: route.key.startsWith("long") ? [...tourStayInclusions, longRouteInclusion] : tourStayInclusions,
    exclusions: [],
    importantInformation: tourStayImportantInformation,
  })),
);

export const allJeepCatalogPackages: readonly JeepCatalogPackage[] = [
  ...tourStayCatalogPackages,
  ...jeepCatalogPackages,
];

export function getJeepCatalogPackage(slug: string) {
  return allJeepCatalogPackages.find((item) => item.slug === slug);
}

export function getTourStayBookingUrl(item: TourStayPackage) {
  const accommodationWebsite = process.env.NEXT_PUBLIC_GLAMPING_URL ?? "http://localhost:3000";
  return `${accommodationWebsite}/bundles/${item.slug.replace(/^tour-stay-/, "")}`;
}
