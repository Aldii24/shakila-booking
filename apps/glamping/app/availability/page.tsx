import { GlampingAvailabilityCalendar } from "@/components/availability-calendar";
import { Footer, Header } from "@/components/site-chrome";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <><Header /><main className="page-shell availability-page"><div className="page-intro"><p className="eyebrow">Glamping &amp; Homestay</p><h1>Temukan tanggal terbaik Anda.</h1><p>Glamping Deluxe dan Twin Bed dipisahkan jelas dari Homestay Standard, Superior, dan Twin Bed. Setiap angka berasal dari unit fisik, hold aktif, reservasi, dan blok operasional Shakila.</p></div><GlampingAvailabilityCalendar initial={{ checkInDate: query.checkInDate, checkOutDate: query.checkOutDate, guestCount: query.guestCount }} /></main><Footer /></>;
}
