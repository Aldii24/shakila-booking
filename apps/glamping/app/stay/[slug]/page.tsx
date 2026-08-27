import Link from "next/link";
import { ArrowRight, Bath, BedDouble, Mountain, Users } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";

const stays = {
  "deluxe-dome": {
    name: "Deluxe Dome",
    price: "Rp850.000",
    capacity: 2,
    copy: "Ruang intim untuk dua orang dengan ranjang king, kamar mandi privat, dan teras yang membuka langsung ke lembah.",
    className: "deluxe",
  },
  "family-dome": {
    name: "Family Dome",
    price: "Rp1.250.000",
    capacity: 4,
    copy: "Dome lapang untuk keluarga, dengan area duduk, konfigurasi tidur fleksibel, dan panorama pinus.",
    className: "family",
  },
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = stays[slug as keyof typeof stays] ?? stays["deluxe-dome"];
  return <><Header /><main><section className={`detail-hero ${item.className}`}><div><p className="eyebrow">Akomodasi Shakila</p><h1>{item.name}</h1><p>{item.copy}</p></div></section><section className="section detail-content"><div><p className="eyebrow">Tentang ruang</p><h2>Hangat di dalam,<br />liar di luar.</h2><p>{item.copy} Material alami, tekstil hangat, dan pencahayaan lembut membuat istirahat terasa utuh setelah hari di pegunungan.</p></div><aside className="summary"><div><BedDouble /> <span>Tempat tidur premium</span></div><div><Bath /> <span>Kamar mandi privat</span></div><div><Users /> <span>Maks. {item.capacity} tamu</span></div><div><Mountain /> <span>Pemandangan dataran tinggi</span></div><div className="total"><span>Mulai</span><strong>{item.price} / malam</strong></div><Link className="button" href={`/availability?guestCount=${item.capacity}`}>Cek ketersediaan <ArrowRight /></Link></aside></section></main><Footer /></>;
}
