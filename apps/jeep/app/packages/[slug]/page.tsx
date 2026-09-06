import Link from "next/link";
import { ArrowRight, Clock3, Map, ShieldCheck } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { api, rupiah } from "@/lib/api";

type JeepPackage = { slug:string; name:string; description:string; pricePerUnit:number; routes:string[]; facilities:string[]; isDemoData:boolean; departureSlots:{id:string;name:string;departureTime:string;isDemoData:boolean}[] };
const imageFor = (slug:string) => slug.startsWith("short") ? "/media/jeep-short.jpg" : slug.startsWith("medium") ? "/media/jeep-medium.jpg" : "/media/jeep-long.jpg";

export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const item=await api<JeepPackage>(`/public/jeep/packages/${slug}`);
  return <><Header/><main>
    <section className="detail-hero client-media" style={{backgroundImage:`linear-gradient(90deg,rgba(20,26,18,.72),rgba(20,26,18,.12)),url(${imageFor(slug)})`}}><div><p className="kicker">Paket perjalanan Shakila</p><h1>{item.name}</h1><p>{item.description}</p>{item.isDemoData?<span className="catalog-demo-badge">Slot, kapasitas, dan stok masih berupa data demo</span>:null}</div></section>
    <section className="detail-copy"><div><p className="kicker">Rute perjalanan</p><h2>Jelajahi lebih dekat.</h2><p>{item.description}</p><div className="facility-list">{item.routes.map(route=><span key={route}>• {route}</span>)}</div>{item.facilities.length?<div className="facility-list"><strong>Fasilitas</strong>{item.facilities.map(value=><span key={value}>• {value}</span>)}</div>:null}</div><aside className="summary">
      <div><Clock3/><span>{item.departureSlots.map(slot=>`${slot.departureTime.slice(0,5)} WIB`).join(" · ")} · slot demo</span></div>
      <div><Map/><span>{item.routes.length} titik rute</span></div>
      <div><ShieldCheck/><span>Stok sementara 8 Jeep · data demo</span></div>
      <div className="total"><span>Harga paket</span><b>{rupiah(item.pricePerUnit)}</b></div>
      <Link className="button" href="/availability">Cek ketersediaan <ArrowRight/></Link>
    </aside></section>
  </main><Footer/></>;
}
