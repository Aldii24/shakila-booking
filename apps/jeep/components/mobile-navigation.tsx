"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

type MenuItem = { href: string; label: string };

export function MobileNavigation({ items, business }: { items: MenuItem[]; business: string }) {
  const [open, setOpen] = useState(false);
  const follow = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && window.location.pathname === "/") {
      event.preventDefault();
      setOpen(false);
      const id = href.slice(2);
      window.setTimeout(() => {
        window.history.replaceState(null, "", href);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 320);
      return;
    }
    setOpen(false);
  };
  return <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
    <DialogPrimitive.Trigger className="premium-menu-trigger" data-open={open} aria-label="Buka menu navigasi">
      <span className="menu-line menu-line-one"/><span className="menu-line menu-line-two"/>
    </DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="premium-menu-overlay"/>
      <DialogPrimitive.Content className="premium-menu-panel" onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogPrimitive.Title className="sr-only">Navigasi Shakila {business}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Pilih halaman atau lanjutkan reservasi Shakila.</DialogPrimitive.Description>
        <div className="premium-menu-top"><Image src="/shakila-logo-transparent.png" alt="Shakila Group" width={128} height={84}/><DialogPrimitive.Close className="premium-menu-close" aria-label="Tutup menu"><i/><i/><span>TUTUP</span></DialogPrimitive.Close></div>
        <div className="premium-menu-body"><p>{business}<br/><em>Nepal van Java</em></p><nav className="premium-menu-links">{items.slice(0,-1).map((item, index) => <Link href={item.href} onClick={(event) => follow(event, item.href)} key={item.href}><small>0{index + 1}</small><span>{item.label}</span><ArrowRight/></Link>)}</nav></div>
        <div className="premium-menu-bottom"><Link href="/availability" onClick={() => setOpen(false)}>MULAI RESERVASI <ArrowRight/></Link><span>NEPAL VAN JAVA · INDONESIA</span></div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
