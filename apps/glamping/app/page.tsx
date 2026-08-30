import Link from "next/link";
import { ArrowRight, BedDouble, Clock3, Coffee, Mountain, ShieldCheck, Sparkles } from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { GlampingLandingSearch } from "@/components/landing-search";
import { LandingMotion } from "@/components/landing-motion";
import { PremiumFaq } from "@/components/premium-faq";

const experiences = [
  { icon: Coffee, title: "Pagi yang pelan", text: "Nikmati udara dataran tinggi dan sarapan hangat setelah matahari terbit." },
  { icon: Mountain, title: "Dekat dengan alam", text: "Ruang menginap yang dirancang untuk menikmati lanskap, kabut, dan langit malam." },
  { icon: Sparkles, title: "Layanan personal", text: "Pengalaman menginap yang tenang dengan perhatian pada detail kedatangan Anda." },
];

export default function Home() {
  return <><Header/><main className="brand-home accommodation-home"><LandingMotion/>
    <section className="brand-hero accommodation-hero"><div className="brand-hero-overlay"/><div className="brand-hero-content"><p className="brand-kicker">SHAKILA ACCOMMODATION · NEPAL VAN JAVA</p><h1>Tempat tenang<br/><em>untuk kembali.</em></h1><p>Glamping dan Homestay dalam satu pengalaman menginap Shakila yang hangat, sederhana, dan dekat dengan alam.</p><Link className="brand-button brand-button-light" href="/availability">Rencanakan masa inap <ArrowRight/></Link></div><div className="brand-scroll-cue"><span>JELAJAHI</span><i/></div></section>
    <div className="brand-booking-shell"><GlampingLandingSearch/></div>
    <section className="brand-intro" data-reveal><p className="brand-kicker">THE SHAKILA WAY</p><h2>Menginap dengan ritme yang lebih pelan.</h2><p className="brand-lead">Kami menyatukan kenyamanan, kehangatan layanan, dan suasana pegunungan dalam pengalaman yang terasa personal—mulai dari reservasi hingga waktu Anda pulang.</p></section>
    <section id="stay" className="brand-showcase" data-reveal><div className="brand-section-heading"><div><p className="brand-kicker">PILIH CARA ANDA MENGINAP</p><h2>Stay Collection</h2></div><Link href="/availability">Lihat ketersediaan <ArrowRight/></Link></div><div className="brand-card-grid">
      <article className="brand-image-card stay-glamping"><div className="brand-card-shade"/><div className="brand-card-copy"><span>01</span><p>GLAMPING</p><h3>Ruang privat di antara kabut dan pinus.</h3><Link href="/stay/deluxe-dome">Jelajahi Glamping <ArrowRight/></Link></div></article>
      <article id="homestay" className="brand-image-card stay-homestay"><div className="brand-card-shade"/><div className="brand-card-copy"><span>02 · KATALOG DEMO</span><p>HOMESTAY</p><h3>Alternatif menginap yang hangat dan bersahaja.</h3><span className="brand-muted-link">Data final menunggu katalog klien</span></div></article>
    </div></section>
    <section id="experience" className="brand-split" data-reveal><div className="brand-split-image accommodation-story"/><div className="brand-split-copy"><p className="brand-kicker">A COMPLETE STAY</p><h2>Dari kedatangan hingga pagi berikutnya.</h2><p>Setiap bagian perjalanan dibuat mudah dan jelas. Pilih tanggal, selesaikan DP, lalu biarkan tim Shakila menyiapkan kedatangan Anda.</p><div className="brand-facts"><div><Clock3/><span><b>13.00 WIB</b>Check-in dimulai</span></div><div><BedDouble/><span><b>12.00 WIB</b>Batas check-out</span></div><div><ShieldCheck/><span><b>DP 50%</b>Minimum pembayaran</span></div></div><Link className="brand-text-link" href="/availability">Mulai reservasi <ArrowRight/></Link></div></section>
    <section className="brand-values">{experiences.map(({icon:Icon,title,text})=><article key={title}><Icon/><h3>{title}</h3><p>{text}</p></article>)}</section>
    <section className="brand-quote"><p className="brand-kicker">SHAKILA GROUP</p><blockquote>“Hospitality yang baik terasa sederhana: hangat saat datang, tenang selama tinggal, dan mudah untuk diingat.”</blockquote></section>
    <section id="faq" className="brand-faq" data-reveal><div><p className="brand-kicker">SEBELUM MENGINAP</p><h2>Informasi penting.</h2><p className="brand-faq-intro">Detail singkat untuk mempersiapkan masa inap dengan nyaman.</p></div><PremiumFaq items={[{question:"Berapa minimum DP?",answer:"DP minimal 50% dari total booking dan harus dibayar maksimal 12 jam setelah booking dibuat."},{question:"Bagaimana kebijakan pembatalan?",answer:"DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan."},{question:"Kapan waktu check-in dan check-out?",answer:"Check-in mulai pukul 13.00 WIB. Check-out maksimal pukul 12.00 WIB."}]}/></section>
    <section className="brand-cta accommodation-cta"><div><p className="brand-kicker">YOUR STAY AWAITS</p><h2>Temukan ruang untuk berhenti sejenak.</h2></div><Link className="brand-button brand-button-light" href="/availability">Pesan sekarang <ArrowRight/></Link></section>
  </main><Footer/></>;
}
