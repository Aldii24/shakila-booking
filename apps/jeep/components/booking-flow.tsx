"use client";
/* React Hook Form watch drives live quote refreshes; its API is intentionally not compiler-memoized. */
/* eslint-disable react-hooks/incompatible-library */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Search,
} from "lucide-react";
import { API_URL, api, message, rupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile } from "./turnstile";
import { formatDepartureTime, isDeparturePassed } from "@/lib/departure-time";
type Slot = { id: string; name: string; departureTime: string };
type Pack = {
  slug: string;
  name: string;
  description: string;
  pricePerUnit: number;
  capacityPerUnit: number;
  departureSlots: Slot[];
};
type Available = { availableQuantity: number; capacityPerUnit: number };
type Quote = {
  unitPrice: number;
  quantity: number;
  subtotalAmount: number;
  totalAmount: number;
  dpPercentage: number;
  requiredDpAmount: number;
};
type Booking = {
  bookingId: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  accessToken: string;
};
type Status = {
  bookingCode: string;
  status: string;
  paymentStatus: string;
  customerName: string;
  quantity: number;
  guestCount: number;
  subtotalAmount: number;
  totalAmount: number;
  dpPercentage: number;
  requiredDpAmount: number;
  verifiedPaidAmount: number;
  remainingAmount: number;
  expiresAt: string | null;
  productName: string;
  unitPrice: number;
  startDate: string;
  departureTime: string | null;
  invoiceStatus: string | null;
  requiresReview: boolean;
  latestProofStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  latestProofRejectionReason: string | null;
};
const key = (code: string) => `shakila-jeep-booking:${code}`;
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
export function Availability({
  initial,
}: {
  initial: { tourDate?: string; guestCount?: string };
}) {
  const router = useRouter(),
    [packs, setPacks] = useState<Pack[]>([]),
    [packageSlug, setPackage] = useState(""),
    [slotId, setSlot] = useState(""),
    [tourDate, setDate] = useState(initial.tourDate ?? ""),
    [guests, setGuests] = useState(Number(initial.guestCount ?? 4)),
    [result, setResult] = useState<Available | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    void api<Pack[]>("/public/jeep/packages").then((values) => {
      setPacks(values);
      setPackage(values[0]?.slug ?? "");
      setSlot(
        values[0]?.departureSlots.find(
          (slot) =>
            !isDeparturePassed(initial.tourDate ?? "", slot.departureTime),
        )?.id ?? "",
      );
    });
  }, [initial.tourDate]);
  const pack = packs.find((p) => p.slug === packageSlug);
  const search = async () => {
    setLoading(true);
    setError("");
    try {
      setResult(
        await api<Available>("/public/jeep/availability", {
          method: "POST",
          body: JSON.stringify({
            packageSlug,
            tourDate,
            departureSlotId: slotId,
            guestCount: guests,
          }),
        }),
      );
    } catch (e) {
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
    } finally {
      setLoading(false);
    }
  };
  const minimum = pack ? Math.ceil(guests / pack.capacityPerUnit) : 1;
  return (
    <>
      <div className="panel form-grid">
        <Label>
          Paket
          <Select
            value={packageSlug}
            onValueChange={(value) => {
              const next = packs.find((item) => item.slug === value);
              setPackage(value);
              setSlot(next?.departureSlots.find((slot) => !isDeparturePassed(tourDate, slot.departureTime))?.id ?? "");
              setResult(null);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Pilih paket" /></SelectTrigger>
            <SelectContent>
            {packs.map((p) => (
              <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </Label>
        <Label>
          Tanggal
          <Input
            min={today()}
            type="date"
            value={tourDate}
            onChange={(e) => {
              const nextDate = e.target.value;
              setDate(nextDate);
              setSlot(
                pack?.departureSlots.find(
                  (slot) => !isDeparturePassed(nextDate, slot.departureTime),
                )?.id ?? "",
              );
              setResult(null);
            }}
          />
        </Label>
        <Label>
          Slot keberangkatan
          <Select value={slotId} onValueChange={setSlot}>
            <SelectTrigger><SelectValue placeholder="Pilih slot" /></SelectTrigger>
            <SelectContent>
            {pack?.departureSlots.map((s) => (
              <SelectItem key={s.id} value={s.id} disabled={isDeparturePassed(tourDate, s.departureTime)}>{s.name} · {formatDepartureTime(s.departureTime)}{isDeparturePassed(tourDate, s.departureTime) ? " · sudah lewat" : ""}</SelectItem>
            ))}
            </SelectContent>
          </Select>
        </Label>
        <Label>
          Tamu
          <Input
            min="1"
            type="number"
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </Label>
        <Button
          className="button full"
          onClick={() => void search()}
          disabled={loading || !slotId || !tourDate}
        >
          {loading ? "MEMERIKSA ARMADA..." : "CEK JEEP TERSEDIA"}
        </Button>
      </div>
      {error ? <p className="status-note error-note">{error}</p> : null}
      {result && pack ? (
        <article className="result-card">
          <div>
            <p className="kicker">LIVE PHYSICAL INVENTORY</p>
            <h3>{pack.name}</h3>
            <p>
              {result.availableQuantity} Jeep tersedia pada slot ini · kapasitas{" "}
              {pack.capacityPerUnit} tamu/Jeep
            </p>
            <strong>{rupiah(pack.pricePerUnit)} / Jeep</strong>
            <p>
              Jumlah minimum untuk {guests} tamu: <b>{minimum} Jeep</b>
            </p>
          </div>
          {result.availableQuantity >= minimum ? (
            <Button
              className="button"
              onClick={() =>
                router.push(
                  `/booking?${new URLSearchParams({ packageSlug, tourDate, departureSlotId: slotId, guestCount: String(guests), quantity: String(minimum) })}`,
                )
              }
            >
              PILIH {minimum} JEEP <ArrowRight />
            </Button>
          ) : (
            <span className="status-note error-note">
              ARMADA TIDAK MENCUKUPI
            </span>
          )}
        </article>
      ) : null}
    </>
  );
}
type Form = {
  fullName: string;
  email: string;
  whatsapp: string;
  guestCount: number;
  quantity: number;
  specialRequest: string;
};
export function BookingForm({
  selection,
}: {
  selection: {
    packageSlug: string;
    tourDate: string;
    departureSlotId: string;
    guestCount: string;
    quantity: string;
  };
}) {
  const router = useRouter(),
    { register, handleSubmit, watch } = useForm<Form>({
      defaultValues: {
        guestCount: Number(selection.guestCount || 4),
        quantity: Number(selection.quantity || 1),
      },
    }),
    [pack, setPack] = useState<Pack | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [human, setHuman] = useState("");
  const submissionLocked = useRef(false);
  const qty = watch("quantity"),
    guests = watch("guestCount");
  useEffect(() => {
    void api<Pack>(`/public/jeep/packages/${selection.packageSlug}`).then(
      setPack,
    );
  }, [selection.packageSlug]);
  useEffect(() => {
    if (!qty || !guests) return;
    void api<Quote>("/public/bookings/quote", {
      method: "POST",
      body: JSON.stringify({
        business: "jeep",
        packageSlug: selection.packageSlug,
        tourDate: selection.tourDate,
        departureSlotId: selection.departureSlotId,
        quantity: Number(qty),
        guestCount: Number(guests),
      }),
    })
      .then(setQuote)
      .catch((e) =>
        setError(message(e instanceof Error ? e.message : "NETWORK_ERROR")),
      );
  }, [selection, qty, guests]);
  const submit = handleSubmit(async (v) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    setBusy(true);
    setError("");
    try {
      const b = await api<Booking>("/public/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          business: "jeep",
          reservation: {
            packageSlug: selection.packageSlug,
            tourDate: selection.tourDate,
            departureSlotId: selection.departureSlotId,
            quantity: Number(v.quantity),
            guestCount: Number(v.guestCount),
          },
          customer: {
            fullName: v.fullName,
            email: v.email,
            whatsapp: v.whatsapp,
          },
          specialRequest: v.specialRequest || null,
          turnstileToken: human || undefined,
        }),
      });
      sessionStorage.setItem(key(b.bookingCode), b.accessToken);
      router.push(`/booking/payment?bookingCode=${b.bookingCode}`);
    } catch (e) {
      submissionLocked.current = false;
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
      setBusy(false);
    }
  });
  const slot = pack?.departureSlots.find(
    (s) => s.id === selection.departureSlotId,
  );
  return (
    <div className="flow-grid">
      <form className="panel form-grid" onSubmit={submit}>
        <Label>
          Nama lengkap
          <Input {...register("fullName", { required: true })} />
        </Label>
        <Label>
          Email
          <Input type="email" {...register("email", { required: true })} />
        </Label>
        <Label>
          WhatsApp
          <Input {...register("whatsapp", { required: true })} />
        </Label>
        <Label>
          Jumlah tamu
          <Input
            type="number"
            min="1"
            {...register("guestCount", { valueAsNumber: true })}
          />
        </Label>
        <Label>
          Jumlah Jeep
          <Input
            type="number"
            min="1"
            {...register("quantity", { valueAsNumber: true })}
          />
        </Label>
        <Label className="full">
          Permintaan khusus
          <Textarea {...register("specialRequest")} />
        </Label>
        <Turnstile onToken={setHuman} />
        {error ? <p className="status-note error-note full">{error}</p> : null}
        <Button className="button full" disabled={busy || !quote}>
          {busy ? "MENGUNCI ARMADA..." : "LANJUT KE PEMBAYARAN"}
        </Button>
      </form>
      <aside className="summary">
        <p className="kicker">TRIP MANIFEST</p>
        <h3>{pack?.name ?? "MEMUAT..."}</h3>
        <div>
          <span>Tanggal</span>
          <b>{selection.tourDate}</b>
        </div>
        <div>
          <span>Berangkat</span>
          <b>{slot ? formatDepartureTime(slot.departureTime) : "—"}</b>
        </div>
        <div>
          <span>Tamu / Jeep</span>
          <b>
            {guests} / {qty}
          </b>
        </div>
        <div>
          <span>Harga per Jeep</span>
          <b>{quote ? rupiah(quote.unitPrice) : "—"}</b>
        </div>
        <div className="total">
          <span>Total</span>
          <b>{quote ? rupiah(quote.totalAmount) : "—"}</b>
        </div>
        <div>
          <span>DP ({quote?.dpPercentage ?? "—"}%)</span>
          <b>{quote ? rupiah(quote.requiredDpAmount) : "—"}</b>
        </div>
        <div>
          <span>Sisa</span>
          <b>
            {quote ? rupiah(quote.totalAmount - quote.requiredDpAmount) : "—"}
          </b>
        </div>
      </aside>
    </div>
  );
}
function useStatus(code: string) {
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem(key(code));
    if (!token) {
      setError("ACCESS_TOKEN_MISSING");
      return null;
    }
    try {
      const s = await api<Status>(`/public/bookings/${code}/status`, {
        headers: { Authorization: `Booking ${token}` },
      });
      setStatus(s);
      setError("");
      return s;
    } catch (e) {
      setError(e instanceof Error ? e.message : "NETWORK_ERROR");
      return null;
    }
  }, [code]);
  return { status, error, setError, refresh };
}
function PaymentGatewayLegacy({ bookingCode }: { bookingCode: string }) {
  const router = useRouter(),
    { status, error, setError, refresh } = useStatus(bookingCode),
    [seconds, setSeconds] = useState(0),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState<{
      provider: string;
      orderId: string;
      amount: number;
      checkoutUrl: string | null;
      demo?: boolean;
    } | null>(null);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!status?.expiresAt) return;
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.floor((Date.parse(status.expiresAt!) - Date.now()) / 1000),
        ),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status?.expiresAt]);
  useEffect(() => {
    if (status?.status !== "WAITING_PAYMENT") return;
    let n = 0;
    const id = setInterval(async () => {
      n++;
      const s = await refresh();
      if (s?.status === "CONFIRMED")
        router.push(`/booking/success?bookingCode=${bookingCode}`);
      if (n >= 24) clearInterval(id);
    }, 5000);
    return () => clearInterval(id);
  }, [status?.status, refresh, bookingCode, router]);
  const pay = async () => {
    const token = sessionStorage.getItem(key(bookingCode));
    if (!token) return;
    setBusy(true);
    try {
      const p = await api<{
        provider: string;
        orderId: string;
        amount: number;
        checkoutUrl: string | null;
        demo?: boolean;
      }>(`/public/bookings/${bookingCode}/payments`, {
        method: "POST",
        headers: { Authorization: `Booking ${token}` },
      });
      if (p.checkoutUrl) location.assign(p.checkoutUrl);
      else {
        setAttempt(p);
        setBusy(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "NETWORK_ERROR");
      setBusy(false);
    }
  };
  const settle = async (outcome: "complete" | "fail") => {
    const token = sessionStorage.getItem(key(bookingCode));
    if (!token || !attempt) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ bookingStatus: string }>(
        `/public/bookings/${bookingCode}/payments`,
        {
          method: "POST",
          headers: { Authorization: `Booking ${token}` },
          body: JSON.stringify({ action: outcome, orderId: attempt.orderId }),
        },
      );
      if (outcome === "complete" && result.bookingStatus === "CONFIRMED")
        router.push(`/booking/success?bookingCode=${bookingCode}`);
      else {
        setAttempt(null);
        await refresh();
        setBusy(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "NETWORK_ERROR");
      setBusy(false);
    }
  };
  if (error === "ACCESS_TOKEN_MISSING")
    return (
      <div className="panel center-card">
        <h2>ACCESS REQUIRED</h2>
        <p>Buka booking dengan kode dan kontak Anda.</p>
        <Link className="button" href="/booking/check">
          CEK BOOKING
        </Link>
      </div>
    );
  if (!status)
    return (
      <div className="panel center-card">
        <div className="loader" />
        <p>MEMUAT TRIP...</p>
      </div>
    );
  const expired = status.status === "EXPIRED" || seconds === 0;
  return (
    <div className="flow-grid">
      <div className="panel">
        <p className="kicker">SECURE THE RIDE</p>
        <h2>{status.bookingCode}</h2>
        <p>
          {status.productName} · {status.startDate} ·{" "}
          {status.departureTime ? formatDepartureTime(status.departureTime) : "—"}
        </p>
        {status.status === "CONFIRMED" ? (
          <p className="status-note">
            <CheckCircle2 /> PEMBAYARAN TERVERIFIKASI
          </p>
        ) : expired ? (
          <p className="status-note error-note">
            <AlertTriangle /> HOLD BERAKHIR — ARMADA TELAH DILEPAS
          </p>
        ) : (
          <>
            <p>Selesaikan DP sebelum hitung mundur berakhir.</p>
            <div className="countdown">
              <Clock3 /> {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </div>
            {!attempt ? (
              <Button
                className="button"
                disabled={busy}
                onClick={() => void pay()}
              >
                {busy ? "MENYIAPKAN PAYMENT..." : "BUKA PAYMENT"}
              </Button>
            ) : (
              <div className="demo-gateway">
                <p className="kicker">DEMO PAYMENT GATEWAY</p>
                <h3>SIMULASI QRIS</h3>
                <p>
                  SERVER-LOCKED AMOUNT <strong>{rupiah(attempt.amount)}</strong>
                </p>
                <p>
                  <small>Mode demo — tidak ada transaksi uang nyata.</small>
                </p>
                <div className="gateway-actions">
                  <Button
                    className="button"
                    disabled={busy}
                    onClick={() => void settle("complete")}
                  >
                    {busy ? "VERIFYING..." : "SIMULATE SUCCESS"}
                  </Button>
                  <Button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void settle("fail")}
                  >
                    SIMULATE FAILURE
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {error ? (
          <p className="status-note error-note">
            {message(error)} Pembayaran mungkin tetap diterima; status belum
            terverifikasi.
          </p>
        ) : null}
        <Button variant="ghost" className="text-button" onClick={() => void refresh()}>
          PERIKSA STATUS LAGI
        </Button>
      </div>
      <aside className="summary">
        <h3>PAYMENT</h3>
        <div>
          <span>Total</span>
          <b>{rupiah(status.totalAmount)}</b>
        </div>
        <div>
          <span>DP {status.dpPercentage}%</span>
          <b>{rupiah(status.requiredDpAmount)}</b>
        </div>
        <div>
          <span>Terverifikasi</span>
          <b>{rupiah(status.verifiedPaidAmount)}</b>
        </div>
        <div className="total">
          <span>Sisa</span>
          <b>{rupiah(status.remainingAmount)}</b>
        </div>
        <p>
          Demo gateway tetap diverifikasi server dan dicatat ke database.
          Browser tidak pernah menjadi sumber kebenaran.
        </p>
      </aside>
    </div>
  );
}
void PaymentGatewayLegacy;

const proofToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
  reader.onerror = () => reject(new Error("INVALID_PAYMENT_PROOF"));
  reader.readAsDataURL(file);
});

export function PaymentPage({ bookingCode }: { bookingCode: string }) {
  const { status, error, setError, refresh } = useStatus(bookingCode);
  const [seconds, setSeconds] = useState(0), [busy, setBusy] = useState(false), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(""), [claimedAmount, setClaimedAmount] = useState(0), [submitted, setSubmitted] = useState(false);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { if (!status?.expiresAt) return; const tick=()=>setSeconds(Math.max(0,Math.floor((Date.parse(status.expiresAt!)-Date.now())/1000))); tick(); const timer=window.setInterval(tick,1000); return()=>window.clearInterval(timer); },[status?.expiresAt]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function submitProof(){const token=sessionStorage.getItem(key(bookingCode));if(!token||!file)return;if(!["image/jpeg","image/png"].includes(file.type)||file.size>5*1024*1024){setError("INVALID_PAYMENT_PROOF");return}setBusy(true);setError("");try{await api(`/public/bookings/${bookingCode}/payments`,{method:"POST",headers:{Authorization:`Booking ${token}`},body:JSON.stringify({claimedAmount:claimedAmount||status?.requiredDpAmount,fileName:file.name,mimeType:file.type,fileSize:file.size,fileDataBase64:await proofToBase64(file)})});setSubmitted(true);setFile(null);setPreview("");await refresh()}catch(caught){setError(caught instanceof Error?caught.message:"NETWORK_ERROR")}finally{setBusy(false)}}
  if(error==="ACCESS_TOKEN_MISSING")return <div className="panel center-card"><h2>Akses reservasi diperlukan</h2><p>Buka booking dengan kode dan kontak Anda.</p><Link className="button" href="/booking/check">Cek booking</Link></div>;
  if(!status)return <div className="panel center-card"><div className="loader"/><p>Memuat perjalanan...</p></div>;
  const effectiveAmount=claimedAmount||status.requiredDpAmount;
  const expired=status.status==="EXPIRED"||seconds===0,pending=status.latestProofStatus==="PENDING",approved=status.latestProofStatus==="APPROVED"||status.status==="CONFIRMED";
  const countdown=`${String(Math.floor(seconds/3600)).padStart(2,"0")}:${String(Math.floor((seconds%3600)/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  return <div className="flow-grid manual-transfer-flow"><div className="panel"><p className="kicker">TRANSFER BANK MANUAL</p><h2>{status.bookingCode}</h2><p>{status.productName} · {status.startDate} · {status.departureTime?formatDepartureTime(status.departureTime):"—"}</p>
    {approved?<p className="status-note"><CheckCircle2/> DP Terverifikasi</p>:expired?<p className="status-note error-note"><AlertTriangle/> Kedaluwarsa — armada telah dilepas.</p>:pending||submitted?<p className="status-note"><Clock3/> Bukti pembayaran sedang diverifikasi admin.</p>:status.latestProofStatus==="REJECTED"?<p className="status-note error-note"><AlertTriangle/> Bukti Ditolak. {status.latestProofRejectionReason||"Silakan unggah bukti baru."}</p>:<p className="status-note"><Clock3/> Menunggu Pembayaran</p>}
    {!approved&&!expired?<><div className="countdown"><Clock3/> {countdown}</div><div className="bank-instructions"><p className="kicker">INSTRUKSI TRANSFER</p><h3>{process.env.NEXT_PUBLIC_BANK_NAME??"Rekening demo Shakila Group"}</h3><p>{process.env.NEXT_PUBLIC_BANK_ACCOUNT??"Nomor rekening akan dikonfigurasi setelah data resmi klien diterima."}</p><strong>{process.env.NEXT_PUBLIC_BANK_HOLDER??"Shakila Group"}</strong><small>Gunakan kode booking sebagai berita transfer.</small></div>{!pending?<div className="proof-upload"><Label>Nominal yang ditransfer<Input type="number" min={status.requiredDpAmount} max={status.totalAmount} value={effectiveAmount} onChange={(event)=>setClaimedAmount(Number(event.target.value))}/></Label><Label>Bukti pembayaran (JPG, JPEG, atau PNG · maks. 5 MB)<Input type="file" accept="image/jpeg,image/png" onChange={(event)=>{const selected=event.target.files?.[0]??null;if(preview)URL.revokeObjectURL(preview);setFile(selected);setPreview(selected?URL.createObjectURL(selected):"")}}/></Label>{preview?<div className="proof-preview" role="img" aria-label="Pratinjau bukti pembayaran" style={{backgroundImage:`url(${preview})`}}/>:null}<Button className="button" disabled={busy||!file||effectiveAmount<status.requiredDpAmount} onClick={()=>void submitProof()}>{busy?"Mengunggah bukti...":"Kirim bukti pembayaran"}</Button></div>:null}</>:null}
    {error&&error!=="ACCESS_TOKEN_MISSING"?<p className="status-note error-note">Bukti belum dapat dikirim. Periksa format dan ukuran file.</p>:null}<Button variant="ghost" className="text-button" onClick={()=>void refresh()}>Periksa status</Button></div>
    <aside className="summary"><h3>Ringkasan pembayaran</h3><div><span>Total</span><b>{rupiah(status.totalAmount)}</b></div><div><span>Minimum DP ({status.dpPercentage}%)</span><b>{rupiah(status.requiredDpAmount)}</b></div><div><span>Jumlah transfer</span><b>{rupiah(status.requiredDpAmount)}</b></div><div className="total"><span>Sisa</span><b>{rupiah(status.remainingAmount)}</b></div><p>DP minimal 50% dari total booking.</p><p>Pembayaran DP maksimal 12 jam setelah booking dibuat.</p><p>DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan.</p></aside></div>;
}
export function SuccessPage({ bookingCode }: { bookingCode: string }) {
  const { status, error, refresh } = useStatus(bookingCode),
    [invoice, setInvoice] = useState<{ status: string; url?: string } | null>(
      null,
    );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (status?.status !== "CONFIRMED") return;
    const token = sessionStorage.getItem(key(bookingCode));
    if (token)
      void api<{ status: string; url?: string }>(
        `/public/bookings/${bookingCode}/invoice`,
        { headers: { Authorization: `Booking ${token}` } },
      ).then(setInvoice);
  }, [status?.status, bookingCode]);
  const securedFile = async (kind: "invoice" | "email-preview") => {
    const token = sessionStorage.getItem(key(bookingCode));
    if (!token) return;
    const suffix = kind === "invoice" ? "invoice?download=1" : "email-preview";
    const response = await fetch(
      `${API_URL}/public/bookings/${bookingCode}/${suffix}`,
      { headers: { Authorization: `Booking ${token}` }, cache: "no-store" },
    );
    if (!response.ok) return;
    const blob = await response.blob(),
      url = URL.createObjectURL(blob);
    if (kind === "invoice") {
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${bookingCode}.pdf`;
      a.click();
    } else window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  if (!status)
    return (
      <div className="panel center-card">
        <div className="loader" />
        <p>{error ? message(error) : "VERIFYING PAYMENT..."}</p>
      </div>
    );
  return (
    <div className="panel center-card">
      {status.status === "CONFIRMED" ? (
        <>
          <CheckCircle2 size={52} />
          <p className="kicker">RIDE CONFIRMED</p>
          <h1>
            SEE YOU
            <br />
            BEFORE DAWN.
          </h1>
          <p>Kode booking</p>
          <div className="countdown">{status.bookingCode}</div>
          <p>
            {status.productName} · {status.startDate}
          </p>
          <p className="status-note">DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan.</p>
          {invoice?.status === "GENERATED" ? (
            <Button
              className="button"
              onClick={() => void securedFile("invoice")}
            >
              <Download /> UNDUH INVOICE
            </Button>
          ) : (
            <p className="status-note">INVOICE SEDANG DISIAPKAN</p>
          )}
          <Button
            className="text-button"
            onClick={() => void securedFile("email-preview")}
          >
            LIHAT EMAIL PREVIEW
          </Button>
        </>
      ) : status.status === "EXPIRED" ? (
        <>
          <AlertTriangle size={52} />
          <h1>HOLD EXPIRED.</h1>
          <Link className="button" href="/availability">
            CARI SLOT BARU
          </Link>
        </>
      ) : (
        <>
          <Clock3 size={52} />
          <h1>STILL VERIFYING.</h1>
          <p>
            Pembayaran mungkin tetap diterima. Kami belum dapat memastikannya.
          </p>
          <Link
            className="button"
            href={`/booking/payment?bookingCode=${bookingCode}`}
          >
            PERIKSA KEMBALI
          </Link>
        </>
      )}
    </div>
  );
}
type Lookup = { bookingCode: string; email: string; whatsapp: string };
export function BookingLookup() {
  const router = useRouter(),
    { register, handleSubmit } = useForm<Lookup>(),
    [method, setMethod] = useState<"email" | "whatsapp">("email"),
    [human, setHuman] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = handleSubmit(async (v) => {
    setBusy(true);
    try {
      const b = await api<Booking>("/public/bookings/lookup", {
        method: "POST",
        body: JSON.stringify({
          bookingCode: v.bookingCode,
          email: method === "email" ? v.email : undefined,
          whatsapp: method === "whatsapp" ? v.whatsapp : undefined,
          turnstileToken: human || undefined,
        }),
      });
      sessionStorage.setItem(key(b.bookingCode), b.accessToken);
      router.push(`/booking/success?bookingCode=${b.bookingCode}`);
    } catch (e) {
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
    } finally {
      setBusy(false);
    }
  });
  return (
    <form className="panel form-grid booking-lookup" onSubmit={submit}>
      <Label className="full">
        BOOKING CODE
        <Input {...register("bookingCode", { required: true })} />
      </Label>
      <Tabs className="full lookup-tabs" value={method} onValueChange={(value) => setMethod(value as "email" | "whatsapp")}>
        <TabsList><TabsTrigger value="email">EMAIL</TabsTrigger><TabsTrigger value="whatsapp">WHATSAPP</TabsTrigger></TabsList>
      </Tabs>
      {method === "email" ? (
        <Label className="full">
          EMAIL
          <Input type="email" {...register("email", { required: true })} />
        </Label>
      ) : (
        <Label className="full">
          WHATSAPP
          <Input {...register("whatsapp", { required: true })} />
        </Label>
      )}
      <Turnstile onToken={setHuman} />
      {error ? <p className="status-note error-note full">{error}</p> : null}
      <Button className="button full" disabled={busy}>
        <Search /> {busy ? "SEARCHING..." : "OPEN BOOKING"}
      </Button>
    </form>
  );
}
