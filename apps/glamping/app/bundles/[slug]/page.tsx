import { notFound } from "next/navigation";
import { Check, MapPin } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { BundleAvailability } from "@/components/bundle-availability";
import { bundleCatalog, getBundleCatalogItem } from "@/lib/bundle-catalog";
import { rupiah } from "@/lib/api";

export function generateStaticParams() { return bundleCatalog.map((item) => ({ slug: item.slug })); }

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const item = getBundleCatalogItem((await params).slug);
  if (!item) notFound();
  const capacity = item.familyName.startsWith("Family") ? 4 : 4;
  return <><Header /><main className="page-shell bundle-detail-page">
    <div className="page-intro"><p className="eyebrow">Paket Menginap + Jeep</p><h1>{item.name}</h1><p>Satu booking berisi 1 kamar {item.roomName}, 1 Jeep, fasilitas makan, tiket wisata, dan ojek sesuai ketentuan rute.</p></div>
    <div className="bundle-detail-grid">
      <section className="panel"><p className="eyebrow">Destinasi / Rute</p><h2>{item.routeName}</h2><ol className="bundle-route-list">{item.routes.map((route) => <li key={route}><MapPin />{route}</li>)}</ol></section>
      <section className="panel"><p className="eyebrow">Fasilitas yang didapat</p><h2>Sudah termasuk</h2><ul className="bundle-inclusion-list">{item.inclusions.map((inclusion) => <li key={inclusion}><Check />{inclusion}</li>)}</ul></section>
      <section className="panel bundle-price-panel"><p className="eyebrow">Harga paket</p><h2>{rupiah(item.price)}</h2><p>{item.capacity} · termasuk 1 malam · 1 kamar {item.roomName} · 1 kali tour Jeep</p><p>Malam tambahan: {rupiah(item.additionalNightPrice)} per kamar per malam.</p></section>
      <section className="panel"><p className="eyebrow">Ketentuan penting</p><ul className="bundle-condition-list">{item.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul></section>
    </div>
    <BundleAvailability bundleSlug={item.slug} capacity={capacity} />
  </main><Footer /></>;
}
