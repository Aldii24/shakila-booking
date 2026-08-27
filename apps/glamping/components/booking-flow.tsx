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
} from "lucide-react";
import { API_URL, api, message, rupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Turnstile } from "./turnstile";
type Product = {
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  capacityPerUnit: number;
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
};
const tokenKey = (code: string) => `shakila-glamping-booking:${code}`;
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
                  {rupiah(p.basePrice)} / unit / malam · kapasitas{" "}
                  {p.capacityPerUnit} tamu
                </p>
              </div>
              {item.availableQuantity > 0 ? (
                <Button
                  className="button"
                  onClick={() => router.push(`/booking?${params}`)}
                >
                  Pilih dome <ArrowRight size={17} />
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
  const quantity = watch("quantity"),
    guestCount = watch("guestCount");
  useEffect(() => {
    if (!selection.productSlug) return;
    void api<Product>(`/public/glamping/types/${selection.productSlug}`)
      .then(setProduct)
      .catch(() => setError(message("NETWORK_ERROR")));
  }, [selection.productSlug]);
  useEffect(() => {
    if (!selection.productSlug || !quantity || !guestCount) return;
    void api<Quote>("/public/bookings/quote", {
      method: "POST",
      body: JSON.stringify({
        business: "glamping",
        productSlug: selection.productSlug,
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
  }, [selection, quantity, guestCount]);
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
          business: "glamping",
          reservation: {
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
      sessionStorage.setItem(
        tokenKey(booking.bookingCode),
        booking.accessToken,
      );
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
          Jumlah dome
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
          <Turnstile onToken={setTurnstileToken} />
        </div>
        {error ? <p className="status-note error-note full">{error}</p> : null}
        <Button className="button full" type="submit" disabled={busy || !quote}>
          {busy ? "Membuat reservasi..." : "Lanjut ke pembayaran"}
        </Button>
      </form>
      <aside className="summary">
        <p className="eyebrow">Ringkasan reservasi</p>
        <h3>{product?.name ?? "Memuat dome..."}</h3>
        <div>
          <span>Tanggal</span>
          <strong>
            {selection.checkInDate} — {selection.checkOutDate}
          </strong>
        </div>
        <div>
          <span>Harga unit</span>
          <strong>{quote ? rupiah(quote.unitPrice) : "—"}</strong>
        </div>
        <div>
          <span>Malam</span>
          <strong>{quote?.nightCount ?? "—"}</strong>
        </div>
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
    const token = sessionStorage.getItem(tokenKey(code));
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
export function PaymentPage({ bookingCode }: { bookingCode: string }) {
  const router = useRouter(),
    { status, error, refresh, setError } = useBookingStatus(bookingCode),
    [busy, setBusy] = useState(false),
    [seconds, setSeconds] = useState(0),
    [attempt, setAttempt] = useState<{
      provider: string;
      orderId: string;
      amount: number;
      checkoutUrl: string | null;
      demo?: boolean;
    } | null>(null);
  const bookingStatus = status?.status;
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!status?.expiresAt) return;
    const tick = () =>
      setSeconds(
        Math.max(
          0,
          Math.floor(
            (new Date(status.expiresAt!).getTime() - Date.now()) / 1000,
          ),
        ),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status?.expiresAt]);
  useEffect(() => {
    if (bookingStatus !== "WAITING_PAYMENT") return;
    let tries = 0;
    const id = setInterval(async () => {
      tries++;
      const value = await refresh();
      if (value?.status === "CONFIRMED")
        router.push(`/booking/success?bookingCode=${bookingCode}`);
      if (tries >= 24) clearInterval(id);
    }, 5000);
    return () => clearInterval(id);
  }, [bookingStatus, bookingCode, refresh, router]);
  const pay = async () => {
    const token = sessionStorage.getItem(tokenKey(bookingCode));
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const payment = await api<{
        provider: string;
        orderId: string;
        amount: number;
        checkoutUrl: string | null;
        demo?: boolean;
      }>(`/public/bookings/${bookingCode}/payments`, {
        method: "POST",
        headers: { Authorization: `Booking ${token}` },
      });
      if (payment.checkoutUrl) location.assign(payment.checkoutUrl);
      else {
        setAttempt(payment);
        setBusy(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "NETWORK_ERROR");
      setBusy(false);
    }
  };
  const settle = async (outcome: "complete" | "fail") => {
    const token = sessionStorage.getItem(tokenKey(bookingCode));
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
        <h2>Akses reservasi diperlukan</h2>
        <p>Buka kembali booking melalui kode dan kontak Anda.</p>
        <Link className="button" href="/booking/check">
          Cek booking
        </Link>
      </div>
    );
  if (!status)
    return (
      <div className="panel center-card">
        <div className="loader" />
        <p>Memuat reservasi...</p>
      </div>
    );
  const expired = status.status === "EXPIRED" || seconds === 0;
  return (
    <div className="flow-grid">
      <div className="panel">
        <p className="eyebrow">Pembayaran aman</p>
        <h2>{status.bookingCode}</h2>
        <p>
          {status.productName} · {status.startDate}
          {status.endDate ? ` — ${status.endDate}` : ""}
        </p>
        {status.status === "CONFIRMED" ? (
          <p className="status-note">
            <CheckCircle2 /> Pembayaran terverifikasi. Reservasi dikonfirmasi.
          </p>
        ) : expired ? (
          <p className="status-note error-note">
            <AlertCircle /> Waktu reservasi telah berakhir. Inventori sudah
            dilepas.
          </p>
        ) : (
          <>
            <p>Selesaikan pembayaran DP sebelum waktu tunggu berakhir.</p>
            <p className="countdown">
              <Clock3 /> {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </p>
            {!attempt ? (
              <Button
                className="button"
                onClick={() => void pay()}
                disabled={busy}
              >
                {busy ? "Menyiapkan pembayaran..." : "Buka pembayaran"}
              </Button>
            ) : (
              <div className="demo-gateway">
                <p className="eyebrow">DEMO PAYMENT GATEWAY</p>
                <h3>Simulasi QRIS</h3>
                <p>
                  Nominal terkunci oleh server:{" "}
                  <strong>{rupiah(attempt.amount)}</strong>
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
                    {busy
                      ? "Memverifikasi..."
                      : "Simulasikan pembayaran berhasil"}
                  </Button>
                  <Button
                    className="text-button"
                    disabled={busy}
                    onClick={() => void settle("fail")}
                  >
                    Simulasikan gagal
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        {error ? (
          <p className="status-note error-note">
            {message(error)}
            <br />
            <small>
              Pembayaran mungkin tetap diterima. Kami belum dapat
              memverifikasinya.
            </small>
          </p>
        ) : null}
        <Button variant="ghost" className="text-button" onClick={() => void refresh()}>
          Periksa status pembayaran
        </Button>
      </div>
      <aside className="summary">
        <h3>Ringkasan</h3>
        <div>
          <span>Total</span>
          <strong>{rupiah(status.totalAmount)}</strong>
        </div>
        <div>
          <span>DP ({status.dpPercentage}%)</span>
          <strong>{rupiah(status.requiredDpAmount)}</strong>
        </div>
        <div>
          <span>Sudah diverifikasi</span>
          <strong>{rupiah(status.verifiedPaidAmount)}</strong>
        </div>
        <div className="total">
          <span>Sisa</span>
          <strong>{rupiah(status.remainingAmount)}</strong>
        </div>
        <p>
          Dalam mode demo, gateway tetap diverifikasi server dan dicatat pada
          database. State browser tidak pernah mengonfirmasi booking.
        </p>
      </aside>
    </div>
  );
}
export function SuccessPage({ bookingCode }: { bookingCode: string }) {
  const { status, error, refresh } = useBookingStatus(bookingCode),
    [invoice, setInvoice] = useState<{
      status: string;
      url?: string;
      fileName?: string;
    } | null>(null);
  const isConfirmed = status?.status === "CONFIRMED";
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!isConfirmed) return;
    const token = sessionStorage.getItem(tokenKey(bookingCode));
    if (token)
      void api<{ status: string; url?: string; fileName?: string }>(
        `/public/bookings/${bookingCode}/invoice`,
        { headers: { Authorization: `Booking ${token}` } },
      ).then(setInvoice);
  }, [isConfirmed, bookingCode]);
  const securedFile = async (kind: "invoice" | "email-preview") => {
    const token = sessionStorage.getItem(tokenKey(bookingCode));
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
      a.download = invoice?.fileName ?? `invoice-${bookingCode}.pdf`;
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
  return (
    <div className="panel center-card">
      {status.status === "CONFIRMED" ? (
        <>
          <CheckCircle2 size={48} />
          <p className="eyebrow">Reservasi terkonfirmasi</p>
          <h1>Sampai jumpa di atas awan.</h1>
          <p>Kode booking Anda</p>
          <div className="countdown">{status.bookingCode}</div>
          <p>
            {status.productName} · {status.startDate}
            {status.endDate ? ` — ${status.endDate}` : ""}
          </p>
          {invoice?.status === "GENERATED" ? (
            <Button
              className="button"
              onClick={() => void securedFile("invoice")}
            >
              <Download size={17} /> Unduh invoice
            </Button>
          ) : (
            <p className="status-note">
              Invoice sedang disiapkan dan akan tersedia di halaman ini.
            </p>
          )}
          <Button
            className="text-button"
            onClick={() => void securedFile("email-preview")}
          >
            Lihat preview email konfirmasi
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
      ) : (
        <>
          <Clock3 size={48} />
          <h1>Pembayaran masih diverifikasi.</h1>
          <p>
            Kami belum dapat memastikan status pembayaran. Pembayaran mungkin
            tetap telah diterima.
          </p>
          <Link
            className="button"
            href={`/booking/payment?bookingCode=${bookingCode}`}
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
    { register, handleSubmit } = useForm<Lookup>(),
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
      sessionStorage.setItem(tokenKey(result.bookingCode), result.accessToken);
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
          {...register("bookingCode", { required: true })}
          placeholder="GLP-260825-000001"
        />
      </Label>
      <Tabs
        className="full lookup-tabs"
        value={method}
        onValueChange={(value) => setMethod(value as "email" | "whatsapp")}
      >
        <TabsList>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
      </Tabs>
      {method === "email" ? (
        <Label className="full">
          Email
          <Input type="email" {...register("email", { required: true })} />
        </Label>
      ) : (
        <Label className="full">
          WhatsApp
          <Input {...register("whatsapp", { required: true })} />
        </Label>
      )}
      <Turnstile onToken={setToken} />
      {error ? <p className="status-note error-note full">{error}</p> : null}
      <Button className="button full" disabled={busy}>
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
