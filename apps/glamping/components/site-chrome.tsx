import Link from "next/link";
export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span>SHAKILA</span>
        <small>GLAMPING</small>
      </Link>
      <nav>
        <Link href="/#stay">Akomodasi</Link>
        <Link href="/#experience">Pengalaman</Link>
        <Link href="/#gallery">Galeri</Link>
        <Link href="/booking/check">Cek Booking</Link>
      </nav>
      <Link className="button compact" href="/availability">
        Pesan Sekarang
      </Link>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <div>
        <div className="brand light">
          <span>SHAKILA</span>
          <small>GLAMPING</small>
        </div>
        <p>
          Tempat singgah yang tenang di antara kabut, pinus, dan fajar Bromo.
        </p>
      </div>
      <div>
        <strong>Jelajahi</strong>
        <Link href="/availability">Cek ketersediaan</Link>
        <Link href="/booking/check">Cek booking</Link>
        <Link href="/#faq">Pertanyaan umum</Link>
      </div>
      <small>
        © 2026 Shakila Glamping · Demo pengalaman reservasi nyata
      </small>
    </footer>
  );
}
