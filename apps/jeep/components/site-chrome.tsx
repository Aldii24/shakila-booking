import Link from "next/link";
export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <b>SHAKILA</b>
        <span>JEEP TOUR</span>
      </Link>
      <nav>
        <Link href="/#routes">Rute</Link>
        <Link href="/#fleet">Armada</Link>
        <Link href="/#stories">Cerita</Link>
        <Link href="/booking/check">Cek Booking</Link>
      </nav>
      <Link className="button small" href="/availability">
        PILIH PETUALANGAN
      </Link>
    </header>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="brand">
        <b>SHAKILA</b>
        <span>JEEP TOUR</span>
      </div>
      <div>
        <Link href="/availability">KETERSEDIAAN</Link>
        <Link href="/booking/check">CEK BOOKING</Link>
        <Link href="/#faq">FAQ</Link>
      </div>
      <small>
        © 2026 Shakila Jeep Tour · Foto: {" "}
        <a href="https://commons.wikimedia.org/wiki/File:Bromo_jeep_in_a_dirt_road.jpg">
          Aditya Prabaswara
        </a>{" "}
        (CC BY 2.0) &amp; {" "}
        <a href="https://commons.wikimedia.org/wiki/File:Jeep_di_Pasir_Berbisik.jpg">
          Samuel Rubin
        </a>{" "}
        (CC BY 4.0), dipotong untuk tampilan.
      </small>
    </footer>
  );
}
