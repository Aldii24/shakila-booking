import Link from "next/link";
import { ArrowRight, Clock3, Compass, Map, Mountain, ShieldCheck, Sunrise, Users } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { JeepLandingSearch } from "@/components/landing-search";
import { LandingMotion } from "@/components/landing-motion";
import { PremiumFaq } from "@/components/premium-faq";

const experiences = [
  { icon: Sunrise, title: "Berangkat tepat waktu", text: "Slot perjalanan yang jelas untuk membantu Anda merencanakan pagi dengan nyaman." },
  { icon: Compass, title: "Kru berpengalaman", text: "Perjalanan ditemani pengemudi yang memahami karakter medan dan operasional setempat." },
  { icon: ShieldCheck, title: "Armada terjaga", text: "Setiap booking menggunakan unit fisik dan tetap terlindungi dari overbooking." },
];

export default function Home() {
  return <><Header/><main className="brand-home jeep-home"><LandingMotion/>
    <section className="brand-hero jeep-hero"><div className="brand-hero-overlay"/><div className="brand-hero-content"><p className="brand-kicker">SHAKILA JEEP EXPERIENCE · NEPAL VAN JAVA</p><h1>Menjelajah lereng<br/><em>lebih dekat.</em></h1><p>Perjalanan Jeep privat dengan persiapan yang rapi, suasana yang personal, dan waktu yang dibuat untuk menikmati setiap lanskap.</p><Link className="brand-button brand-button-light" href="/availability">Rencanakan perjalanan <ArrowRight/></Link></div><div className="brand-scroll-cue"><span>JELAJAHI</span><i/></div></section>
    <div className="brand-booking-shell jeep-booking-shell"><JeepLandingSearch/></div>
    <section className="brand-intro" data-reveal><p className="brand-kicker">THE SHAKILA WAY</p><h2>Perjalanan yang berani, layanan yang tetap tenang.</h2><p className="brand-lead">Shakila membawa standar hospitality yang sama ke perjalanan Jeep: reservasi yang mudah, operasional yang jelas, dan pengalaman lapangan yang terasa personal.</p></section>
    <section id="routes" className="brand-showcase" data-reveal><div className="brand-section-heading"><div><p className="brand-kicker">KATALOG PERJALANAN · DEMO</p><h2>Jeep Collection</h2></div><Link href="/availability">Lihat ketersediaan <ArrowRight/></Link></div><div className="brand-card-grid">
      <article className="brand-image-card route-sunrise"><div className="brand-card-shade"/><div className="brand-card-copy"><span>01 · KATALOG DEMO</span><p>SUNRISE JOURNEY</p><h3>Mengejar cahaya pertama di lereng pegunungan.</h3><Link href="/packages/sunrise-adventure">Jelajahi perjalanan <ArrowRight/></Link></div></article>
      <article className="brand-image-card route-full"><div className="brand-card-shade"/><div className="brand-card-copy"><span>02 · KATALOG DEMO</span><p>FULL EXPERIENCE</p><h3>Lebih banyak waktu menikmati jalan dan lanskap.</h3><Link href="/packages/full-adventure-experience">Jelajahi perjalanan <ArrowRight/></Link></div></article>
    </div></section>
    <section id="fleet" className="brand-split brand-split-reverse" data-reveal><div className="brand-split-image jeep-story"/><div className="brand-split-copy"><p className="brand-kicker">A COMPLETE JOURNEY</p><h2>Satu perjalanan, dipersiapkan dengan baik.</h2><p>Dari pemilihan slot hingga keberangkatan, setiap tahap dirancang sederhana. Armada dialokasikan saat booking agar kapasitas yang Anda lihat tetap nyata.</p><div className="brand-facts"><div><Clock3/><span><b>Slot terjadwal</b>Waktu keberangkatan jelas</span></div><div><Users/><span><b>Grup privat</b>Sesuai kapasitas unit</span></div><div><ShieldCheck/><span><b>DP 50%</b>Minimum pembayaran</span></div></div><Link className="brand-text-link" href="/availability">Pilih perjalanan <ArrowRight/></Link></div></section>
    <section className="brand-values">{experiences.map(({icon:Icon,title,text})=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</section>
    <section id="stories" className="brand-quote jeep-quote"><p className="brand-kicker">SHAKILA GROUP</p><blockquote>“Petualangan terbaik tidak harus terasa terburu-buru. Ia dimulai dengan persiapan yang baik dan ruang untuk menikmati perjalanan.”</blockquote></section>
    <section className="brand-route-notes"><div><Map/><span>RUTE TERPILIH</span></div><i/><div><Mountain/><span>NEPAL VAN JAVA</span></div><i/><div><Compass/><span>KRU LOKAL</span></div></section>
    <section id="faq" className="brand-faq" data-reveal><div><p className="brand-kicker">SEBELUM BERANGKAT</p><h2>Informasi penting.</h2><p className="brand-faq-intro">Detail singkat agar perjalanan terasa nyaman sejak reservasi.</p></div><PremiumFaq items={[{question:"Apakah katalog dan harga sudah final?",answer:"Belum. Paket yang tampil adalah data demo dan akan diganti setelah katalog resmi klien tersedia."},{question:"Berapa minimum DP?",answer:"DP minimal 50% dari total booking dan harus dibayar maksimal 12 jam setelah booking dibuat."},{question:"Bagaimana kebijakan pembatalan?",answer:"DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan."}]}/></section>
    <section className="brand-cta jeep-cta"><div><p className="brand-kicker">YOUR JOURNEY AWAITS</p><h2>Temukan Nepal van Java lebih dekat.</h2></div><Link className="brand-button brand-button-light" href="/availability">Pesan sekarang <ArrowRight/></Link></section>
  </main><Footer/></>;
}
