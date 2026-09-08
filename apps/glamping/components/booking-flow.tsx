"use client";
/* React Hook Form watch drives live quote refreshes; its API is intentionally not compiler-memoized. */
/* eslint-disable react-hooks/incompatible-library */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  Search,
  ShieldCheck,
} from "lucide-react";
import { API_URL, api, message, rupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile } from "./turnstile";
import { ProofFilePicker } from "@/components/ui/proof-file-picker";
type Product = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  capacityPerUnit: number;
  kind: "GLAMPING" | "HOMESTAY";
  breakfastIncludedPax: number | null;
  isDemoData: boolean;
  pricePerPackage?: number;
  additionalNightPrice?: number;
  accommodationName?: string;
  nightCount?: number;
};
type Availability = {
  slug: string;
  availableQuantity: number;
  capacityPerUnit: number;
};
type Quote = {
  unitPrice: number;
  nightCount: number;
  quantity: number;
  subtotalAmount: number;
  totalAmount: number;
  dpPercentage: number;
  requiredDpAmount: number;
  additionalNightPrice?: number;
  additionalNightCount?: number;
};
type Booking = {
  bookingId: string;
  bookingCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  requiredDpAmount: number;
  expiresAt: string;
  accessToken: string;
};
type Status = {
  bookingCode: string;
  bookingType: string;
  accommodationKind: "GLAMPING" | "HOMESTAY" | null;
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
  nightCount: number | null;
  startDate: string;
  endDate: string | null;
  invoiceStatus: string | null;
  invoiceNumber: string | null;
  requiresReview: boolean;
  latestProofStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  latestProofRejectionReason: string | null;
};
const bookingStatusLabel = (status:string) => ({PENDING:"Menunggu",WAITING_PAYMENT:"Menunggu Pembayaran",CONFIRMED:"Dikonfirmasi",CHECKED_IN:"Sudah Check-in",CHECKED_OUT:"Sudah Check-out",COMPLETED:"Selesai",CANCELLED:"Dibatalkan",EXPIRED:"Kedaluwarsa"} as Record<string,string>)[status] ?? "Sedang diproses";
const tokenKey = (code: string) => `shakila-glamping-booking:${code}`;
const paymentDraftKey = (code: string) => `shakila-glamping-payment-draft:${code}`;
type RememberedBookingAccess = { token: string; expiresAt: number };
function tokenExpiry(token: string) {
  try {
    const encoded = token.split(".")[0];
    if (!encoded) return Date.now() + 86_400_000;
    const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : Date.now() + 86_400_000;
  } catch {
    return Date.now() + 86_400_000;
  }
}
function rememberBookingAccess(code: string, token: string) {
  const value: RememberedBookingAccess = { token, expiresAt: tokenExpiry(token) };
  sessionStorage.setItem(tokenKey(code), token);
  try { localStorage.setItem(tokenKey(code), JSON.stringify(value)); } catch { /* session recovery remains available */ }
}
function getBookingAccess(code: string) {
  const active = sessionStorage.getItem(tokenKey(code));
  if (active) return active;
  try {
    const stored = localStorage.getItem(tokenKey(code));
    if (!stored) return null;
    const value = JSON.parse(stored) as RememberedBookingAccess;
    if (!value.token || value.expiresAt <= Date.now()) {
      localStorage.removeItem(tokenKey(code));
      return null;
    }
    sessionStorage.setItem(tokenKey(code), value.token);
    return value.token;
  } catch {
    localStorage.removeItem(tokenKey(code));
    return null;
  }
}
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
export function Availability({
  initial,
}: {
  initial: { checkInDate?: string; checkOutDate?: string; guestCount?: string };
}) {
  const router = useRouter(),
    [query, setQuery] = useState({
      checkInDate: initial.checkInDate ?? "",
      checkOutDate: initial.checkOutDate ?? "",
      guestCount: Number(initial.guestCount ?? 2),
    }),
    [products, setProducts] = useState<Product[]>([]),
    [availability, setAvailability] = useState<Availability[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const search = useCallback(async () => {
    if (!query.checkInDate || !query.checkOutDate) return;
    setLoading(true);
    setError("");
    try {
      const [p, a] = await Promise.all([
        api<Product[]>("/public/glamping/types"),
        api<Availability[]>("/public/glamping/availability", {
          method: "POST",
          body: JSON.stringify(query),
        }),
      ]);
      setProducts(p);
      setAvailability(a);
    } catch (e) {
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
    } finally {
      setLoading(false);
    }
  }, [query]);
  useEffect(() => {
    if (!initial.checkInDate || !initial.checkOutDate) return;
    const id = setTimeout(() => void search(), 0);
    return () => clearTimeout(id);
  }, [initial.checkInDate, initial.checkOutDate, search]);
  return (
    <>
      <div className="panel">
        <div className="form-grid">
          <label>
            Check-in
            <Input
              min={today()}
              type="date"
              value={query.checkInDate}
              onChange={(e) =>
                setQuery({ ...query, checkInDate: e.target.value })
              }
            />
          </label>
          <label>
            Check-out
            <Input
              min={query.checkInDate || today()}
              type="date"
              value={query.checkOutDate}
              onChange={(e) =>
                setQuery({ ...query, checkOutDate: e.target.value })
              }
            />
          </label>
          <label>
            Tamu
            <Input
              min="1"
              type="number"
              value={query.guestCount}
              onChange={(e) =>
                setQuery({ ...query, guestCount: Number(e.target.value) })
              }
            />
          </label>
          <Button
            className="button"
            onClick={() => void search()}
            disabled={loading}
          >
            {loading ? "Memeriksa..." : "Cek Ketersediaan"}
          </Button>
        </div>
      </div>
      {error ? (
        <p className="status-note error-note">
          <AlertCircle size={17} />
          {error}
        </p>
      ) : null}
      <div className="results">
        {availability.map((item) => {
          const p = products.find((x) => x.slug === item.slug);
          if (!p) return null;
          const params = new URLSearchParams({
            productSlug: p.slug,
            checkInDate: query.checkInDate,
            checkOutDate: query.checkOutDate,
            guestCount: String(query.guestCount),
            quantity: "1",
          });
          return (
            <article className="result-card" key={item.slug}>
              <div>
                <p className="eyebrow">
                  {item.availableQuantity > 0
                    ? `${item.availableQuantity} unit tersedia`
                    : "Habis pada tanggal ini"}
                </p>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <p className="price">
                  {rupiah(p.basePrice)} / unit / malam · kapasitas {p.capacityPerUnit} tamu
                </p>
              </div>
              {item.availableQuantity > 0 ? (
                <Button
                  className="button"
                  onClick={() => router.push(`/booking?${params}`)}
                >
                  Pilih akomodasi <ArrowRight size={17} />
                </Button>
              ) : (
                <span className="status-note">Pilih tanggal lain</span>
              )}
            </article>
          );
        })}
      </div>
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
    productSlug: string;
    bundleSlug: string;
    checkInDate: string;
    checkOutDate: string;
    guestCount: string;
    quantity: string;
  };
}) {
  const router = useRouter(),
    {
      register,
      handleSubmit,
      watch,
      formState: { errors },
    } = useForm<Form>({
      defaultValues: {
        guestCount: Number(selection.guestCount || 2),
        quantity: Number(selection.quantity || 1),
      },
    }),
    [product, setProduct] = useState<Product | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [turnstileToken, setTurnstileToken] = useState("");
  const submissionLocked = useRef(false);
  const isBundle = Boolean(selection.bundleSlug);
  const quantity = watch("quantity"),
    guestCount = watch("guestCount");
  useEffect(() => {
    const slug = isBundle ? selection.bundleSlug : selection.productSlug;
    if (!slug) return;
    void api<Product>(isBundle ? `/public/glamping/bundles/${slug}` : `/public/glamping/types/${slug}`)
      .then(setProduct)
      .catch(() => setError(message("NETWORK_ERROR")));
  }, [isBundle, selection.bundleSlug, selection.productSlug]);
  useEffect(() => {
    const slug = isBundle ? selection.bundleSlug : selection.productSlug;
    if (!slug || !quantity || !guestCount) return;
    void api<Quote>("/public/bookings/quote", {
      method: "POST",
      body: JSON.stringify({
        business: isBundle ? "bundle" : "glamping",
        ...(isBundle ? { bundleSlug: selection.bundleSlug } : { productSlug: selection.productSlug }),
        checkInDate: selection.checkInDate,
        checkOutDate: selection.checkOutDate,
        quantity: Number(quantity),
        guestCount: Number(guestCount),
      }),
    })
      .then(setQuote)
      .catch((e) =>
        setError(message(e instanceof Error ? e.message : "NETWORK_ERROR")),
      );
  }, [isBundle, selection, quantity, guestCount]);
  const submit = handleSubmit(async (values) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    setBusy(true);
    setError("");
    try {
      const booking = await api<Booking>("/public/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          business: isBundle ? "bundle" : "glamping",
          reservation: isBundle ? {
            bundleSlug: selection.bundleSlug,
            checkInDate: selection.checkInDate,
            checkOutDate: selection.checkOutDate,
            quantity: Number(values.quantity),
            guestCount: Number(values.guestCount),
          } : {
            productSlug: selection.productSlug,
            checkInDate: selection.checkInDate,
            checkOutDate: selection.checkOutDate,
            quantity: Number(values.quantity),
            guestCount: Number(values.guestCount),
          },
          customer: {
            fullName: values.fullName,
            email: values.email,
            whatsapp: values.whatsapp,
          },
          specialRequest: values.specialRequest || null,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      rememberBookingAccess(booking.bookingCode, booking.accessToken);
      router.push(`/booking/payment?bookingCode=${booking.bookingCode}`);
    } catch (e) {
      submissionLocked.current = false;
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
      setBusy(false);
    }
  });
  return (
    <div className="flow-grid">
      <form className="panel form-grid" onSubmit={submit}>
        <Label>
          Nama lengkap
          <Input {...register("fullName", { required: true, minLength: 2 })} />
          {errors.fullName ? <span>Nama wajib diisi.</span> : null}
        </Label>
        <Label>
          Email
          <Input type="email" {...register("email", { required: true })} />
        </Label>
        <Label>
          WhatsApp
          <Input
            placeholder="0812…"
            {...register("whatsapp", { required: true })}
          />
        </Label>
        <Label>
          Jumlah tamu
          <Input
            type="number"
            min="1"
            {...register("guestCount", { valueAsNumber: true, required: true })}
          />
        </Label>
        <Label>
          Jumlah unit
          <Input
            type="number"
            min="1"
            {...register("quantity", { valueAsNumber: true, required: true })}
          />
        </Label>
        <Label className="full">
          Permintaan khusus
          <Textarea {...register("specialRequest")} />
        </Label>
        <div className="full">
          <Turnstile action="booking" onToken={setTurnstileToken} />
        </div>
        {error ? <p className="status-note error-note full">{error}</p> : null}
        <Button className="button full" type="submit" disabled={busy || !quote}>
          {busy ? "Membuat reservasi..." : "Lanjut ke pembayaran"}
        </Button>
      </form>
      <aside className="summary">
        <p className="eyebrow">Ringkasan reservasi</p>
        {product ? <span className={`accommodation-booking-kind ${isBundle ? "bundle" : product.kind?.toLowerCase()}`}>{isBundle ? "Akomodasi + Jeep" : product.kind === "HOMESTAY" ? "Homestay" : "Glamping"}</span> : null}
        <h3>{product?.name ?? "Memuat akomodasi..."}</h3>
        <div>
          <span>Tanggal</span>
          <strong>
            {selection.checkInDate} — {selection.checkOutDate}{isBundle ? " · 1 kali tour Jeep" : ""}
          </strong>
        </div>
        <div>
          <span>{isBundle ? "Harga paket" : "Harga unit"}</span>
          <strong>{quote ? rupiah(quote.unitPrice) : "—"}</strong>
        </div>
        <div>
          <span>Malam</span>
          <strong>{quote?.nightCount ?? "—"}</strong>
        </div>
        {isBundle && quote && quote.additionalNightCount ? <div>
          <span>Tambahan {quote.additionalNightCount} malam × {quantity} paket</span>
          <strong>{rupiah((quote.additionalNightPrice ?? 0) * quote.additionalNightCount * Number(quantity))}</strong>
        </div> : null}
        <div>
          <span>Jumlah</span>
          <strong>{quantity || "—"}</strong>
        </div>
        <div>
          <span>Subtotal</span>
          <strong>{quote ? rupiah(quote.subtotalAmount) : "—"}</strong>
        </div>
        <div className="total">
          <span>Total</span>
          <strong>{quote ? rupiah(quote.totalAmount) : "—"}</strong>
        </div>
        <div>
          <span>DP ({quote?.dpPercentage ?? "—"}%) / Bayar sekarang</span>
          <strong>{quote ? rupiah(quote.requiredDpAmount) : "—"}</strong>
        </div>
        <div>
          <span>Sisa di lokasi</span>
          <strong>
            {quote ? rupiah(quote.totalAmount - quote.requiredDpAmount) : "—"}
          </strong>
        </div>
      </aside>
    </div>
  );
}
function useBookingStatus(code: string) {
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const token = getBookingAccess(code);
    if (!token) {
      setError("ACCESS_TOKEN_MISSING");
      return null;
    }
    try {
      const value = await api<Status>(`/public/bookings/${code}/status`, {
        headers: { Authorization: `Booking ${token}` },
      });
      setStatus(value);
      setError("");
      return value;
    } catch (e) {
      setError(e instanceof Error ? e.message : "NETWORK_ERROR");
      return null;
    }
  }, [code]);
  return { status, error, refresh, setError };
}
const proofToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
  reader.onerror = () => reject(new Error("INVALID_PAYMENT_PROOF"));
  reader.readAsDataURL(file);
});

