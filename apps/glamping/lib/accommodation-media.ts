export type AccommodationKind = "GLAMPING" | "HOMESTAY";

export type AccommodationMedia = {
  kind: AccommodationKind;
  label: string;
  hero: string;
  photos: string[];
  video: string;
  poster: string;
};

const mediaRoot = "/media/client";

export const accommodationMedia: Record<string, AccommodationMedia> = {
  "glamping-deluxe": {
    kind: "GLAMPING",
    label: "Deluxe",
    hero: `${mediaRoot}/glamping/deluxe/2502.webp`,
    photos: [
      `${mediaRoot}/glamping/deluxe/2502.webp`,
      `${mediaRoot}/glamping/deluxe/2359.webp`,
      `${mediaRoot}/glamping/deluxe/2361.webp`,
      `${mediaRoot}/glamping/deluxe/2369.webp`,
      `${mediaRoot}/glamping/deluxe/2370.webp`,
      `${mediaRoot}/glamping/deluxe/2371.webp`,
      `${mediaRoot}/glamping/deluxe/2503.webp`,
    ],
    video: `${mediaRoot}/video/glamping-deluxe.mp4`,
    poster: `${mediaRoot}/video/glamping-deluxe-poster.webp`,
  },
  "glamping-twin-bed": {
    kind: "GLAMPING",
    label: "Twin Bed",
    hero: `${mediaRoot}/glamping/twin-bed/2349.webp`,
    photos: [
      `${mediaRoot}/glamping/twin-bed/2349.webp`,
      `${mediaRoot}/glamping/twin-bed/2343.webp`,
      `${mediaRoot}/glamping/twin-bed/2347.webp`,
      `${mediaRoot}/glamping/twin-bed/2348.webp`,
      `${mediaRoot}/glamping/twin-bed/2351.webp`,
      `${mediaRoot}/glamping/twin-bed/2371.webp`,
    ],
    video: `${mediaRoot}/video/glamping-twin-bed.mp4`,
    poster: `${mediaRoot}/video/glamping-twin-bed-poster.webp`,
  },
  "homestay-standard": {
    kind: "HOMESTAY",
    label: "Standard",
    hero: `${mediaRoot}/homestay/standard/2505.webp`,
    photos: [
      `${mediaRoot}/homestay/standard/2505.webp`,
      `${mediaRoot}/homestay/standard/2504.webp`,
      `${mediaRoot}/homestay/standard/2506.webp`,
      `${mediaRoot}/homestay/standard/2508.webp`,
    ],
    video: `${mediaRoot}/video/homestay.mp4`,
    poster: `${mediaRoot}/video/homestay-poster.webp`,
  },
  "homestay-superior": {
    kind: "HOMESTAY",
    label: "Superior",
    hero: `${mediaRoot}/homestay/superior/2395.webp`,
    photos: [
      `${mediaRoot}/homestay/superior/2395.webp`,
      `${mediaRoot}/homestay/superior/2371.webp`,
      `${mediaRoot}/homestay/superior/2402.webp`,
      `${mediaRoot}/homestay/superior/2403.webp`,
      `${mediaRoot}/homestay/superior/2426.webp`,
      `${mediaRoot}/homestay/superior/2427.webp`,
      `${mediaRoot}/homestay/superior/2429.webp`,
    ],
    video: `${mediaRoot}/video/homestay.mp4`,
    poster: `${mediaRoot}/video/homestay-poster.webp`,
  },
  "homestay-twin-bed": {
    kind: "HOMESTAY",
    label: "Twin Bed",
    hero: `${mediaRoot}/homestay/twin-bed/2501.webp`,
    photos: [
      `${mediaRoot}/homestay/twin-bed/2501.webp`,
      `${mediaRoot}/homestay/twin-bed/2409.webp`,
      `${mediaRoot}/homestay/twin-bed/2414.webp`,
      `${mediaRoot}/homestay/twin-bed/2506.webp`,
      `${mediaRoot}/homestay/twin-bed/2507.webp`,
      `${mediaRoot}/homestay/twin-bed/2508.webp`,
    ],
    video: `${mediaRoot}/video/homestay.mp4`,
    poster: `${mediaRoot}/video/homestay-poster.webp`,
  },
};

export const accommodationGroups = [
  {
    kind: "GLAMPING" as const,
    title: "Glamping",
    description: "Dome privat dengan panorama pegunungan dan sarapan untuk dua tamu.",
    slugs: ["glamping-deluxe", "glamping-twin-bed"],
  },
  {
    kind: "HOMESTAY" as const,
    title: "Homestay",
    description: "Kamar hangat dan bersahaja untuk masa inap yang praktis di Nepal Van Java.",
    slugs: ["homestay-standard", "homestay-superior", "homestay-twin-bed"],
  },
];

export function accommodationKindFromSlug(slug: string): AccommodationKind {
  return slug.startsWith("homestay-") ? "HOMESTAY" : "GLAMPING";
}

export function getAccommodationMedia(slug: string): AccommodationMedia {
  return accommodationMedia[slug] ?? accommodationMedia["glamping-deluxe"]!;
}
