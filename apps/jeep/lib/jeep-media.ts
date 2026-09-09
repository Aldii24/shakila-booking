export const jeepMedia = {
  hero: "/media/client/landscape-hero.png",
  trail: "/media/client/jeep-tour-1.jpeg",
  fleet: "/media/client/jeep-tour-2.jpeg",
  gallery: [
    {
      src: "/media/client/jeep-tour-1.jpeg",
      alt: "Jeep Shakila melintas di lanskap Nepal van Java",
      label: "Di jalur",
    },
    {
      src: "/media/client/jeep-tour-2.jpeg",
      alt: "Armada Jeep Shakila dengan latar pegunungan",
      label: "Armada",
    },
    {
      src: "/media/client/jeep-tour-4.jpeg",
      alt: "Rombongan wisata Jeep Shakila di Nepal van Java",
      label: "Bersama",
    },
  ],
  videos: [
    {
      src: "/media/client/jeep-convoy.mp4",
      poster: "/media/client/jeep-convoy-poster.jpg",
      title: "Konvoi menuju lanskap",
      description: "Ikuti irama perjalanan rombongan Jeep Shakila dari jalan desa menuju lereng.",
    },
    {
      src: "/media/client/jeep-landscape.mp4",
      poster: "/media/client/jeep-landscape-poster.jpg",
      title: "Nepal van Java dari udara",
      description: "Lanskap pertanian dan pegunungan yang menjadi bagian dari perjalanan.",
    },
  ],
} as const;

export function jeepPackageImage(slug: string) {
  if (slug.startsWith("medium")) return jeepMedia.trail;
  if (slug.startsWith("long")) return jeepMedia.hero;
  return jeepMedia.fleet;
}
