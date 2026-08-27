import { JeepAvailabilityCalendar } from "@/components/availability-calendar";
import { Footer, Header } from "@/components/site-chrome";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const query = await searchParams;
  return <><Header /><main className="page-shell availability-page"><div className="page-intro"><p className="kicker">LIVE FLEET / PHYSICAL UNITS</p><h1>PILIH WAKTU. LIHAT ARMADA.</h1><p>Tanggal, paket, dan slot dibuka langsung dari inventory Jeep fisik Shakila Jeep Tour.</p></div><JeepAvailabilityCalendar initial={{ tourDate: query.tourDate, guestCount: query.guestCount }} /></main><Footer /></>;
}
