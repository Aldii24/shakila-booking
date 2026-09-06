import Link from "next/link";
import { ArrowRight, Coffee, Home, ShieldCheck, Users } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { api, rupiah } from "@/lib/api";

type Accommodation = {
  slug: string; name: string; kind: "GLAMPING" | "HOMESTAY"; description: string;
  basePrice: number; capacityPerUnit: number; breakfastIncludedPax: number | null;
  facilities: string[]; isDemoData: boolean;
};
const media: Record<string, string> = {
  "glamping-deluxe": "/media/glamping-deluxe.jpg", "glamping-twin-bed": "/media/glamping-twin-bed.jpg",
  "homestay-standard": "/media/homestay-standard.jpg", "homestay-superior": "/media/homestay-superior.jpg",
  "homestay-twin-bed": "/media/homestay-twin-bed.jpg",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await api<Accommodation>(`/public/glamping/types/${slug}`);
  const image = media[item.slug] ?? "/media/glamping-deluxe.jpg";
  return <><Header /><main>
    <section className="detail-hero client-media" style={{ backgroundImage: `linear-gradient(90deg,rgba(10,30,22,.7),rgba(10,30,22,.12)),url(${image})` }}><div><p className="eyebrow">{item.kind === "HOMESTAY" ? "Homestay Shakila" : "Glamping Shakila"}</p><h1>{item.name}</h1><p>{item.description}</p>{item.isDemoData ? <span className="catalog-demo-badge">Sebagian data masih berupa data demo</span> : null}</div></section>
    <section className="section detail-content"><div><p className="eyebrow">Tentang akomodasi</p><h2>Nyaman untuk<br />beristirahat.</h2><p>{item.description}</p>{item.facilities.length ? <div className="facility-list"><strong>Fasilitas</strong>{item.facilities.map(value => <span key={value}>• {value}</span>)}</div> : null}</div><aside className="summary">
      <div><Home /><span>{item.kind === "HOMESTAY" ? "Homestay" : "Glamping"}</span></div>
      <div><Users /><span>Maksimal {item.capacityPerUnit} tamu per unit{item.isDemoData ? " · data demo" : ""}</span></div>
      {item.breakfastIncludedPax ? <div><Coffee /><span>Sarapan untuk {item.breakfastIncludedPax} orang per kamar</span></div> : null}
      <div><ShieldCheck /><span>Inventori fisik diperiksa saat booking</span></div>
      <div className="total"><span>Mulai</span><strong>{rupiah(item.basePrice)} / malam{item.isDemoData ? " · data demo" : ""}</strong></div>
      <Link className="button" href={`/availability?guestCount=${item.capacityPerUnit}`}>Cek ketersediaan <ArrowRight /></Link>
    </aside></section>
  </main><Footer /></>;
}
