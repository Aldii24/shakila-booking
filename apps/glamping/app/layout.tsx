import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./media.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {default:"Shakila Glamping",template:"%s · Shakila Glamping"},
  description: "Glamping premium di dataran tinggi Bromo—hangat, tenang, dan dekat dengan fajar.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
