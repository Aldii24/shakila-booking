import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Clock3, ExternalLink, Map, MapPin, MessageCircle, ShieldCheck, Users, X } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { rupiah } from "@/lib/api";
import { getJeepCatalogPackage, getTourStayBookingUrl, jeepBrochurePath } from "@/lib/jeep-catalog";
import { jeepPackageImage } from "@/lib/jeep-media";

export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const item=getJeepCatalogPackage(slug);
  if(!item) notFound();
  return <><Header/><main>
    <section className={`detail-hero client-media ${item.kind === "TOUR_STAY" ? "tour-stay-detail-hero" : ""}`}><Image className="detail-hero-image" src={jeepPackageImage(slug)} alt={`Perjalanan ${item.name} Shakila Jeep`} fill priority quality={92} sizes="100vw"/><div className="detail-hero-shade"/><div><p className="kicker">{item.kind === "TOUR_STAY" ? "Paket Tour & Stay Shakila" : "Paket perjalanan Shakila"}</p><h1>{item.name}</h1><p>{item.description}</p></div></section>
    <section className="detail-copy jeep-package-detail"><div className="jeep-detail-content"><section><p className="kicker">Tentang Paket</p><h2>{item.kind === "TOUR_STAY" ? "Satu booking, kebutuhan perjalanan sudah disiapkan." : "Rute pilihan untuk menjelajah Nepal Van Java."}</h2><p>{item.description}</p></section><section><p className="kicker">Destinasi / Rute</p><div className="jeep-route-list">{item.stops.map((stop,index)=><div key={stop}><span>{String(index + 1).padStart(2,"0")}</span><MapPin/><strong>{stop}</strong></div>)}</div></section><section><p className="kicker">Fasilitas yang Didapat</p><div className={`jeep-inclusion-grid ${item.exclusions.length ? "" : "inclusions-only"}`}><div><h3>Termasuk</h3>{item.inclusions.map(value=><p key={value}><Check/>{value}</p>)}</div>{item.exclusions.length?<div className="jeep-exclusion"><h3>Tidak termasuk</h3>{item.exclusions.map(value=><p key={value}><X/>{value}</p>)}</div>:null}</div></section><section><p className="kicker">Informasi Perjalanan</p>{item.kind === "TOUR_STAY"?<div className="jeep-trip-info"><div><Users/><span><b>Kapasitas</b>{item.capacity}</span></div><div><ShieldCheck/><span><b>Komposisi paket</b>{item.composition.join(" · ")}</span></div><div><Clock3/><span><b>Tambahan akhir pekan / hari libur</b>Rp50.000 per paket</span></div></div>:<div className="jeep-trip-info"><div><Clock3/><span><b>Waktu perjalanan</b>Pilih jadwal yang tersedia saat melakukan pemesanan.</span></div><div><Users/><span><b>Kapasitas dan tambahan unit</b>Hubungi Admin untuk informasi lebih lanjut.</span></div><div><ShieldCheck/><span><b>Armada bersama</b>Seluruh paket menggunakan pool yang sama sebanyak 12 unit Jeep.</span></div></div>}</section>{item.kind === "TOUR_STAY"?<section><p className="kicker">Ketentuan Penting</p><ul className="tour-stay-conditions">{item.importantInformation.map((value)=><li key={value}>{value}</li>)}</ul></section>:null}</div><aside className="summary jeep-detail-summary">
      <p className="kicker">Harga</p><div className="jeep-summary-title"><span>{item.name}</span><b>{rupiah(item.priceAmountIdr)}</b></div>
      <div><Map/><span>{item.stops.length} titik dalam rute</span></div>
      {item.kind === "TOUR_STAY"?<><div><Users/><span>{item.capacity}</span></div><div><ShieldCheck/><span>Penginapan, makan, tiket wisata, dan ojek termasuk sesuai ketentuan paket</span></div><p className="tour-stay-equivalent">Setara {rupiah(item.displayedPerPersonAmountIdr)}/{item.displayedPerPersonUnit}<small>Keterangan tanda * tidak dicantumkan dalam brosur.</small></p><a className="button" href={getTourStayBookingUrl(item)}>Pilih / Booking <MessageCircle/></a></>:<><div><Clock3/><span>Jadwal dipilih saat cek ketersediaan</span></div><div><ShieldCheck/><span>Harga belum termasuk tiket masuk destinasi wisata</span></div><Link className="button" href="/availability">Pilih / Booking <ArrowRight/></Link></>}
      <a className="jeep-detail-brochure" href={jeepBrochurePath} target="_blank" rel="noreferrer">Lihat Brosur Paket Tour <ExternalLink/></a>
    </aside></section>
  </main><Footer/></>;
}
