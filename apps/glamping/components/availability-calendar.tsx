"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api, message, rupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PositiveNumberInput } from "@/components/ui/positive-number-input";
import {
  accommodationKindFromSlug,
  type AccommodationKind,
} from "@/lib/accommodation-media";

type Inventory = {
  productSlug: string;
  productName: string;
  unitPrice: number;
  capacityPerUnit: number;
  totalUnits: number;
  heldUnits: number;
  confirmedUnits: number;
  blockedUnits: number;
  availableUnits: number;
};
type Day = { date: string; inventory: Inventory[] };
type CalendarData = { business: string; days: Day[] };
type AvailabilityResult = { slug: string; availableQuantity: number };

const dayMs = 86_400_000;
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const jakartaToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
const monthTitle = (date: Date) => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
const addDays = (date: string, days: number) => dateKey(new Date(new Date(`${date}T00:00:00Z`).getTime() + days * dayMs));

function visibleRange(month: Date) {
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - mondayOffset * dayMs);
  return { startDate: dateKey(start), endDate: dateKey(new Date(start.getTime() + 41 * dayMs)) };
}

function availabilityLabel(value: number) {
  if (value <= 0) return "Penuh";
  if (value === 1) return "Sisa 1";
  return `Sisa ${value}`;
}

const categoryMeta: Record<AccommodationKind, { label: string; hint: string }> = {
  GLAMPING: { label: "Glamping", hint: "Deluxe · Twin Bed" },
  HOMESTAY: { label: "Homestay", hint: "Standard · Superior · Twin Bed" },
};

function categoryAvailability(inventory: Inventory[], kind: AccommodationKind) {
  return inventory
    .filter((item) => accommodationKindFromSlug(item.productSlug) === kind)
    .reduce((total, item) => total + item.availableUnits, 0);
}

