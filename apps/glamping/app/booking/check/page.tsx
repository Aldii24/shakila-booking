import type { Metadata } from "next";
import { Clock3, ShieldCheck } from "lucide-react";
import { BookingLookup } from "@/components/booking-flow";
import { Footer, Header } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Cek Booking | Shakila Accommodation",
  description: "Lihat status dan detail reservasi Shakila Accommodation dengan aman.",
};

export default function Page() {
  return (
    <>
      <Header />
      <main className="page-shell booking-check-page">
        <section className="booking-check-layout">
          <div className="booking-check-intro">
            <p className="eyebrow">Reservasi Anda</p>
            <h1>Temukan kembali perjalanan Anda.</h1>
            <p className="booking-check-lead">
              Masukkan kode booking dan kontak yang sama saat reservasi untuk
              melihat status pembayaran, detail menginap, dan invoice.
            </p>
            <div className="booking-check-assurances" aria-label="Informasi keamanan">
              <div>
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>Privasi terjaga</strong>
                  Detail hanya terbuka setelah kode dan kontak cocok.
                </span>
              </div>
              <div>
                <Clock3 aria-hidden="true" />
                <span>
                  <strong>Status terkini</strong>
                  Verifikasi pembayaran dan batas waktu ditampilkan langsung.
                </span>
              </div>
            </div>
          </div>
          <BookingLookup />
        </section>
      </main>
      <Footer />
    </>
  );
}
