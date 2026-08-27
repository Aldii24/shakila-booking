import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Compass,
  Gauge,
  Map,
  Mountain,
  ShieldCheck,
  Star,
  Sunrise,
  Users,
} from "lucide-react";
import { Footer, Header } from "@/components/site-chrome";
import { JeepLandingSearch } from "@/components/landing-search";
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="grain" />
          <div className="hero-copy">
            <p className="kicker">4×4 / SUNRISE / ADVENTURE</p>
            <h1>
              CHASE
              <br />
              <span>THE FIRST</span>
              <br />
              LIGHT.
            </h1>
            <p>
              Berangkat sebelum dunia terbangun. Jeep privat, pengemudi lokal,
              dan perjalanan pagi yang dipersiapkan dengan serius.
            </p>
            <Link className="button" href="/availability">
              MULAI EKSPEDISI <ArrowDownRight />
            </Link>
          </div>
          <div className="hero-stat">
            <b>03.00</b>
            <span>WIB · DINI HARI</span>
          </div>
        </section>
        <JeepLandingSearch />
        <section className="manifesto">
          <p className="kicker">BUKAN SEKADAR ANTAR-JEMPUT</p>
          <h2>
            Gunung tidak menunggu.
            <br />
            Kita berangkat lebih dulu.
          </h2>
          <div>
            <p>
              Shakila Jeep Tour adalah operator tur 4×4 dengan delapan Jeep
              fisik dan kru lokal yang mengenal setiap belokan kaldera. Tidak
              ada kuota fiktif—setiap booking mengunci Jeep nyata untuk slot
              Anda.
            </p>
            <span>01 — DRIVER LOKAL</span>
            <span>02 — ARMADA TERAWAT</span>
            <span>03 — GRUP PRIVAT</span>
          </div>
        </section>
        <section id="routes" className="routes">
          <article className="route sunrise">
            <div className="route-no">01</div>
            <div>
              <p className="kicker">03.00 WIB · DINI HARI</p>
              <h3>
                Sunrise
                <br />
                Adventure
              </h3>
              <p>
                Perjalanan fajar dengan lintasan pilihan dan waktu yang ringkas
                untuk menikmati suasana pagi dari sudut terbaik.
              </p>
              <strong>Rp750.000 / JEEP</strong>
              <Link href="/packages/sunrise-adventure">
                LIHAT RUTE <ArrowRight />
              </Link>
            </div>
          </article>
          <article className="route full">
            <div className="route-no">02</div>
            <div>
              <p className="kicker">03.00 WIB DINI HARI / 08.00 WIB PAGI</p>
              <h3>
                Full Adventure
                <br />
                Experience
              </h3>
              <p>
                Rute lengkap untuk mereka yang ingin tinggal lebih lama: spot
                utama, jalur savana, dan sudut kaldera yang lebih sunyi.
              </p>
              <strong>Rp950.000 / JEEP</strong>
              <Link href="/packages/full-adventure-experience">
                LIHAT RUTE <ArrowRight />
              </Link>
            </div>
          </article>
        </section>
        <section className="route-line">
          <div>
            <Sunrise />
            <b>TITIK FAJAR</b>
          </div>
          <span />
          <div>
            <Mountain />
            <b>JALUR UTAMA</b>
          </div>
          <span />
          <div>
            <Compass />
            <b>JALUR ALAM</b>
          </div>
          <span />
          <div>
            <Map />
            <b>AREA PANDANG</b>
          </div>
        </section>
        <section id="fleet" className="fleet">
          <div className="fleet-image" />
          <div>
            <p className="kicker">THE FLEET</p>
            <h2>
              Delapan mesin.
              <br />
              Satu standar.
            </h2>
            <p>
              Setiap Jeep diperiksa sebelum keberangkatan. Kabin bersih,
              pengemudi berpengalaman, dan kapasitas maksimal enam tamu per
              unit.
            </p>
            <div className="specs">
              <span>
                <Gauge /> 4×4 READY
              </span>
              <span>
                <Users /> 6 GUESTS
              </span>
              <span>
                <ShieldCheck /> DAILY CHECK
              </span>
            </div>
            <Link className="button" href="/availability">
              PILIH JEEP ANDA
            </Link>
          </div>
        </section>
        <section id="stories" className="stories">
          <Star />
          <blockquote>
            “Driver kami tahu persis kapan harus berhenti dan kapan harus
            melaju. Sunrise-nya luar biasa, tapi jalur savananya yang paling
            membekas.”
          </blockquote>
          <p>— ARDIAN, JAKARTA</p>
        </section>
        <section id="faq" className="faq">
          <div>
            <p className="kicker">FIELD NOTES / FAQ</p>
            <h2>Yang perlu Anda tahu.</h2>
          </div>
          <div>
            <details open>
              <summary>Berapa orang dalam satu Jeep?</summary>
              <p>
                Maksimal enam tamu. Sistem otomatis menghitung jumlah Jeep
                minimum dari jumlah tamu Anda.
              </p>
            </details>
            <details>
              <summary>Apakah satu Jeep bisa dipakai slot lain?</summary>
              <p>
                Ya. Armada dapat digunakan lagi pada slot berbeda di tanggal
                yang sama, sesuai model operasional demo.
              </p>
            </details>
            <details>
              <summary>Bagaimana jika cuaca buruk?</summary>
              <p>
                Tim lapangan akan menghubungi Anda bila kondisi membutuhkan
                penyesuaian rute demi keselamatan.
              </p>
            </details>
            <details>
              <summary>Apakah harga per orang?</summary>
              <p>Tidak. Harga adalah per Jeep, bukan per orang.</p>
            </details>
          </div>
        </section>
        <section className="cta">
          <p className="kicker">YOUR WINDOW IS OPEN</p>
          <h2>
            Fajar berikutnya
            <br />
            sudah menunggu.
          </h2>
          <Link className="button pale" href="/availability">
            BOOK THE RIDE <ArrowRight />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
