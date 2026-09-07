"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api, message } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
const nextDay = (date: string) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
};

export function BundleAvailability({ bundleSlug, capacity }: { bundleSlug: string; capacity: number }) {
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [guests, setGuests] = useState(capacity);
  const [available, setAvailable] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function check() {
    if (!checkInDate || !checkOutDate) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ availableQuantity: number }>("/public/glamping/bundles", { method: "POST", body: JSON.stringify({ bundleSlug, checkInDate, checkOutDate }) });
      setAvailable(result.availableQuantity);
      if (result.availableQuantity >= quantity && guests <= quantity * capacity) {
        router.push(`/booking?${new URLSearchParams({ bundleSlug, checkInDate, checkOutDate, quantity: String(quantity), guestCount: String(guests) })}`);
      }
    } catch (caught) { setError(message(caught instanceof Error ? caught.message : "NETWORK_ERROR")); }
    finally { setBusy(false); }
  }

  return <div className="bundle-availability-box">
    <p className="eyebrow">Ketersediaan kamar + Jeep</p>
    <h3>Pilih lama menginap</h3>
    <div className="bundle-availability-fields">
      <Label>Tanggal check-in<Input type="date" min={today()} value={checkInDate} onChange={(event) => { const value = event.target.value; setCheckInDate(value); if (!value) setCheckOutDate(""); else if (!checkOutDate || checkOutDate <= value) setCheckOutDate(nextDay(value)); setAvailable(null); }} /></Label>
      <Label>Tanggal check-out<Input type="date" min={checkInDate ? nextDay(checkInDate) : today()} value={checkOutDate} onChange={(event) => { setCheckOutDate(event.target.value); setAvailable(null); }} /></Label>
      <Label>Jumlah paket<Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} /></Label>
      <Label>Jumlah tamu<Input type="number" min={1} max={quantity * capacity} value={guests} onChange={(event) => setGuests(Math.max(1, Number(event.target.value)))} /></Label>
    </div>
    {available !== null && available < quantity ? <p className="status-note error-note"><CheckCircle2 />Hanya {available} paket tersedia pada tanggal ini. Kurangi jumlah paket atau pilih tanggal lain.</p> : null}
    {guests > quantity * capacity ? <p className="status-note error-note">Jumlah tamu melebihi kapasitas {quantity} paket.</p> : null}
    {error ? <p className="status-note error-note">{error}</p> : null}
    <div className="bundle-availability-actions">
      <Button className="button bundle-booking-button" disabled={!checkInDate || !checkOutDate || busy || guests > quantity * capacity} onClick={() => void check()}>{busy ? "Memeriksa kamar dan Jeep..." : "Cek ketersediaan & lanjut booking"}<ArrowRight /></Button>
    </div>
    <small className="bundle-booking-help">Harga paket mencakup 1 malam dan 1 kali tour Jeep. Malam tambahan dihitung sesuai tarif kamar.</small>
  </div>;
}
