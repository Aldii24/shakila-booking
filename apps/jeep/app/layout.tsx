import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./media.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {default:"Shakila Jeep Tour",template:"%s · Shakila Jeep Tour"},
  description: "Tur Jeep premium dengan perjalanan fajar dan petualangan privat.",
  icons: { icon: "/shakila-logo-transparent.png", apple: "/shakila-logo-transparent.png" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
