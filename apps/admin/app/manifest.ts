import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shakila Group Admin",
    short_name: "Shakila Admin",
    description: "Operasional booking Shakila Group",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7f6f1",
    theme_color: "#173b2a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
