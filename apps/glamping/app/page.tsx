import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Clock3,
  Coffee,
  Mountain,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { GlampingLandingSearch } from "@/components/landing-search";
import { LandingMotion } from "@/components/landing-motion";
import { PremiumFaq } from "@/components/premium-faq";
import {
  accommodationGroups,
  getAccommodationMedia,
} from "@/lib/accommodation-media";
import { bundleCatalog } from "@/lib/bundle-catalog";
import { rupiah } from "@/lib/api";

const experiences = [
  { icon: Coffee, title: "Pagi yang pelan", text: "Nikmati udara dataran tinggi dan sarapan hangat setelah matahari terbit." },
  { icon: Mountain, title: "Dekat dengan alam", text: "Ruang menginap yang dirancang untuk menikmati lanskap, kabut, dan langit malam." },
  { icon: Sparkles, title: "Layanan personal", text: "Pengalaman menginap yang tenang dengan perhatian pada detail kedatangan Anda." },
];

const films = [
  { title: "Glamping Deluxe", ...getAccommodationMedia("glamping-deluxe") },
  { title: "Glamping Twin Bed", ...getAccommodationMedia("glamping-twin-bed") },
  { title: "Homestay Shakila", ...getAccommodationMedia("homestay-standard") },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="brand-home accommodation-home">
        <LandingMotion />
        <section className="brand-hero accommodation-hero">
          <Image className="brand-cover-image" src={getAccommodationMedia("glamping-deluxe").poster} alt="Pemandangan dari area Glamping Shakila" fill priority quality={92} sizes="100vw" />
          <div className="brand-hero-overlay" />
          <div className="brand-hero-content">
            <p className="brand-kicker">AKOMODASI SHAKILA · NEPAL VAN JAVA</p>
            <h1>Tempat tenang<br /><em>untuk kembali.</em></h1>
            <p>Glamping dan Homestay dalam satu pengalaman menginap Shakila yang hangat, sederhana, dan dekat dengan alam.</p>
            <Link className="brand-button brand-button-light" href="/availability">Rencanakan masa inap <ArrowRight /></Link>
          </div>
          <div className="brand-scroll-cue"><span>JELAJAHI</span><i /></div>
        </section>

        <div className="brand-booking-shell"><GlampingLandingSearch /></div>

        <section className="brand-intro" data-reveal>
          <p className="brand-kicker">CARA SHAKILA MENYAMBUT</p>
          <h2>Menginap dengan ritme yang lebih pelan.</h2>
          <p className="brand-lead">Kami menyatukan kenyamanan, kehangatan layanan, dan suasana pegunungan dalam pengalaman yang terasa personal—mulai dari reservasi hingga waktu Anda pulang.</p>
        </section>

        <section id="stay" className="brand-showcase" data-reveal>
          <div className="brand-section-heading">
            <div><p className="brand-kicker">PILIH CARA ANDA MENGINAP</p><h2>Lima tipe, dua pengalaman.</h2></div>
            <Link href="/availability">Lihat ketersediaan <ArrowRight /></Link>
          </div>
          <div className="accommodation-groups">
            {accommodationGroups.map((group) => (
              <section className="accommodation-category" id={group.kind.toLowerCase()} key={group.kind}>
                <header>
                  <div><span>{group.kind}</span><h3>{group.title}</h3></div>
                  <p>{group.description}</p>
                </header>
                <div className={`accommodation-type-grid ${group.kind.toLowerCase()}`}>
                  {group.slugs.map((slug, index) => {
                    const item = getAccommodationMedia(slug);
                    return (
                      <article className="brand-image-card" key={slug}>
                        <Image className="brand-card-image" src={item.hero} alt={`${group.title} ${item.label} Shakila`} fill quality={90} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 34vw" />
                        <div className="brand-card-shade" />
                        <div className="brand-card-copy">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <p>{group.kind}</p>
                          <h3>{item.label}</h3>
                          <Link href={`/stay/${slug}`}>Lihat kamar <ArrowRight /></Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="bundle-showcase" data-reveal>
          <div className="brand-section-heading">
            <div><p className="brand-kicker">PAKET LENGKAP SHAKILA</p><h2>Paket Menginap + Jeep</h2></div>
            <p>Satu booking untuk kamar dan Jeep. Ketersediaan mengikuti resource yang paling terbatas.</p>
          </div>
          <div className="bundle-card-grid">
            {bundleCatalog.map((item) => <article className="bundle-card" key={item.slug}>
              <p className="brand-kicker">{item.routeName}</p>
              <h3>{item.familyName}</h3>
              <p>{item.capacity}</p>
              <div className="bundle-card-composition"><span>1 kamar {item.roomName}</span><span>1 kali tour Jeep</span><span>Mulai 1 malam</span></div>
              <strong>{rupiah(item.price)}</strong>
              <Link href={`/bundles/${item.slug}`}>Lihat detail &amp; booking <ArrowRight /></Link>
            </article>)}
          </div>
        </section>

        <section className="client-film-section" data-reveal>
          <div className="brand-section-heading"><div><p className="brand-kicker">VIDEO DARI SHAKILA</p><h2>Lihat suasananya sebelum tiba.</h2></div></div>
          <div className="client-film-grid">
            {films.map((film) => (
              <article key={film.title}>
                <video controls playsInline preload="none" poster={film.poster} aria-label={`Video ${film.title}`}>
                  <source src={film.video} type="video/mp4" />
                  Browser Anda tidak mendukung pemutaran video.
                </video>
                <span>{film.kind}</span>
                <h3>{film.title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="experience" className="brand-split" data-reveal>
          <div className="brand-split-image accommodation-story">
            <Image className="brand-cover-image" src={getAccommodationMedia("homestay-twin-bed").hero} alt="Kamar Homestay Twin Bed Shakila" fill quality={90} sizes="(max-width: 1000px) 100vw, 52vw" />
          </div>
          <div className="brand-split-copy">
            <p className="brand-kicker">PENGALAMAN MENGINAP LENGKAP</p><h2>Dari kedatangan hingga pagi berikutnya.</h2>
            <p>Setiap bagian perjalanan dibuat mudah dan jelas. Pilih tanggal, selesaikan DP, lalu biarkan tim Shakila menyiapkan kedatangan Anda.</p>
            <div className="brand-facts">
              <div><Clock3 /><span><b>13.00 WIB</b>Check-in dimulai</span></div>
              <div><BedDouble /><span><b>12.00 WIB</b>Batas check-out</span></div>
              <div><ShieldCheck /><span><b>DP 50%</b>Minimum pembayaran</span></div>
            </div>
            <Link className="brand-text-link" href="/availability">Mulai reservasi <ArrowRight /></Link>
          </div>
        </section>

        <section className="brand-values">
          {experiences.map(({ icon: Icon, title, text }) => <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}
        </section>
        <section className="brand-quote"><p className="brand-kicker">SHAKILA GROUP</p><blockquote>“Keramahtamahan yang baik terasa sederhana: hangat saat datang, tenang selama tinggal, dan mudah untuk diingat.”</blockquote></section>
        <section id="faq" className="brand-faq" data-reveal>
          <div><p className="brand-kicker">SEBELUM MENGINAP</p><h2>Informasi penting.</h2><p className="brand-faq-intro">Detail singkat untuk mempersiapkan masa inap dengan nyaman.</p></div>
          <PremiumFaq items={[
            { question: "Apa pilihan akomodasi yang tersedia?", answer: "Glamping memiliki tipe Deluxe dan Twin Bed. Homestay memiliki tipe Standard, Superior, dan Twin Bed. Keduanya ditampilkan terpisah di kalender agar mudah dibandingkan." },
            { question: "Berapa minimum DP?", answer: "DP minimal 50% dari total booking dan harus dibayar maksimal 12 jam setelah booking dibuat." },
            { question: "Bagaimana kebijakan pembatalan?", answer: "DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan." },
            { question: "Kapan waktu check-in dan check-out?", answer: "Check-in mulai pukul 13.00 WIB. Check-out maksimal pukul 12.00 WIB." },
          ]} />
        </section>
        <section className="brand-cta accommodation-cta">
          <Image className="brand-cover-image" src={getAccommodationMedia("glamping-twin-bed").poster} alt="Pemandangan pegunungan dari akomodasi Shakila" fill quality={90} sizes="100vw" />
          <div><p className="brand-kicker">MASA INAP ANDA MENANTI</p><h2>Temukan ruang untuk berhenti sejenak.</h2></div>
          <Link className="brand-button brand-button-light" href="/availability">Pesan sekarang <ArrowRight /></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
