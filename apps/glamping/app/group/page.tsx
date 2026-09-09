import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, MapPin, MessageCircle } from "lucide-react";
import styles from "./page.module.css";

const accommodationUrl = "https://glamping.shakilagrup.com";
const jeepUrl = "https://jeep.shakilagrup.com";
const adminWhatsapp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "085148357152";
const whatsappUrl = `https://wa.me/62${adminWhatsapp.replace(/\D/g, "").replace(/^0/, "")}`;

export const metadata: Metadata = {
  title: {
    absolute: "Shakila Grup | Penginapan & Tour Jeep di Nepal van Java",
  },
  description:
    "Portal resmi Shakila Grup untuk Glamping, Homestay, dan Tour Jeep di Nepal van Java.",
};

const businesses = [
  {
    name: "Glamping",
    label: "Menginap dekat alam",
    description:
      "Pilihan Deluxe dan Twin Bed untuk menikmati suasana pegunungan dengan pengalaman menginap khas Shakila.",
    cta: "Lihat Glamping",
    href: `${accommodationUrl}/#glamping`,
    image: "/media/client/glamping/deluxe/2502.webp",
    imageAlt: "Area Glamping Shakila di suasana pegunungan",
  },
  {
    name: "Homestay",
    label: "Singgah dengan hangat",
    description:
      "Pilihan Standard, Superior, dan Twin Bed untuk masa inap yang dekat dengan Nepal van Java.",
    cta: "Lihat Homestay",
    href: `${accommodationUrl}/#homestay`,
    image: "/media/client/homestay/standard/2505.webp",
    imageAlt: "Homestay Shakila di sekitar Nepal van Java",
  },
  {
    name: "Tour Jeep",
    label: "Menjelajah lebih dekat",
    description:
      "Pilih perjalanan Jeep Shakila untuk menyusuri rute wisata di lanskap Nepal van Java dan sekitarnya.",
    cta: "Jelajahi Tour Jeep",
    href: jeepUrl,
    image: "/media/client/jeep/pricelist.png",
    imageAlt: "Katalog asli Jeep Adventure Shakila",
  },
] as const;

export default function GroupLandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.logo} href="/" aria-label="Beranda Shakila Grup">
          <Image src="/shakila-logo-transparent-clean.png" alt="Logo Shakila Grup" width={176} height={96} priority />
        </Link>
        <nav className={styles.nav} aria-label="Navigasi utama">
          <a href="#tentang">Tentang</a>
          <a href="#bisnis">Bisnis Kami</a>
          <a href="#lokasi">Lokasi</a>
        </nav>
        <a className={styles.contact} href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden="true" />
          <span>WhatsApp Admin</span>
        </a>
      </header>

      <main>
        <section className={styles.hero}>
          <Image
            className={styles.cover}
            src="/media/client/video/glamping-deluxe-poster.webp"
            alt="Pemandangan dari area Shakila di Nepal van Java"
            fill
            priority
            quality={92}
            sizes="100vw"
          />
          <div className={styles.heroShade} />
          <div className={styles.heroContent}>
            <p className={styles.kicker}>SHAKILA GRUP · NEPAL VAN JAVA</p>
            <h1>
              Menginap tenang.
              <br />
              <em>Menjelajah lebih dekat.</em>
            </h1>
            <p>
              Shakila menghadirkan pilihan Glamping, Homestay, dan perjalanan Jeep untuk menikmati suasana pegunungan dengan cara Anda sendiri.
            </p>
            <a className={styles.primaryButton} href="#bisnis">
              Jelajahi Shakila <ArrowRight aria-hidden="true" />
            </a>
          </div>
          <a className={styles.scrollCue} href="#tentang" aria-label="Lanjut ke bagian tentang Shakila">
            <span>Temukan pengalaman</span>
            <ArrowDown aria-hidden="true" />
          </a>
        </section>

        <section className={styles.intro} id="tentang">
          <p className={styles.kicker}>SATU TUJUAN, BERAGAM CARA MENIKMATI</p>
          <h2>Waktu yang terasa lebih dekat dengan alam.</h2>
          <p>
            Di sekitar Nepal van Java, Shakila mempertemukan pengalaman menginap dan perjalanan Jeep dalam satu keramahan yang hangat.
          </p>
        </section>

        <section className={styles.businessSection} id="bisnis">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.kicker}>BISNIS KAMI</p>
              <h2>Pilih pengalaman Shakila Anda.</h2>
            </div>
            <p>
              Temukan ruang untuk beristirahat atau rute untuk dijelajahi melalui masing-masing website resmi Shakila.
            </p>
          </div>

          <div className={styles.businessGrid}>
            {businesses.map((business, index) => (
              <Link
                className={styles.businessCard}
                data-business={business.name.toLowerCase().replaceAll(" ", "-")}
                href={business.href}
                key={business.name}
              >
                <Image
                  className={styles.cardImage}
                  src={business.image}
                  alt={business.imageAlt}
                  fill
                  quality={90}
                  sizes="(max-width: 760px) 100vw, (max-width: 1180px) 50vw, 33vw"
                />
                <div className={styles.cardShade} />
                <span className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.cardContent}>
                  <p>{business.label}</p>
                  <h3>{business.name}</h3>
                  <span>{business.description}</span>
                  <strong>
                    {business.cta} <ArrowRight aria-hidden="true" />
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.experiences} aria-label="Pengalaman Shakila">
          <article>
            <span>01</span>
            <h3>Pengalaman menginap</h3>
            <p>Glamping dan Homestay memberi pilihan cara menginap yang berbeda dalam suasana pegunungan Shakila.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Wisata Jeep</h3>
            <p>Perjalanan Jeep mengikuti pilihan paket dan rute wisata yang tersedia di katalog resmi Shakila.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Nepal van Java</h3>
            <p>Pengalaman Shakila berada di sekitar Nepal van Java dan lanskap pegunungan Dusun Butuh.</p>
          </article>
        </section>

        <section className={styles.location} id="lokasi">
          <div className={styles.locationImage}>
            <Image
              className={styles.cover}
              src="/media/client/glamping/twin-bed/2349.webp"
              alt="Lanskap pegunungan dari akomodasi Shakila"
              fill
              quality={90}
              sizes="(max-width: 900px) 100vw, 55vw"
            />
          </div>
          <div className={styles.locationCopy}>
            <MapPin aria-hidden="true" />
            <p className={styles.kicker}>NEPAL VAN JAVA · DUSUN BUTUH</p>
            <h2>Satu tempat untuk singgah dan memulai perjalanan.</h2>
            <p>
              Mulai dari waktu istirahat di akomodasi Shakila hingga perjalanan Jeep menuju rute pilihan di sekitar Nepal van Java.
            </p>
            <a href="#bisnis">
              Pilih pengalaman <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Image src="/shakila-logo-transparent-clean.png" alt="Logo Shakila Grup" width={196} height={107} />
          <p>Penginapan dan perjalanan Jeep di sekitar Nepal van Java.</p>
        </div>
        <div className={styles.footerNav}>
          <div>
            <strong>Bisnis</strong>
            <a href={`${accommodationUrl}/#glamping`}>Glamping</a>
            <a href={`${accommodationUrl}/#homestay`}>Homestay</a>
            <a href={jeepUrl}>Tour Jeep</a>
          </div>
          <div>
            <strong>Hubungi</strong>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp Admin</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Shakila Grup</span>
          <span>Nepal van Java · Indonesia</span>
        </div>
      </footer>
    </div>
  );
}
