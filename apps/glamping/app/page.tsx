import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CloudSun,
  Coffee,
  Flame,
  Mountain,
  Sparkles,
  Star,
} from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { GlampingLandingSearch } from "@/components/landing-search";
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-shade" />
          <div className="hero-copy">
            <p className="eyebrow">Pegunungan Bromo</p>
            <h1>
              Bangun bersama
              <br />
              <em>cahaya pertama.</em>
            </h1>
            <p>
              Enam dome privat, udara pegunungan, dan pagi yang terasa lebih
              pelan.
            </p>
            <Link className="button" href="/availability">
              Temukan tanggal Anda <ArrowRight size={18} />
            </Link>
          </div>
          <GlampingLandingSearch />
        </section>
        <section className="intro">
          <p className="eyebrow">Ruang untuk benar-benar berhenti</p>
          <h2>Di atas awan, dekat dengan yang penting.</h2>
          <p>
            Shakila Glamping merangkai kenyamanan hotel butik dengan lanskap
            Tengger yang apa adanya. Setiap detail dibuat agar Anda tiba,
            bernapas, dan tinggal sedikit lebih lama.
          </p>
          <div className="feature-row">
            <span>
              <CloudSun /> Fajar privat
            </span>
            <span>
              <Flame /> Api unggun
            </span>
            <span>
              <Coffee /> Sarapan hangat
            </span>
            <span>
              <Mountain /> Jelajah Bromo
            </span>
          </div>
        </section>
        <section id="stay" className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">Akomodasi</p>
              <h2>Dua cara untuk bermalam.</h2>
            </div>
            <Link href="/availability">
              Lihat ketersediaan <ArrowRight size={17} />
            </Link>
          </div>
          <div className="stay-grid">
            <article className="stay-card deluxe">
              <div className="image-label">Paling intim</div>
              <div>
                <h3>Deluxe Dome</h3>
                <p>
                  Untuk dua orang—tempat tidur king, kamar mandi privat, dan
                  teras menghadap lembah.
                </p>
                <span>Mulai Rp850.000 / malam</span>
                <Link href="/stay/deluxe-dome">
                  Lihat dome <ArrowRight />
                </Link>
              </div>
            </article>
            <article className="stay-card family">
              <div className="image-label">Untuk keluarga</div>
              <div>
                <h3>Family Dome</h3>
                <p>
                  Ruang lapang untuk empat tamu dengan sudut duduk dan panorama
                  pinus.
                </p>
                <span>Mulai Rp1.250.000 / malam</span>
                <Link href="/stay/family-dome">
                  Lihat dome <ArrowRight />
                </Link>
              </div>
            </article>
          </div>
        </section>
        <section id="experience" className="editorial">
          <div className="editorial-photo" />
          <div className="editorial-copy">
            <p className="eyebrow">Ritme Shakila Glamping</p>
            <h2>Dari kabut pagi hingga bara malam.</h2>
            <p>
              Mulai sebelum matahari terbit bersama pemandu lokal, kembali untuk
              sarapan hangat, lalu habiskan sore dengan teh dan pemandangan
              lembah. Saat malam turun, percakapan berpindah ke sekitar api.
            </p>
            <div className="mini-grid">
              <span>
                <Sparkles /> Stargazing
              </span>
              <span>
                <BedDouble /> Turndown hangat
              </span>
            </div>
          </div>
        </section>
        <section id="gallery" className="section">
          <p className="eyebrow">Galeri</p>
          <h2>Potongan waktu di dataran tinggi.</h2>
          <div className="gallery">
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </section>
        <section className="quote">
          <Star />
          <blockquote>
            “Pagi paling hening yang pernah kami rasakan. Dome-nya hangat,
            pemandangannya benar-benar membuat lupa waktu.”
          </blockquote>
          <p>— Nadya & Reza, Surabaya</p>
        </section>
        <section id="faq" className="section faq">
          <div>
            <p className="eyebrow">Sebelum berangkat</p>
            <h2>Pertanyaan yang sering ditanyakan.</h2>
          </div>
          <div>
            <details open>
              <summary>Apakah akses kendaraan mudah?</summary>
              <p>
                Ya. Lokasi dapat dicapai kendaraan pribadi. Tim kami akan
                mengirim panduan kedatangan setelah reservasi terkonfirmasi.
              </p>
            </details>
            <details>
              <summary>Kapan waktu check-in dan check-out?</summary>
              <p>Check-in mulai 14.00 WIB dan check-out maksimal 11.00 WIB.</p>
            </details>
            <details>
              <summary>Apakah anak-anak diperbolehkan?</summary>
              <p>
                Tentu. Family Dome dirancang untuk hingga empat tamu dan paling
                nyaman untuk keluarga.
              </p>
            </details>
            <details>
              <summary>Berapa DP yang dibutuhkan?</summary>
              <p>
                DP mengikuti pengaturan reservasi dan ditampilkan transparan
                sebelum Anda membayar.
              </p>
            </details>
          </div>
        </section>
        <section className="final-cta">
          <div>
            <p className="eyebrow">Temui pagi Anda</p>
            <h2>
              Satu malam bisa mengubah
              <br />
              cara Anda melihat Bromo.
            </h2>
          </div>
          <Link className="button light-button" href="/availability">
            Pilih tanggal <ArrowRight />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