export function GlampingAvailabilityCalendar({ initial }: { initial: { checkInDate?: string; checkOutDate?: string; guestCount?: string } }) {
  const router = useRouter();
  const initialDate = initial.checkInDate ? new Date(`${initial.checkInDate}T00:00:00Z`) : new Date(`${jakartaToday()}T00:00:00Z`);
  const [month, setMonth] = useState(new Date(Date.UTC(initialDate.getUTCFullYear(), initialDate.getUTCMonth(), 1)));
  const [data, setData] = useState<CalendarData | null>(null);
  const [checkIn, setCheckIn] = useState(initial.checkInDate ?? "");
  const [checkOut, setCheckOut] = useState(initial.checkOutDate ?? "");
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState(Number(initial.guestCount ?? 2));
  const [loading, setLoading] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [error, setError] = useState("");
  const navigationLocked = useRef(false);
  const range = useMemo(() => visibleRange(month), [month]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api<CalendarData>("/public/glamping/calendar", { method: "POST", body: JSON.stringify(range) }));
    } catch (caught) {
      setError(message(caught instanceof Error ? caught.message : "NETWORK_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const days = data?.days ?? [];
  const selectedDate = checkOut || checkIn || jakartaToday();
  const detail = days.find((day) => day.date === selectedDate) ?? days.find((day) => day.date === checkIn) ?? days[0];
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!selectedType && detail?.inventory[0]) setSelectedType(detail.inventory[0].productSlug);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [detail, selectedType]);

  function selectDate(date: string) {
    if (date < jakartaToday()) return;
    if (!checkIn || checkOut || date <= checkIn) {
      setCheckIn(date);
      setCheckOut("");
      return;
    }
    setCheckOut(date);
  }

  async function continueBooking() {
    if (!checkIn || !selectedType || navigationLocked.current) return;
    navigationLocked.current = true;
    const finalCheckOut = checkOut || addDays(checkIn, 1);
    setContinuing(true);
    setError("");
    try {
      const result = await api<AvailabilityResult[]>("/public/glamping/availability", {
        method: "POST",
        body: JSON.stringify({ checkInDate: checkIn, checkOutDate: finalCheckOut, guestCount: guests, accommodationTypeSlug: selectedType }),
      });
      if ((result[0]?.availableQuantity ?? 0) < quantity) throw new Error("INVENTORY_NOT_AVAILABLE");
      router.push(`/booking?${new URLSearchParams({ productSlug: selectedType, checkInDate: checkIn, checkOutDate: finalCheckOut, guestCount: String(guests), quantity: String(quantity) })}`);
    } catch (caught) {
      navigationLocked.current = false;
      setError(message(caught instanceof Error ? caught.message : "NETWORK_ERROR"));
      void load();
      setContinuing(false);
    }
  }

  const inRange = (date: string) => checkIn && checkOut && date >= checkIn && date <= checkOut;
  return (
    <section className="availability-calendar glamping-calendar" aria-label="Kalender ketersediaan Glamping dan Homestay Shakila">
      <div className="calendar-toolbar">
        <div><p className="eyebrow">Ketersediaan langsung</p><h2>{monthTitle(month)}</h2></div>
        <div className="month-actions">
          <Button variant="ghost" size="icon" aria-label="Bulan sebelumnya" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)))}><ChevronLeft /></Button>
          <Button variant="ghost" className="today-button" onClick={() => setMonth(new Date(`${jakartaToday().slice(0, 7)}-01T00:00:00Z`))}>Hari ini</Button>
          <Button variant="ghost" size="icon" aria-label="Bulan berikutnya" onClick={() => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)))}><ChevronRight /></Button>
        </div>
      </div>
      {error ? <div className="calendar-error"><AlertCircle /><span>Tidak dapat memuat ketersediaan.</span><Button variant="ghost" onClick={() => void load()}>Coba lagi</Button></div> : null}
      <div className="calendar-layout">
        <div className="month-grid-wrap">
          <div className="accommodation-calendar-legend">
            <span><i className="glamping" />Glamping <small>Deluxe · Twin Bed</small></span>
            <span><i className="homestay" />Homestay <small>Standard · Superior · Twin Bed</small></span>
          </div>
          <div className="weekday-row">{["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="month-grid">
            {loading ? Array.from({ length: 42 }, (_, index) => <div className="calendar-day skeleton" key={index} />) : days.map((day) => {
              const currentMonth = day.date.slice(0, 7) === dateKey(month).slice(0, 7);
              const past = day.date < jakartaToday();
              const full = day.inventory.length > 0 && day.inventory.every((item) => item.availableUnits === 0);
              return <Button variant="ghost" key={day.date} disabled={past} onClick={() => selectDate(day.date)} className={`calendar-day ${currentMonth ? "" : "outside"} ${past ? "past" : ""} ${day.date === jakartaToday() ? "today" : ""} ${day.date === checkIn ? "check-in" : ""} ${day.date === checkOut ? "check-out" : ""} ${inRange(day.date) ? "in-range" : ""} ${full ? "sold-out" : ""}`}>
                <span className="day-number">{Number(day.date.slice(-2))}</span>
                <span className="day-inventory category-inventory">
                  {(["GLAMPING", "HOMESTAY"] as const).map((kind) => {
                    const available = categoryAvailability(day.inventory, kind);
                    return <span key={kind} className={available ? "available" : "full"}><i /><b>{categoryMeta[kind].label}</b><em>{availabilityLabel(available)}</em></span>;
                  })}
                </span>
              </Button>;
            })}
          </div>
        </div>
        <aside className="day-panel">
          <div><p className="eyebrow">Pilihan Anda</p><h3>{checkIn ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${checkIn}T00:00:00Z`)) : "Pilih tanggal check-in"}</h3><p>{checkOut ? `Sampai ${new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${checkOut}T00:00:00Z`))}` : checkIn ? "Pilih tanggal check-out, atau lanjut untuk 1 malam." : "Jumlah unit tersedia terlihat langsung pada setiap tanggal."}</p></div>
          <div className="availability-options grouped-availability-options">
            {(["GLAMPING", "HOMESTAY"] as const).map((kind) => {
              const items = (detail?.inventory ?? []).filter((item) => accommodationKindFromSlug(item.productSlug) === kind);
              return <section className="availability-type-group" key={kind}>
                <header><span>{categoryMeta[kind].label}</span><small>{categoryMeta[kind].hint}</small></header>
                {items.map((item) => <Button variant="outline" key={item.productSlug} disabled={!item.availableUnits} className={selectedType === item.productSlug ? "selected" : ""} onClick={() => { setSelectedType(item.productSlug); setQuantity(1); }}><span><b>{item.productName}</b><small>{rupiah(item.unitPrice)} / malam · {item.capacityPerUnit} tamu</small></span><strong>{item.availableUnits ? `${item.availableUnits} unit tersedia` : "Penuh"}</strong></Button>)}
              </section>;
            })}
          </div>
          <div className="selection-controls"><label>Jumlah unit<PositiveNumberInput value={quantity} onValueChange={setQuantity} /></label><label>Jumlah tamu<PositiveNumberInput value={guests} onValueChange={setGuests} /></label></div>
          <Button className="button continue-button" disabled={!checkIn || !selectedType || continuing} onClick={() => void continueBooking()}>{continuing ? "Memeriksa ketersediaan…" : "Lanjut isi data tamu"}<ArrowRight /></Button>
        </aside>
      </div>
    </section>
  );
}
