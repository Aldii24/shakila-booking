export type BundleCatalogItem = {
  slug: string;
  name: string;
  familyName: string;
  routeName: string;
  roomName: "Deluxe" | "Twin Bed";
  price: number;
  additionalNightPrice: number;
  capacity: string;
  routes: readonly string[];
  inclusions: readonly string[];
  conditions: readonly string[];
};

const routes = {
  "medium-2": ["Nepal Van Java", "Silancur Highland", "Wanamukti"],
  "medium-1": ["Nepal Van Java", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur", "Air Terjun / Hutan Pinus"],
  "long-1": ["Nepal Van Java", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur", "Air Terjun", "Hutan Pinus"],
  "long-2": ["Nepal Van Java", "Silancur Highland", "Air Terjun / Hutan Pinus", "Jalan Viral Sukoyoso", "Negeri Sayur Sukomakmur"],
} as const;
const routeNames = { "medium-2": "Medium 2", "medium-1": "Medium 1", "long-1": "Long 1", "long-2": "Long 2" } as const;
const common = ["1 unit Jeep sesuai rute paket", "1 malam penginapan sesuai tipe kamar", "Sarapan untuk 4 tamu", "1 kali makan untuk 4 tamu", "Tiket wisata sesuai jumlah titik pada rute paket", "Ojek wisata pulang-pergi jika rute membutuhkan ojek"] as const;
const conditions = ["Harga berlaku untuk 1 booking paket dan kapasitas maksimal sesuai tipe kamar", "Paket mencakup 1 malam dan 1 kali tour Jeep; malam tambahan mengikuti tarif kamar", "Harga dapat disesuaikan jika tarif resmi destinasi berubah", "Ketersediaan kamar mengikuti seluruh rentang menginap dan Jeep mengikuti tanggal tour"] as const;
const families = [
  { key: "family-deluxe", name: "Family Adventure - Deluxe", roomName: "Deluxe" as const, additionalNightPrice: 550000, capacity: "Maksimal 2 dewasa dan 2 anak di bawah 10 tahun", prices: { "medium-2": 1799000, "medium-1": 1999000, "long-1": 2349000, "long-2": 2549000 } },
  { key: "group-twin-bed", name: "Group Adventure - Twin Bed", roomName: "Twin Bed" as const, additionalNightPrice: 600000, capacity: "Maksimal 4 dewasa", prices: { "medium-2": 1899000, "medium-1": 2099000, "long-1": 2449000, "long-2": 2649000 } },
] as const;

export const bundleCatalog: readonly BundleCatalogItem[] = families.flatMap((family) =>
  (Object.keys(routes) as (keyof typeof routes)[]).map((route) => ({
    slug: `${family.key}-${route}`,
    name: `${family.name} - ${routeNames[route]}`,
    familyName: family.name,
    routeName: routeNames[route],
    roomName: family.roomName,
    price: family.prices[route],
    additionalNightPrice: family.additionalNightPrice,
    capacity: family.capacity,
    routes: routes[route],
    inclusions: route.startsWith("long") ? [...common, "Tambahan makan siang untuk 4 tamu"] : common,
    conditions,
  })),
);

export const getBundleCatalogItem = (slug: string) => bundleCatalog.find((item) => item.slug === slug);
