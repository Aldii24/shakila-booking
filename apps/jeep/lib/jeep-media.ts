export const jeepMedia = {
  hero: "/media/client/jeep-nepal-van-java.webp",
  trail: "/media/client/jeep-trail.webp",
  fleet: "/media/client/jeep-fleet.webp",
} as const;

export function jeepPackageImage(slug: string) {
  if (slug.startsWith("medium")) return jeepMedia.trail;
  if (slug.startsWith("long")) return jeepMedia.hero;
  return jeepMedia.fleet;
}