export function PaymentPage({ bookingCode }: { bookingCode: string }) {
  const { status, error, refresh, setError } = useBookingStatus(bookingCode);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [proofHuman, setProofHuman] = useState("");
  const [proofChallenge, setProofChallenge] = useState(0);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    let saved = 0;
    try { saved = Number(localStorage.getItem(paymentDraftKey(bookingCode)) ?? 0); } catch { return; }
    if (!Number.isFinite(saved) || saved <= 0) return;
    const frame = window.requestAnimationFrame(() => setClaimedAmount(saved));
    return () => window.cancelAnimationFrame(frame);
  }, [bookingCode]);
  useEffect(() => {
    if (claimedAmount > 0) try { localStorage.setItem(paymentDraftKey(bookingCode), String(claimedAmount)); } catch { /* optional draft only */ }
  }, [bookingCode, claimedAmount]);
  useEffect(() => {
    if (!status?.expiresAt) return;
    const tick = () => setSeconds(Math.max(0, Math.floor((Date.parse(status.expiresAt!) - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [status?.expiresAt]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!file || submitted) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [file, submitted]);
  function selectProof(selected: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(selected ? URL.createObjectURL(selected) : "");
  }
  async function submitProof() {
    const token = getBookingAccess(bookingCode);
    if (!token || !file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) { setError("INVALID_PAYMENT_PROOF"); return; }
    setBusy(true); setError("");
    try {
      await api(`/public/bookings/${bookingCode}/payments`, { method: "POST", headers: { Authorization: `Booking ${token}` }, body: JSON.stringify({ claimedAmount: claimedAmount || status?.requiredDpAmount, fileName: file.name, mimeType: file.type, fileSize: file.size, fileDataBase64: await proofToBase64(file), turnstileToken: proofHuman || undefined }) });
      setSubmitted(true); setFile(null); setPreview(""); try { localStorage.removeItem(paymentDraftKey(bookingCode)); } catch { /* optional draft only */ } await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "NETWORK_ERROR"); setProofHuman(""); setProofChallenge((value) => value + 1); }
    finally { setBusy(false); }
  }
  if (error === "ACCESS_TOKEN_MISSING") return <div className="panel center-card"><h2>Akses reservasi diperlukan</h2><p>Buka kembali booking melalui kode dan kontak Anda.</p><Link className="button" href="/booking/check">Cek booking</Link></div>;
  if (!status) return <div className="panel center-card"><div className="loader"/><p>Memuat reservasi...</p></div>;
  const effectiveAmount = claimedAmount || status.requiredDpAmount;
  const homestay = status.accommodationKind === "HOMESTAY";
  const bankName = homestay ? process.env.NEXT_PUBLIC_HOMESTAY_BANK_NAME : process.env.NEXT_PUBLIC_GLAMPING_BANK_NAME;
  const bankAccount = homestay ? process.env.NEXT_PUBLIC_HOMESTAY_BANK_ACCOUNT : process.env.NEXT_PUBLIC_GLAMPING_BANK_ACCOUNT;
  const bankHolder = homestay ? process.env.NEXT_PUBLIC_HOMESTAY_BANK_HOLDER : process.env.NEXT_PUBLIC_GLAMPING_BANK_HOLDER;
  const adminWhatsapp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "085148357152";
  const expired = status.status === "EXPIRED" || seconds === 0;
  const pending = status.latestProofStatus === "PENDING";
  const approved = status.latestProofStatus === "APPROVED" || status.status === "CONFIRMED";
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return <div className="flow-grid manual-transfer-flow">
    <div className="panel">
      <p className="eyebrow">Transfer bank manual</p><h2>{status.bookingCode}</h2>
      <p>{status.productName} · {status.startDate}{status.endDate ? ` — ${status.endDate}` : ""}</p>
      <p className="payment-recovery-note"><ShieldCheck aria-hidden="true"/> Halaman ini aman untuk di-refresh. Akses booking dan nominal transfer disimpan selama maksimal 24 jam di perangkat ini. Demi privasi, foto bukti yang belum dikirim harus dipilih kembali.</p>
      {approved ? <p className="status-note"><CheckCircle2/> DP Terverifikasi</p> : expired ? <p className="status-note error-note"><AlertCircle/> Kedaluwarsa — inventori telah dilepas.</p> : pending || submitted ? <p className="status-note"><Clock3/> Bukti pembayaran sedang menunggu verifikasi Admin.</p> : status.latestProofStatus === "REJECTED" ? <p className="status-note error-note"><AlertCircle/> Bukti Pembayaran Ditolak. {status.latestProofRejectionReason || "Silakan unggah bukti yang benar."}</p> : <p className="status-note"><Clock3/> Menunggu Pembayaran</p>}
      {!approved && !expired ? <>
        <div className="countdown"><Clock3/> {hours}:{minutes}:{secs}</div>
        <div className="bank-instructions"><p className="eyebrow">Instruksi transfer</p><h3>{bankName ?? (homestay ? "BRI" : "BCA")}</h3><p>{bankAccount ?? (homestay ? "6772-0101-3427-537" : "394-075-8211")}</p><strong>a.n. {bankHolder ?? (homestay ? "Afandi" : "Siti Anisah")}</strong><small>Transfer minimal sebesar DP dan gunakan kode booking sebagai berita transfer.</small><a href={`https://wa.me/62${adminWhatsapp.replace(/\D/g, "").replace(/^0/, "")}`} target="_blank" rel="noreferrer">Bantuan Admin: {adminWhatsapp}</a></div>
        {!pending ? <div className="proof-upload">
          <Label>Nominal yang ditransfer<Input type="number" min={status.requiredDpAmount} max={status.totalAmount} value={effectiveAmount} onChange={(event) => setClaimedAmount(Number(event.target.value))}/></Label>
          <div className="proof-field"><span>Bukti pembayaran</span><ProofFilePicker file={file} onFileChange={selectProof}/></div>
          {preview ? <div className="proof-preview" role="img" aria-label="Pratinjau bukti pembayaran" style={{backgroundImage:`url(${preview})`}}/> : null}
          <Turnstile key={proofChallenge} action="payment_proof" onToken={setProofHuman} />
          <Button className="button" disabled={busy || !file || effectiveAmount < status.requiredDpAmount} onClick={() => void submitProof()}>{busy ? "Mengunggah bukti..." : "Kirim bukti pembayaran"}</Button>
        </div> : null}
      </> : null}
      {error && error !== "ACCESS_TOKEN_MISSING" ? <p className="status-note error-note">Bukti belum dapat dikirim. Pastikan format dan ukuran file sesuai, lalu coba lagi.</p> : null}
      <Button variant="ghost" className="text-button" onClick={() => void refresh()}>Periksa status</Button>
    </div>
    <aside className="summary"><h3>Ringkasan pembayaran</h3><div><span>Total</span><strong>{rupiah(status.totalAmount)}</strong></div><div><span>Minimum DP ({status.dpPercentage}%)</span><strong>{rupiah(status.requiredDpAmount)}</strong></div><div><span>Jumlah transfer</span><strong>{rupiah(status.requiredDpAmount)}</strong></div><div className="total"><span>Sisa</span><strong>{rupiah(status.remainingAmount)}</strong></div><p>DP minimal 50% dari total booking.</p><p>Pembayaran DP maksimal 12 jam setelah booking dibuat.</p><p>DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan.</p><p>Check-in mulai pukul 13.00 WIB. Check-out maksimal pukul 12.00 WIB.</p></aside>
  </div>;
}
export function SuccessPage({ bookingCode }: { bookingCode: string }) {
  const { status, error, refresh } = useBookingStatus(bookingCode),
    [invoice, setInvoice] = useState<{
      status: string;
      url?: string;
      fileName?: string;
    } | null>(null);
  const canAccessConfirmedDocuments = Boolean(
    status && ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"].includes(status.status),
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!canAccessConfirmedDocuments) return;
    const token = getBookingAccess(bookingCode);
    if (token)
      void api<{ status: string; url?: string; fileName?: string }>(
        `/public/bookings/${bookingCode}/invoice`,
        { headers: { Authorization: `Booking ${token}` } },
      ).then(setInvoice);
  }, [canAccessConfirmedDocuments, bookingCode]);
  const securedFile = async (kind: "invoice" | "email-preview") => {
    const token = getBookingAccess(bookingCode);
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
      a.download = invoice?.fileName ?? `invois-${bookingCode}.pdf`;
      a.click();
    } else window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  if (!status)
    return (
      <div className="panel center-card">
        <div className="loader" />
        <p>{error ? message(error) : "Memverifikasi pembayaran..."}</p>
      </div>
    );

  const completedStates: Record<string, { eyebrow: string; title: string; copy: string }> = {
    CONFIRMED: {
      eyebrow: "Reservasi terkonfirmasi",
      title: "Sampai jumpa di atas awan.",
      copy: "DP telah diverifikasi dan unit Anda sudah diamankan.",
    },
    CHECKED_IN: {
      eyebrow: "Sedang menginap",
      title: "Selamat menikmati Shakila.",
      copy: "Reservasi sudah melalui proses check-in.",
    },
    CHECKED_OUT: {
      eyebrow: "Sudah check-out",
      title: "Terima kasih telah menginap bersama kami.",
      copy: "Proses check-out telah selesai dan reservasi sedang ditutup.",
    },
    COMPLETED: {
      eyebrow: "Reservasi selesai",
      title: "Semoga perjalanan ini tinggal dalam ingatan.",
      copy: "Seluruh rangkaian reservasi telah selesai.",
    },
  };
  const completedState = completedStates[status.status];
  const proofPending = status.latestProofStatus === "PENDING";
  const proofRejected = status.latestProofStatus === "REJECTED";

  return (
    <div className="panel center-card booking-status-card">
      {completedState ? (
        <>
          <CheckCircle2 size={48} />
          <p className="eyebrow">{completedState.eyebrow}</p>
          <h1>{completedState.title}</h1>
          <p>{completedState.copy}</p>
          <p>Kode booking Anda</p>
          <div className="countdown">{status.bookingCode}</div>
          <p>
            {status.productName} · {status.startDate}
            {status.endDate ? ` — ${status.endDate}` : ""}
          </p>
          <div className="booking-status-finance">
            <div><span>Total booking</span><strong>{rupiah(status.totalAmount)}</strong></div>
            <div><span>DP terverifikasi</span><strong>{rupiah(status.verifiedPaidAmount)}</strong></div>
            <div><span>Sisa pembayaran</span><strong>{rupiah(status.remainingAmount)}</strong></div>
          </div>
          {status.bookingType === "ACCOMMODATION" || status.bookingType === "BUNDLE" ? (
            <p className="status-note">Check-in mulai pukul 13.00 WIB. Check-out maksimal pukul 12.00 WIB.</p>
          ) : null}
          {status.verifiedPaidAmount > 0 ? (
            <p className="status-note">DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan.</p>
          ) : null}
          {invoice?.status === "GENERATED" ? (
            <Button
              className="button"
              onClick={() => void securedFile("invoice")}
            >
              <Download size={17} /> Unduh invois
            </Button>
          ) : status.verifiedPaidAmount > 0 ? (
            <p className="status-note">
              Invois sedang disiapkan dan akan tersedia di halaman ini.
            </p>
          ) : null}
          <Button
            className="text-button"
            onClick={() => void securedFile("email-preview")}
          >
            Lihat pratinjau surel konfirmasi
          </Button>
        </>
      ) : status.status === "EXPIRED" ? (
        <>
          <AlertCircle size={48} />
          <h1>Reservasi telah berakhir.</h1>
          <p>Inventori sudah dilepas. Silakan membuat reservasi baru.</p>
          <Link className="button" href="/availability">
            Cari tanggal baru
          </Link>
        </>
      ) : status.status === "CANCELLED" ? (
        <>
          <AlertCircle size={48} />
          <p className="eyebrow">Reservasi dibatalkan</p>
          <h1>Booking ini sudah tidak aktif.</h1>
          <p>Kode booking {status.bookingCode} tersimpan sebagai riwayat reservasi.</p>
          {status.verifiedPaidAmount > 0 ? (
            <p className="status-note error-note">DP yang telah dibayarkan tidak dapat dikembalikan apabila booking dibatalkan.</p>
          ) : null}
          <Link className="button" href="/availability">Buat reservasi baru</Link>
        </>
      ) : status.status === "WAITING_PAYMENT" ? (
        <>
          {proofRejected ? <AlertCircle size={48} /> : <Clock3 size={48} />}
          <p className="eyebrow">{proofPending ? "Menunggu verifikasi" : proofRejected ? "Bukti ditolak" : "Menunggu pembayaran"}</p>
          <h1>{proofPending ? "Bukti pembayaran sedang diperiksa." : proofRejected ? "Bukti pembayaran perlu dikirim ulang." : "Selesaikan DP untuk mengamankan reservasi."}</h1>
          <p>{proofRejected ? status.latestProofRejectionReason || "Silakan unggah bukti pembayaran yang benar sebelum batas waktu." : proofPending ? "Admin akan memeriksa mutasi rekening sebelum mengonfirmasi booking Anda." : "Pembayaran DP maksimal 12 jam setelah booking dibuat."}</p>
          <div className="countdown">{status.bookingCode}</div>
          <div className="booking-status-finance">
            <div><span>Total booking</span><strong>{rupiah(status.totalAmount)}</strong></div>
            <div><span>Minimum DP</span><strong>{rupiah(status.requiredDpAmount)}</strong></div>
            <div><span>Sisa pembayaran</span><strong>{rupiah(status.remainingAmount)}</strong></div>
          </div>
          <Link className="button" href={`/booking/payment?bookingCode=${bookingCode}`}>
            {proofPending ? "Lihat status pembayaran" : proofRejected ? "Unggah bukti baru" : "Lanjutkan pembayaran"}
          </Link>
        </>
      ) : (
        <>
          <Clock3 size={48} />
          <p className="eyebrow">Reservasi diproses</p>
          <h1>Booking sedang kami siapkan.</h1>
          <p>Status terkini: {bookingStatusLabel(status.status)}.</p>
          <Link
            className="button"
            href="/booking/check"
          >
            Periksa kembali
          </Link>
        </>
      )}
    </div>
  );
}
type Lookup = { bookingCode: string; email: string; whatsapp: string };
export function BookingLookup() {
  const router = useRouter(),
    {
      register,
      handleSubmit,
      clearErrors,
      formState: { errors },
    } = useForm<Lookup>({
      shouldUnregister: true,
      defaultValues: { bookingCode: "", email: "", whatsapp: "" },
    }),
    [method, setMethod] = useState<"email" | "whatsapp">("email"),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = handleSubmit(async (value) => {
    setBusy(true);
    setError("");
    try {
      const result = await api<Booking>("/public/bookings/lookup", {
        method: "POST",
        body: JSON.stringify({
          bookingCode: value.bookingCode,
          email: method === "email" ? value.email : undefined,
          whatsapp: method === "whatsapp" ? value.whatsapp : undefined,
          turnstileToken: token || undefined,
        }),
      });
      rememberBookingAccess(result.bookingCode, result.accessToken);
      router.push(`/booking/success?bookingCode=${result.bookingCode}`);
    } catch (e) {
      setError(message(e instanceof Error ? e.message : "NETWORK_ERROR"));
    } finally {
      setBusy(false);
    }
  });
  return (
    <form className="panel form-grid booking-lookup" onSubmit={submit}>
      <Label className="full">
        Kode booking
        <Input
          {...register("bookingCode", {
            required: "Kode booking wajib diisi.",
            minLength: { value: 8, message: "Periksa kembali kode booking Anda." },
            setValueAs: (value: string) => value.trim().toUpperCase(),
          })}
          autoCapitalize="characters"
          autoComplete="off"
          aria-invalid={Boolean(errors.bookingCode)}
          placeholder="Contoh: GLP-260830-000001"
        />
        {errors.bookingCode ? (
          <span className="field-error">{errors.bookingCode.message}</span>
        ) : null}
      </Label>
      <Tabs
        className="full lookup-tabs"
        value={method}
        onValueChange={(value) => {
          setMethod(value as "email" | "whatsapp");
          clearErrors();
          setError("");
        }}
      >
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
      </Tabs>
      {method === "email" ? (
        <Label className="full">
          Email
          <Input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            placeholder="nama@email.com"
            {...register("email", {
              required: "Email yang digunakan saat booking wajib diisi.",
              setValueAs: (value: string) => value.trim().toLowerCase(),
            })}
          />
          {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
        </Label>
      ) : (
        <Label className="full">
          WhatsApp
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.whatsapp)}
            placeholder="Contoh: 0812 3456 7890"
            {...register("whatsapp", {
              required: "Nomor WhatsApp yang digunakan saat booking wajib diisi.",
              minLength: { value: 8, message: "Periksa kembali nomor WhatsApp Anda." },
              setValueAs: (value: string) => value.trim(),
            })}
          />
          {errors.whatsapp ? (
            <span className="field-error">{errors.whatsapp.message}</span>
          ) : null}
        </Label>
      )}
      <Turnstile action="lookup" onToken={setToken} />
      {error ? <p className="status-note error-note full">{error}</p> : null}
      <Button type="submit" className="button full" disabled={busy}>
        {busy ? (
          "Mencari booking..."
        ) : (
          <>
            <Search size={17} /> Buka reservasi
          </>
        )}
      </Button>
    </form>
  );
}
