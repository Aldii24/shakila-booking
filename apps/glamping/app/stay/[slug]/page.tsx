import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Coffee, Home, ShieldCheck, Users } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { getAccommodationMedia } from "@/lib/accommodation-media";
import { api, rupiah } from "@/lib/api";

type Accommodation = {
  slug: string;
  name: string;
  kind: "GLAMPING" | "HOMESTAY";
  description: string;
  basePrice: number;
  capacityPerUnit: number;
  breakfastIncludedPax: number | null;
  facilities: string[];
  isDemoData: boolean;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await api<Accommodation>(`/public/glamping/types/${slug}`);
  const media = getAccommodationMedia(item.slug);
  const category = item.kind === "HOMESTAY" ? "Homestay" : "Glamping";

  return (
    <>
      <Header />
      <main>
        <section className="detail-hero client-media">
          <Image className="detail-hero-image" src={media.hero} alt={`${category} ${item.name} Shakila`} fill priority quality={92} sizes="100vw" />
          <div className="detail-hero-shade" />
          <div>
            <p className="eyebrow">{category} Shakila</p>
            <h1>{item.name}</h1>
            <p>{item.description}</p>
          </div>
        </section>

        <section className="section detail-content">
          <div>
            <p className="eyebrow">Tentang {category}</p>
            <h2>Nyaman untuk<br />beristirahat.</h2>
            <p>{item.description}</p>
            {item.facilities.length ? <div className="facility-list"><strong>Fasilitas</strong>{item.facilities.map((value) => <span key={value}>• {value}</span>)}</div> : null}
          </div>
          <aside className="summary">
            <div><Home /><span>{category}</span></div>
            <div><Users /><span>Maksimal {item.capacityPerUnit} tamu per unit</span></div>
            {item.breakfastIncludedPax ? <div><Coffee /><span>Sarapan untuk {item.breakfastIncludedPax} orang per kamar</span></div> : null}
            <div><ShieldCheck /><span>Ketersediaan unit dipastikan saat booking</span></div>
            <div className="total"><span>Mulai</span><strong>{rupiah(item.basePrice)} / malam</strong></div>
            <Link className="button" href={`/availability?guestCount=${item.capacityPerUnit}`}>Cek ketersediaan <ArrowRight /></Link>
          </aside>
        </section>

        <section className="client-gallery-section">
          <div className="client-gallery-heading">
            <div><p className="eyebrow">Media client</p><h2>{category} {item.name}</h2></div>
            <p>Seluruh sudut kamar dan fasilitas dari materi asli Shakila.</p>
          </div>
          <div className="client-gallery">
            {media.photos.map((photo, index) => (
              <figure key={photo} className={index === 0 ? "featured" : ""}>
                <Image src={photo} alt={`${category} ${item.name}, foto ${index + 1}`} fill quality={90} sizes={index === 0 ? "(max-width: 760px) 100vw, 66vw" : "(max-width: 760px) 100vw, 33vw"} />
              </figure>
            ))}
          </div>
        </section>

        <section className="detail-video-section">
          <div><p className="eyebrow">Lihat lebih dekat</p><h2>Tur singkat {category}.</h2><p>Video asli dari Shakila, dipersiapkan dalam format yang lebih ringan untuk web.</p></div>
          <video controls playsInline preload="metadata" poster={media.poster} aria-label={`Video tur ${category} ${item.name}`}>
            <source src={media.video} type="video/mp4" />
            Browser Anda tidak mendukung pemutaran video.
          </video>
        </section>
      </main>
      <Footer />
    </>
  );
}
