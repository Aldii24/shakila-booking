import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminRoot } from "@/components/admin-app";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Booking Admin",
  description: "Central booking administration",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body><TooltipProvider><AdminRoot>{children}</AdminRoot></TooltipProvider></body>
    </html>
  );
}
