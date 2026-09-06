"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { useEffect, useState } from "react";

const menuItems = [{href:"/#stay",label:"Menginap"},{href:"/#experience",label:"Pengalaman"},{href:"/#faq",label:"Informasi"},{href:"/booking/check",label:"Cek Booking"},{href:"/availability",label:"Reservasi"}];

export function Header(){const [scrolled,setScrolled]=useState(false);useEffect(()=>{const update=()=>setScrolled(window.scrollY>28);update();window.addEventListener("scroll",update,{passive:true});return()=>window.removeEventListener("scroll",update)},[]);return <header className={`site-header${scrolled?" is-scrolled":""}`}><Link className="brand" href="/"><Image src="/shakila-logo-transparent.png" alt="Shakila Group" width={176} height={112} priority/></Link><nav className="brand-nav">{menuItems.slice(0,4).map(item=><Link href={item.href} key={item.href}>{item.label}</Link>)}</nav><div className="header-actions"><span className="business-label">AKOMODASI</span><Link className="header-book" href="/availability">RESERVASI <ArrowRight/></Link><MobileNavigation items={menuItems} business="AKOMODASI"/></div></header>}
export function Footer(){return <footer className="brand-footer"><div className="footer-main"><div className="footer-brand"><Image src="/shakila-logo-transparent.png" alt="Shakila Group" width={190} height={124}/><p>Pengalaman menginap dan perjalanan yang hangat di Nepal van Java.</p></div><div className="footer-links"><div><strong>AKOMODASI</strong><Link href="/#stay">Glamping</Link><Link href="/#homestay">Homestay</Link><Link href="/availability">Reservasi</Link></div><div><strong>INFORMASI</strong><Link href="/booking/check">Cek booking</Link><Link href="/#faq">Kebijakan</Link><Link href="/#experience">Pengalaman</Link></div></div></div><div className="footer-bottom"><span>© 2026 SHAKILA GROUP</span><span>NEPAL VAN JAVA · INDONESIA</span></div></footer>}
