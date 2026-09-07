"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { api, message, rupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PositiveNumberInput } from "@/components/ui/positive-number-input";
import { departurePeriod } from "@/lib/departure-time";

type SlotInventory = { packageSlug: string; packageName: string; unitPrice: number; capacityPerUnit: number; departureSlotId: string; slotName: string; departureTime: string; totalUnits: number; availableUnits: number; bookingClosed: boolean };
type CalendarData = { days: { date: string; inventory: SlotInventory[] }[] };
type AvailabilityResult = { availableQuantity: number };
const dayMs = 86_400_000;
const key = (value: Date) => value.toISOString().slice(0, 10);
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
function range(month: Date) { const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)); const offset = (first.getUTCDay() + 6) % 7; const start = new Date(first.getTime() - offset * dayMs); return { startDate: key(start), endDate: key(new Date(start.getTime() + 41 * dayMs)) }; }

export function JeepAvailabilityCalendar({ initial }: { initial: { tourDate?: string; guestCount?: string } }) {
  const router = useRouter();
  const start = new Date(`${initial.tourDate ?? today()}T00:00:00Z`);
  const [month, setMonth] = useState(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1)));
  const [data, setData] = useState<CalendarData | null>(null);
  const [tourDate, setTourDate] = useState(initial.tourDate ?? today());
  const [selected, setSelected] = useState<SlotInventory | null>(null);
  const [guests, setGuests] = useState(Number(initial.guestCount ?? 4));
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState("");
  const navigationLocked = useRef(false);
  const visible = useMemo(() => range(month), [month]);
  const load = useCallback(async () => { setLoading(true); setError(""); try { setData(await api<CalendarData>("/public/jeep/calendar", { method: "POST", body: JSON.stringify(visible) })); } catch (caught) { setError(message(caught instanceof Error ? caught.message : "NETWORK_ERROR")); } finally { setLoading(false); } }, [visible]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const day = data?.days.find((item) => item.date === tourDate);
  const packages = useMemo(() => { const grouped = new Map<string, SlotInventory[]>(); for (const item of day?.inventory ?? []) grouped.set(item.packageSlug, [...(grouped.get(item.packageSlug) ?? []), item]); return [...grouped.entries()]; }, [day]);

  function choose(item: SlotInventory) { setSelected(item); setQuantity(Math.max(1, Math.ceil(guests / item.capacityPerUnit))); }
  async function continueBooking() {
    if (!selected || navigationLocked.current) return;
    navigationLocked.current = true;
    setContinuing(true); setError("");
    try {
      const result = await api<AvailabilityResult>("/public/jeep/availability", { method: "POST", body: JSON.stringify({ packageSlug: selected.packageSlug, tourDate, departureSlotId: selected.departureSlotId, guestCount: guests }) });
      const minimum = Math.ceil(guests / selected.capacityPerUnit);
      if (quantity < minimum || result.availableQuantity < quantity) throw new Error("INVENTORY_NOT_AVAILABLE");
      router.push(`/booking?${new URLSearchParams({ packageSlug: selected.packageSlug, tourDate, departureSlotId: selected.departureSlotId, guestCount: String(guests), quantity: String(quantity) })}`);
    } catch (caught) { navigationLocked.current = false; setError(message(caught instanceof Error ? caught.message : "NETWORK_ERROR")); void load(); setContinuing(false); }
  }

  return <section className="jeep-availability-calendar">
    <div className="jeep-calendar-head"><div><p className="kicker">KETERSEDIAAN ARMADA LANGSUNG · 12 JEEP FISIK</p><h2>{new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(month)}</h2></div><div><Button variant="ghost" size="icon" aria-label="Bulan sebelumnya" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft /></Button><Button variant="ghost" onClick={() => setMonth(new Date(`${today().slice(0, 7)}-01T00:00:00Z`))}>HARI INI</Button><Button variant="ghost" size="icon" aria-label="Bulan berikutnya" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><ChevronRight /></Button></div></div>
    {error ? <div className="jeep-calendar-error"><AlertTriangle /><span>{error}</span><Button variant="ghost" onClick={() => void load()}>Coba lagi</Button></div> : null}
    <div className="jeep-calendar-layout"><div className="jeep-date-grid"><div className="jeep-weekdays">{["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"].map((value) => <span key={value}>{value}</span>)}</div><div className="jeep-days">{loading ? Array.from({ length: 42 }, (_, index) => <div className="jeep-day skeleton" key={index} />) : data?.days.map((item) => { const available = Math.max(0, ...item.inventory.map((slot) => slot.availableUnits)); const closed = item.inventory.length > 0 && item.inventory.every((slot) => slot.bookingClosed); const past = item.date < today(); const outside = item.date.slice(0, 7) !== key(month).slice(0, 7); return <Button variant="ghost" key={item.date} disabled={past} onClick={() => { setTourDate(item.date); setSelected(null); }} className={`jeep-day ${outside ? "outside" : ""} ${item.date === today() ? "today" : ""} ${item.date === tourDate ? "selected" : ""}`}><b>{Number(item.date.slice(-2))}</b><span className={available ? "open" : "full"}>{closed ? "SELESAI" : available ? `${available} JEEP` : "PENUH"}</span></Button>; })}</div></div>
      <aside className="jeep-slot-panel"><p className="kicker">PILIH KEBERANGKATAN</p><h3>{new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${tourDate}T00:00:00Z`))}</h3>{packages.length ? packages.map(([slug, slots]) => <div className="package-slots" key={slug}><div><b>{slots[0]?.packageName}</b><span>{rupiah(slots[0]?.unitPrice ?? 0)} / Jeep</span></div><div>{slots.map((item) => <Button variant="outline" key={item.departureSlotId} disabled={item.bookingClosed || !item.availableUnits} className={selected?.departureSlotId === item.departureSlotId ? "selected" : ""} onClick={() => choose(item)}><span><b>{item.departureTime.slice(0, 5).replace(":", ".")} WIB</b><small>{departurePeriod(item.departureTime)} · {item.slotName}</small></span><strong>{item.bookingClosed ? "Waktu lewat" : item.availableUnits ? `Sisa ${item.availableUnits} Jeep` : "Penuh"}</strong></Button>)}</div></div>) : <p className="no-fleet">Tidak ada Jeep tersedia pada tanggal ini.</p>}
        {selected ? <div className="jeep-selection"><div><Users /><span>Maks. {selected.capacityPerUnit} tamu / Jeep</span></div><label>Jumlah tamu<PositiveNumberInput value={guests} onValueChange={(value) => { setGuests(value); setQuantity(Math.max(1, Math.ceil(value / selected.capacityPerUnit))); }} /></label><label>Jumlah Jeep<PositiveNumberInput min={Math.ceil(guests / selected.capacityPerUnit)} max={selected.availableUnits} value={quantity} onValueChange={setQuantity} /></label><p className="jeep-admin-contact">Jika membutuhkan tambahan unit Jeep atau kebutuhan khusus, silakan konfirmasi langsung ke Admin. <strong>Hubungi Admin</strong></p><Button className="button" disabled={continuing} onClick={() => void continueBooking()}>{continuing ? "Memvalidasi armada…" : "Lanjut isi data tamu"}<ArrowRight /></Button></div> : null}</aside>
    </div>
  </section>;
}
