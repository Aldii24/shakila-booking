"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  FormEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  CarFront,
  Check,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  Download,
  LogOut,
  Mail,
  Menu,
  PackageSearch,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { API_URL, AdminApiError, adminApi, rupiah, text } from "@/lib/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AdminDatePicker, AdminSelect } from "./admin-controls";
import {
  AdminLanguageProvider,
  statusLabel,
  useAdminLanguage,
} from "./admin-i18n";
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Field,
  Input,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "./admin-ui";

type Row = Record<string, unknown>;
type View =
  | "dashboard"
  | "bookings"
  | "booking"
  | "calendar"
  | "inventory"
  | "payments"
  | "customers"
  | "customer"
  | "glamping"
  | "jeep"
  | "settings";
type PageData = {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  methods?: string[];
};

const nav = [
  {
    key: "overview",
    label: "nav.overview",
    items: [["/dashboard", "nav.overview", ChartNoAxesCombined]],
  },
  {
    key: "operations",
    label: "nav.operations",
    items: [
      ["/bookings", "nav.bookings", PackageSearch],
      ["/calendar", "nav.calendar", CalendarDays],
      ["/inventory", "nav.inventory", BedDouble],
      ["/payments", "nav.payments", WalletCards],
      ["/customers", "nav.customers", Users],
    ],
  },
  {
    key: "business",
    label: "nav.business",
    items: [
      ["/glamping", "nav.glamping", BedDouble],
      ["/jeep", "nav.jeep", CarFront],
    ],
  },
  {
    key: "system",
    label: "nav.system",
    items: [["/settings", "nav.settings", Settings]],
  },
] as const;

const fmtDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: String(value).includes("T") ? "short" : undefined,
        timeZone: "Asia/Jakarta",
      }).format(
        new Date(
          String(value).length === 10
            ? `${value}T00:00:00+07:00`
            : String(value),
        ),
      )
    : "—";
const queryString = (
  values: Record<string, string | number | boolean | null | undefined>,
) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined)
      params.set(key, String(value));
  });
  return params.toString();
};

const AdminBusinessContext = createContext<{
  business: string;
  setBusiness: (value: string) => void;
} | null>(null);

let sharedAdminAudioContext: AudioContext | null = null;

function getAdminAudioContext() {
  if (typeof window === "undefined") return null;
  sharedAdminAudioContext ??= new AudioContext();
  return sharedAdminAudioContext;
}

async function unlockAdminAudio() {
  const context = getAdminAudioContext();
  if (!context) return false;
  await context.resume();
  return context.state === "running";
}

function useAdminBusiness() {
  const context = useContext(AdminBusinessContext);
  if (!context) throw new Error("Admin business context is unavailable.");
  return context;
}

export function AdminRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") return children;
  return (
    <AdminLanguageProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminLanguageProvider>
  );
}

function AdminChrome({ children }: { children: React.ReactNode }) {
  const [business, setBusiness] = useState("");
  return (
    <AdminBusinessContext.Provider value={{ business, setBusiness }}>
      <Shell>{children}</Shell>
    </AdminBusinessContext.Provider>
  );
}

export function LoginPage() {
  return (
    <AdminLanguageProvider>
      <LoginContent />
    </AdminLanguageProvider>
  );
}

function LoginContent() {
  const { t } = useAdminLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("admin-notification-sound-enabled", "true");
    void unlockAdminAudio();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await adminApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      router.replace("/dashboard");
    } catch {
      setError("Email atau kata sandi tidak valid.");
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <div>
          <Image className="login-logo" src="/shakila-logo-transparent.png" alt="Shakila" width={180} height={120} priority />
          <p className="section-kicker">ADMIN SHAKILA GROUP</p>
          <h1>
            Satu grup.
            <br />
            <em>Operasional jelas.</em>
          </h1>
          <p>Satu pusat kendali untuk pengalaman menginap, perjalanan Jeep, dan setiap pembayaran.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card-head">
            <div>
              <p className="section-kicker">ADMIN SHAKILA GROUP</p>
              <h2>{t("login.welcome")}</h2>
            </div>
          </div>
          <p className="muted">{t("login.description")}</p>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="username" required />
          </Field>
          <Field label={t("login.password")}>
            <Input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          {error ? <div className="ui-alert danger">{error}</div> : null}
          <Button disabled={busy}>
            {busy ? t("login.verifying") : t("login.submit")}
          </Button>
          <small className="login-security">AKSES ADMIN SHAKILA</small>
        </form>
      </section>
    </main>
  );
}

export function AdminApp(props: { view: View; id?: string }) {
  return <AdminWorkspace {...props} />;
}

function AdminWorkspace({ view, id }: { view: View; id?: string }) {
  const router = useRouter();
  const { language, t } = useAdminLanguage();
  const { business } = useAdminBusiness();
  const [authenticated, setAuthenticated] = useState(false),
    [ready, setReady] = useState(false),
    [data, setData] = useState<unknown>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [paymentStatus, setPaymentStatus] = useState(""),
    [method, setMethod] = useState(""),
    [dateFrom, setDateFrom] = useState(""),
    [dateTo, setDateTo] = useState(""),
    [reviewOnly, setReviewOnly] = useState(false),
    [sort, setSort] = useState("createdAt"),
    [page, setPage] = useState(1);
  const endpoint = useCallback(() => {
    if (view === "dashboard")
      return `/dashboard/overview?${queryString({ business })}`;
    if (view === "bookings")
      return `/bookings?${queryString({ business, search, status, paymentStatus, dateFrom, dateTo, page, pageSize: 20 })}`;
    if (view === "booking") return `/bookings/${encodeURIComponent(id ?? "")}`;
    if (view === "payments") return "/payment-proofs";
    if (view === "customers") return `/customers?${queryString({ search })}`;
    if (view === "customer") return `/customers/${id}`;
    if (view === "calendar") {
      const start = new Date();
      const end = new Date(Date.now() + 45 * 86_400_000);
      return `/calendar?${queryString({ business, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) })}`;
    }
    if (view === "inventory") return "/inventory/units";
    if (view === "glamping") return "/glamping/types";
    if (view === "jeep") return "/jeep/packages";
    return "/settings";
  }, [
    business,
    dateFrom,
    dateTo,
    id,
    page,
    paymentStatus,
    search,
    status,
    view,
  ]);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi(endpoint()));
      setReady(true);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "";
      if (detail.toLowerCase().includes("session")) router.replace("/login");
      else setError(t("error.generic"));
    } finally {
      setLoading(false);
    }
  }, [endpoint, router, t]);
  useEffect(() => {
    void adminApi("/me")
      .then(() => setAuthenticated(true))
      .catch(() => router.replace("/login"));
  }, [router]);
  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void load(), search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, load, search]);
  if (!ready && loading)
    return (
      <>
        <PageHeader view={view} />
        <PageSkeleton />
      </>
    );
  const filters = {
    search,
    setSearch,
    status,
    setStatus,
    paymentStatus,
    setPaymentStatus,
    method,
    setMethod,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    reviewOnly,
    setReviewOnly,
    sort,
    setSort,
    page,
    setPage,
  };
  return (
    <>
      <PageHeader view={view} />
      {view === "bookings" ? <BookingFilters filters={filters} /> : null}
      {view === "customers" ? (
        <SimpleSearch value={search} onChange={setSearch} />
      ) : null}
      {error ? (
        <div className="ui-alert danger">
          {error}
          <Button size="sm" variant="ghost" onClick={() => void load()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}
      {loading ? (
        <PageSkeleton />
      ) : data == null ? (
        <EmptyState
          title={language === "id" ? "Data belum dapat dimuat" : "Data could not be loaded"}
          description={language === "id" ? "Periksa koneksi lalu coba lagi." : "Check your connection and try again."}
        />
      ) : (
        <ViewContent
          view={view}
          data={data}
          reload={load}
          onPage={(next) => {
            setPage(next);
          }}
        />
      )}
    </>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset className="workspace">
        <AdminTopbar />
        <main className="content">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar() {
  const pathname = usePathname(),
    router = useRouter();
  const { t } = useAdminLanguage();
  const { isMobile, setOpenMobile } = useSidebar();
  async function logout() {
    await adminApi("/auth/logout", { method: "POST" });
    router.replace("/login");
  }
  return (
    <Sidebar className="admin-sidebar" collapsible="offcanvas">
      <SidebarHeader className="sidebar-brand">
          <Image className="admin-logo" src="/shakila-logo-transparent.png" alt="Shakila" width={86} height={58} />
          <div>
            <strong>{t("brand.parent")}</strong>
            <small>{t("brand.admin")}</small>
          </div>
      </SidebarHeader>
      <SidebarContent className="sidebar-navigation">
          {nav.map((group) => (
            <SidebarGroup className="nav-group" key={group.key}>
              <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(([href, label, Icon]) => (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(href)}
                        tooltip={t(label)}
                      >
                        <Link
                          href={href}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <Icon />
                          <span>{t(label)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
      </SidebarContent>
      <SidebarFooter className="sidebar-profile">
          <span className="avatar">DA</span>
          <div>
            <strong>Administrator</strong>
            <small>Pemilik</small>
          </div>
          <Button
            title={t("common.logout")}
            variant="ghost"
            size="icon"
            onClick={() => void logout()}
          >
            <LogOut size={17} />
          </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminTopbar() {
  const router = useRouter();
  const { t } = useAdminLanguage();
  const { business, setBusiness } = useAdminBusiness();
  const { toggleSidebar } = useSidebar();
  const [proofCount,setProofCount]=useState(0),[toast,setToast]=useState(""),[soundActive,setSoundActive]=useState(false);
  const lastCount=useRef(0),audioContext=useRef<AudioContext|null>(sharedAdminAudioContext),soundEnabledRef=useRef(false);
  const unlockAudio=useCallback(async()=>{if(!soundEnabledRef.current)return false;const active=await unlockAdminAudio();audioContext.current=sharedAdminAudioContext;setSoundActive(active);return active},[]);
  useEffect(()=>{const preferred=window.localStorage.getItem("admin-notification-sound-enabled")==="true";soundEnabledRef.current=preferred;const enable=()=>{if(preferred)void unlockAudio()};window.addEventListener("pointerdown",enable,{once:true});window.addEventListener("keydown",enable,{once:true});return()=>{window.removeEventListener("pointerdown",enable);window.removeEventListener("keydown",enable)}},[unlockAudio]);
  const toggleSound=async()=>{if(soundEnabledRef.current&&soundActive){soundEnabledRef.current=false;setSoundActive(false);window.localStorage.setItem("admin-notification-sound-enabled","false");if(audioContext.current?.state==="running")await audioContext.current.suspend();return}soundEnabledRef.current=true;window.localStorage.setItem("admin-notification-sound-enabled","true");await unlockAudio()};
  const playAlert=useCallback(()=>{const context=audioContext.current;if(!soundEnabledRef.current||!context||context.state!=="running")return;const master=context.createGain();master.gain.setValueAtTime(.0001,context.currentTime);master.gain.exponentialRampToValueAtTime(.3,context.currentTime+.025);master.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.72);master.connect(context.destination);const tones:Array<[number,number,number]>=[[660,0,.22],[880,.24,.25],[1040,.5,.18]];tones.forEach(([frequency,delay,duration])=>{const oscillator=context.createOscillator(),tone=context.createGain();oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency,context.currentTime+delay);tone.gain.setValueAtTime(.0001,context.currentTime+delay);tone.gain.exponentialRampToValueAtTime(.75,context.currentTime+delay+.015);tone.gain.exponentialRampToValueAtTime(.0001,context.currentTime+delay+duration);oscillator.connect(tone).connect(master);oscillator.start(context.currentTime+delay);oscillator.stop(context.currentTime+delay+duration)})},[]);
  useEffect(()=>{let active=true;const poll=async()=>{try{const proofs=await adminApi<Row[]>("/payment-proofs?status=PENDING");if(!active)return;const ids=proofs.map(row=>text(row.id));let seen:string[]=[];try{seen=JSON.parse(window.localStorage.getItem("admin-seen-payment-proof-ids")??"[]") as string[]}catch{seen=[]}const initialized=window.localStorage.getItem("admin-payment-proof-baseline-ready")==="true";const seenSet=new Set(seen),newIds=initialized?ids.filter(id=>!seenSet.has(id)):[];ids.forEach(id=>seenSet.add(id));window.localStorage.setItem("admin-seen-payment-proof-ids",JSON.stringify([...seenSet].slice(-500)));window.localStorage.setItem("admin-payment-proof-baseline-ready","true");if(newIds.length){setToast(`${newIds.length} bukti pembayaran baru menunggu verifikasi.`);window.setTimeout(()=>setToast(""),6500);playAlert();if(document.hidden&&"Notification" in window&&Notification.permission==="granted"){const notification=new Notification("Pembayaran baru masuk",{body:`${newIds.length} bukti pembayaran menunggu verifikasi.`,icon:"/shakila-logo-transparent.png",tag:`payment-proof-${newIds.join("-")}`,silent:true});notification.onclick=()=>{window.focus();router.push("/payments");notification.close()}}}lastCount.current=proofs.length;setProofCount(proofs.length)}catch{if(active)setProofCount(lastCount.current)}};void poll();const timer=window.setInterval(()=>void poll(),10000);return()=>{active=false;window.clearInterval(timer)}},[playAlert,router]);
  const enableDesktopNotifications=()=>{if("Notification" in window&&Notification.permission==="default")void Notification.requestPermission()};
  return (
        <header className="topbar">
          <Button
            className="mobile-menu"
            variant="outline"
            size="icon"
            aria-label="Buka menu navigasi"
            onClick={toggleSidebar}
          >
            <Menu />
          </Button>
          <div className="topbar-context">
            <span className="live-dot" />
            <span>Operasional Shakila aktif</span>
          </div>
          <div className="top-actions">
            <label className="top-select">
              <span>{t("common.business")}</span>
              <ShadcnSelect
                value={business || "all"}
                onValueChange={(value) =>
                  setBusiness(value === "all" ? "" : value)
                }
              >
                <SelectTrigger aria-label={t("common.business")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("common.allBusinesses")}
                  </SelectItem>
                  <SelectItem value="glamping">Shakila Glamping</SelectItem>
                  <SelectItem value="jeep">Shakila Jeep Tour</SelectItem>
                </SelectContent>
              </ShadcnSelect>
            </label>
            <button className={`notification-sound ${soundActive?"active":"inactive"}`} type="button" onClick={()=>void toggleSound()} title={soundActive?"Nonaktifkan suara notifikasi":"Aktifkan suara notifikasi"}><span>{soundActive?"Aktif":"Nonaktif"}</span>{soundActive?"Nonaktifkan Suara Notifikasi":"Aktifkan Suara Notifikasi"}</button>
            <Link className="notification-bell" href="/payments" onClick={enableDesktopNotifications} aria-label={`${proofCount} bukti pembayaran menunggu verifikasi`} title="Buka notifikasi pembayaran"><Bell/>{proofCount>0?<span>{proofCount}</span>:null}</Link>
          </div>
          {toast?<div className="admin-toast" role="status"><span className="admin-toast-icon"><Bell/></span><div><small>PEMBAYARAN · BARU MASUK</small><strong>Bukti pembayaran perlu diperiksa</strong><span>{toast}</span><Link href="/payments">Buka verifikasi <ChevronRight/></Link></div><button type="button" onClick={()=>setToast("")} aria-label="Tutup notifikasi"><X/></button></div>:null}
        </header>
  );
}

function PageHeader({ view }: { view: View }) {
  const { t } = useAdminLanguage();
  const copy = {
    dashboard: ["dashboard.title", "dashboard.description"],
    bookings: ["bookings.title", "bookings.description"],
    booking: ["booking.title", "booking.description"],
    calendar: ["calendar.title", "calendar.description"],
    inventory: ["inventory.title", "inventory.description"],
    payments: ["payments.title", "payments.description"],
    customers: ["customers.title", "customers.description"],
    customer: ["customers.title", "customers.description"],
    glamping: ["catalog.glampingTitle", "catalog.glampingDescription"],
    jeep: ["catalog.jeepTitle", "catalog.jeepDescription"],
    settings: ["settings.title", "settings.description"],
  } as const;
  const section = { dashboard: "RINGKASAN", bookings: "BOOKING", booking: "DETAIL BOOKING", calendar: "KALENDER", inventory: "INVENTORI", payments: "PEMBAYARAN", customers: "PELANGGAN", customer: "DETAIL PELANGGAN", glamping: "AKOMODASI", jeep: "JEEP", settings: "PENGATURAN" }[view];
  return (
    <header className="page-header">
      <div>
        <p className="section-kicker">SHAKILA GROUP / {section}</p>
        <h1>{t(copy[view][0])}</h1>
        <p>{t(copy[view][1])}</p>
      </div>
      <time>
        {new Intl.DateTimeFormat("id-ID", {
          dateStyle: "full",
          timeZone: "Asia/Jakarta",
        }).format(new Date())}
      </time>
    </header>
  );
}

type Filters = {
  search: string;
  setSearch: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  paymentStatus: string;
  setPaymentStatus: (v: string) => void;
  method: string;
  setMethod: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  reviewOnly: boolean;
  setReviewOnly: (v: boolean) => void;
  sort: string;
  setSort: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
};
function selectOptions(values: string[]) {
  return values.map((value) => ({ value, label: statusLabel(value, "id") }));
}
function FilterShell({
  children,
  reset,
}: {
  children: React.ReactNode;
  reset: () => void;
}) {
  const { t } = useAdminLanguage();
  return (
    <div className="filter-bar">
      <div className="filter-fields">{children}</div>
      <div className="filter-actions">
        <Button type="button" variant="ghost" onClick={reset}>
          {t("common.reset")}
        </Button>
      </div>
    </div>
  );
}
function BookingFilters({ filters: f }: { filters: Filters }) {
  const { language, t } = useAdminLanguage();
  return (
    <FilterShell
      reset={() => {
        f.setSearch("");
        f.setStatus("");
        f.setPaymentStatus("");
        f.setDateFrom("");
        f.setDateTo("");
        f.setPage(1);
      }}
    >
      <div className="search-control">
        <Search className="search-leading" />
        <Input
          value={f.search}
          onChange={(e) => f.setSearch(e.target.value)}
          placeholder={t("bookings.search")}
        />
        {f.search ? (
          <Button
            className="search-clear"
            variant="ghost"
            size="icon"
            aria-label={language === "id" ? "Hapus pencarian" : "Clear search"}
            onClick={() => f.setSearch("")}
          >
            <X />
          </Button>
        ) : null}
      </div>
      <AdminSelect
        value={f.status}
        onValueChange={f.setStatus}
        placeholder={t("bookings.allStatus")}
        options={selectOptions([
          "WAITING_PAYMENT",
          "CONFIRMED",
          "CHECKED_IN",
          "CHECKED_OUT",
          "CANCELLED",
          "EXPIRED",
        ])}
      />
      <AdminSelect
        value={f.paymentStatus}
        onValueChange={f.setPaymentStatus}
        placeholder={t("bookings.allPayment")}
        options={selectOptions([
          "UNPAID",
          "PENDING",
          "PARTIALLY_PAID",
          "PAID",
          "FAILED",
          "EXPIRED",
        ])}
      />
      <AdminDatePicker
        value={f.dateFrom}
        onChange={f.setDateFrom}
        placeholder={language === "id" ? "Tanggal mulai" : "Start date"}
      />
      <AdminDatePicker
        value={f.dateTo}
        onChange={f.setDateTo}
        placeholder={language === "id" ? "Tanggal akhir" : "End date"}
      />
    </FilterShell>
  );
}
function PaymentFilters({
  filters: f,
  methods,
}: {
  filters: Filters;
  methods: string[];
}) {
  const { language, t } = useAdminLanguage();
  return (
    <FilterShell
      reset={() => {
        f.setSearch("");
        f.setStatus("");
        f.setMethod("");
        f.setDateFrom("");
        f.setDateTo("");
        f.setReviewOnly(false);
        f.setSort("createdAt");
        f.setPage(1);
      }}
    >
      <div className="search-control payment-search">
        <Search className="search-leading" />
        <Input
          value={f.search}
          onChange={(e) => f.setSearch(e.target.value)}
          placeholder={t("payments.search")}
        />
        {f.search ? (
          <Button className="search-clear" variant="ghost" size="icon" aria-label={language === "id" ? "Hapus pencarian" : "Clear search"} onClick={() => f.setSearch("")}>
            <X />
          </Button>
        ) : null}
      </div>
      <AdminSelect
        value={f.status}
        onValueChange={f.setStatus}
        placeholder={t("payments.allStatus")}
        options={selectOptions([
          "CREATED",
          "PENDING",
          "SUCCESS",
          "FAILED",
          "EXPIRED",
          "EXCEPTION",
        ])}
      />
      <AdminSelect
        value={f.method}
        onValueChange={f.setMethod}
        placeholder={t("payments.allMethods")}
        options={selectOptions(methods)}
      />
      <AdminDatePicker
        value={f.dateFrom}
        onChange={f.setDateFrom}
        placeholder={language === "id" ? "Dari tanggal" : "From date"}
      />
      <AdminDatePicker
        value={f.dateTo}
        onChange={f.setDateTo}
        placeholder={language === "id" ? "Sampai tanggal" : "To date"}
      />
      <AdminSelect
        value={f.sort}
        onValueChange={f.setSort}
        placeholder={language === "id" ? "Urutkan" : "Sort"}
        options={[
          {
            value: "createdAt",
            label: language === "id" ? "Terbaru dibuat" : "Newest created",
          },
          {
            value: "paidAt",
            label: language === "id" ? "Terbaru dibayar" : "Newest paid",
          },
          {
            value: "verifiedAmount",
            label: language === "id" ? "Nominal verifikasi" : "Verified amount",
          },
        ]}
      />
      <label className="review-filter">
        <Checkbox
          checked={f.reviewOnly}
          onCheckedChange={(checked) => f.setReviewOnly(checked === true)}
        />
        {t("payments.review")}
      </label>
    </FilterShell>
  );
}
void PaymentFilters;
function SimpleSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { language, t } = useAdminLanguage();
  return (
    <div className="filter-bar simple">
      <div className="search-control">
        <Search className="search-leading" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("bookings.search")}
        />
        {value ? (
          <Button className="search-clear" variant="ghost" size="icon" aria-label={language === "id" ? "Hapus pencarian" : "Clear search"} onClick={() => onChange("")}>
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-label="Memuat data" aria-busy="true">
      <div className="skeleton-metrics">
        {[1, 2, 3, 4].map((item) => (
          <Card className="skeleton-card" key={item}>
            <Skeleton className="skeleton-line short" />
            <Skeleton className="skeleton-line value" />
            <Skeleton className="skeleton-line" />
          </Card>
        ))}
      </div>
      <Card className="skeleton-table">
        <Skeleton className="skeleton-line heading" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div className="skeleton-row" key={item}>
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ))}
      </Card>
    </div>
  );
}

function ViewContent({
  view,
  data,
  reload,
  onPage,
}: {
  view: View;
  data: unknown;
  reload: () => Promise<void>;
  onPage: (page: number) => void;
}) {
  if (view === "dashboard") return <Dashboard data={data as Row} />;
  if (view === "bookings")
    return <Bookings data={data as PageData} onPage={onPage} reload={reload} />;
  if (view === "booking")
    return <BookingDetail booking={data as Row} reload={reload} />;
  if (view === "payments")
    return <PaymentProofVerification rows={data as Row[]} reload={reload} />;
  if (view === "customers") return <Customers rows={data as Row[]} />;
  if (view === "customer") return <Customer item={data as Row} />;
  if (view === "calendar")
    return (
      <OperationsCalendar data={data as { bookings: Row[]; capacity: Row[] }} />
    );
  if (view === "inventory")
    return <Inventory units={data as Row[]} reload={reload} />;
  if (view === "glamping" || view === "jeep")
    return <CatalogManager kind={view} rows={data as Row[]} reload={reload} />;
  return <SettingsView rows={data as Row[]} reload={reload} />;
}

function Dashboard({ data }: { data: Row }) {
  const { language, t } = useAdminLanguage();
  const recent = (data.recent ?? []) as Row[],
    chart = (data.chart ?? []) as Row[],
    breakdown = (data.breakdown ?? []) as Row[];
  const chartConfig = {
    revenue: {
      label: language === "id" ? "Pendapatan diterima" : "Received revenue",
      color: "#2f7256",
    },
  } satisfies ChartConfig;
  const metrics = [
    ["dashboard.revenue", rupiah(Number(data.revenue ?? 0)), WalletCards],
    [
      "dashboard.bookingValue",
      rupiah(Number(data.bookingValue ?? 0)),
      ChartNoAxesCombined,
    ],
    ["dashboard.outstanding", rupiah(Number(data.outstanding ?? 0)), Clock3],
    ["dashboard.totalBookings", text(data.totalBookings), PackageSearch],
    ["dashboard.todayBookings", text(data.newToday), CalendarDays],
    ["dashboard.upcoming", text(data.upcoming), ChevronRight],
  ] as const;
  return (
    <>
      <section className="metric-grid">
        {metrics.map(([label, value, Icon]) => (
          <Card className="metric" key={label}>
            <div>
              <span>{t(label)}</span>
              <Icon size={17} />
            </div>
            <strong>{value}</strong>
            <small>
              {language === "id" ? "Data terverifikasi" : "Verified data"}
            </small>
          </Card>
        ))}
      </section>
      <section className="business-breakdown">
        {breakdown.map((row) => (
          <Card
            className={`business-kpi ${row.business}`}
            key={text(row.business)}
          >
            <div>
              <span>{text(row.name)}</span>
              <strong>{text(row.bookings)} booking</strong>
            </div>
            <div>
              <span>{t("dashboard.revenue")}</span>
              <strong>{rupiah(Number(row.revenue))}</strong>
            </div>
            <div>
              <span>{t("dashboard.bookingValue")}</span>
              <strong>{rupiah(Number(row.bookingValue))}</strong>
            </div>
          </Card>
        ))}
      </section>
      <section className="dashboard-grid">
        <Card>
          <div className="card-title">
            <div>
              <h2>{t("dashboard.pulse")}</h2>
              <p>{t("dashboard.revenue")}</p>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="revenue-chart">
            <BarChart accessibilityLayer data={chart} margin={{ left: 4, right: 4, top: 12 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 5" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => String(value).slice(5)} />
              <ChartTooltip
                cursor={{ fill: "#edf4f0", radius: 8 }}
                content={
                  <ChartTooltipContent
                    className="admin-chart-tooltip"
                    indicator="line"
                    labelFormatter={(_, payload) => {
                      const day = payload[0]?.payload?.day;
                      return day ? fmtDate(day) : "";
                    }}
                    formatter={(value) => (
                      <div className="chart-tooltip-value">
                        <span>{language === "id" ? "Pendapatan" : "Revenue"}</span>
                        <strong>{rupiah(Number(value))}</strong>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[7, 7, 2, 2]} maxBarSize={58} />
            </BarChart>
          </ChartContainer>
        </Card>
        <Card>
          <div className="card-title">
            <h2>{t("dashboard.recent")}</h2>
            <Link href="/bookings">
              {t("dashboard.seeAll")} <ChevronRight size={15} />
            </Link>
          </div>
          <BookingRows rows={recent} compact />
        </Card>
      </section>
    </>
  );
}

function BookingRows({
  rows,
  compact = false,
}: {
  rows: Row[];
  compact?: boolean;
}) {
  const { language, t } = useAdminLanguage();
  if (!rows.length)
    return (
      <EmptyState
        title={t("common.noData")}
        description={t("bookings.empty")}
      />
    );
  return (
    <div className="table-scroll">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking</TableHead>
            <TableHead>{t("common.customer")}</TableHead>
            {!compact ? <TableHead>Reservasi</TableHead> : null}
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>Total</TableHead>
            {!compact ? <TableHead>{t("payments.verified")}</TableHead> : null}
            <TableHead>{t("common.created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={text(row.id)}>
              <TableCell>
                <Link
                  className="code-link"
                  href={`/bookings/${text(row.bookingCode)}`}
                >
                  {text(row.bookingCode)}
                </Link>
                <small>
                  {row.business === "glamping"
                    ? "Shakila Glamping"
                    : "Shakila Jeep Tour"}
                </small>
              </TableCell>
              <TableCell>
                <strong>{text(row.customerName)}</strong>
                <small>{text(row.customerEmail)}</small>
              </TableCell>
              {!compact ? (
                <TableCell>
                  {text(row.productName)}
                  <small>{fmtDate(row.startDate)}</small>
                </TableCell>
              ) : null}
              <TableCell>
                <Badge value={row.status}>
                  {statusLabel(row.status, language)}
                </Badge>
                <small>{statusLabel(row.paymentStatus, language)}</small>
              </TableCell>
              <TableCell>{rupiah(Number(row.totalAmount ?? 0))}</TableCell>
              {!compact ? (
                <TableCell>
                  {rupiah(Number(row.verifiedPaidAmount ?? 0))}
                </TableCell>
              ) : null}
              <TableCell>{fmtDate(row.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
function Bookings({
  data,
  onPage,
  reload,
}: {
  data: PageData;
  onPage: (page: number) => void;
  reload: () => Promise<void>;
}) {
  const { language, t } = useAdminLanguage();
  const start = data.total ? (data.page - 1) * data.pageSize + 1 : 0,
    end = Math.min(data.page * data.pageSize, data.total);
  const [manualOpen,setManualOpen]=useState(false);
  return (
    <><div className="catalog-actions"><div><strong>Booking online &amp; operasional</strong><span>Semua sumber memakai inventory yang sama.</span></div><Button onClick={()=>setManualOpen(true)}><Plus/> Tambah Booking Manual</Button></div><Card>
      <div className="card-title">
        <h2>
          {data.total} {language === "id" ? "booking" : "bookings"}
        </h2>
        <span>{language === "id" ? "Terbaru lebih dulu" : "Newest first"}</span>
      </div>
      <BookingRows rows={data.items} />
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        label={
          language === "id"
            ? `Menampilkan ${start}–${end} dari ${data.total} booking`
            : `Showing ${start}–${end} of ${data.total} bookings`
        }
        previous={t("common.previous")}
        next={t("common.next")}
        onPage={onPage}
      />
    </Card><ManualBookingDialog open={manualOpen} onClose={()=>setManualOpen(false)} onCreated={reload}/></>
  );
}

function ManualBookingDialog({open,onClose,onCreated}:{open:boolean;onClose:()=>void;onCreated:()=>Promise<void>}){
  const [catalog,setCatalog]=useState<{glamping:Row[];jeep:Row[];slots:Row[]}|null>(null),[business,setBusiness]=useState<"glamping"|"jeep">("glamping"),[productId,setProductId]=useState(""),[slotId,setSlotId]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{if(open)void adminApi<{glamping:Row[];jeep:Row[];slots:Row[]}>("/catalog").then(value=>{setCatalog(value);setProductId(text(value.glamping[0]?.id??""))}).catch(()=>setError("Katalog belum dapat dimuat."))},[open]);
  const products=business==="glamping"?(catalog?.glamping??[]):(catalog?.jeep??[]),selected=products.find(row=>text(row.id)===productId),slots=(catalog?.slots??[]).filter(row=>text(row.jeepPackageId)===productId);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);setError("");try{const common={source:form.get("source"),business,customer:{fullName:form.get("fullName"),email:form.get("email"),whatsapp:form.get("whatsapp")},specialRequest:form.get("specialRequest")||null,notes:form.get("notes")||null,paymentState:form.get("paymentState"),amountReceived:Number(form.get("amountReceived")),reservation:business==="glamping"?{productSlug:selected?.slug,checkInDate:form.get("startDate"),checkOutDate:form.get("endDate"),quantity:Number(form.get("quantity")),guestCount:Number(form.get("guestCount"))}:{packageSlug:selected?.slug,tourDate:form.get("startDate"),departureSlotId:slotId,quantity:Number(form.get("quantity")),guestCount:Number(form.get("guestCount"))}};await adminApi("/bookings/manual",{method:"POST",body:JSON.stringify(common)});onClose();await onCreated()}catch(caught){setError(caught instanceof Error?caught.message:"Booking manual belum dapat dibuat.")}finally{setBusy(false)}}
  return <Dialog open={open} title="Tambah Booking Manual" description="Untuk telepon, WhatsApp, booking di lokasi, dan kedatangan langsung—tetap dengan proteksi overbooking." onClose={onClose}><form className="dialog-form manual-booking-form" onSubmit={event=>void submit(event)}><div className="split"><Field label="Bisnis"><AdminSelect value={business} onValueChange={value=>{const next=value as "glamping"|"jeep";setBusiness(next);const rows=next==="glamping"?(catalog?.glamping??[]):(catalog?.jeep??[]);setProductId(text(rows[0]?.id??""));setSlotId("")}} placeholder="Pilih bisnis" options={[{value:"glamping",label:"Shakila Akomodasi"},{value:"jeep",label:"Shakila Jeep Tour"}]}/></Field><Field label="Sumber booking"><AdminSelect name="source" defaultValue="ADMIN_MANUAL" placeholder="Pilih sumber" options={[{value:"ADMIN_MANUAL",label:"Admin manual / telepon / WhatsApp"},{value:"WALK_IN",label:"Datang langsung / di lokasi"}]}/></Field></div><Field label={business==="glamping"?"Tipe akomodasi":"Paket Jeep"}><AdminSelect value={productId} onValueChange={value=>{setProductId(value);setSlotId("")}} placeholder="Pilih produk" options={products.map(row=>({value:text(row.id),label:`${text(row.kind)==="HOMESTAY"?"Homestay":"Glamping"} · ${text(row.name)}`}))}/></Field>{business==="jeep"?<Field label="Jadwal keberangkatan"><AdminSelect value={slotId} onValueChange={setSlotId} placeholder="Pilih jadwal" options={slots.map(row=>({value:text(row.id),label:row.departureTime?`${String(row.departureTime).slice(0,5)} · ${text(row.name)}`:text(row.name)}))}/></Field>:null}<div className="split"><Field label={business==="glamping"?"Check-in":"Tanggal tur"}><Input name="startDate" type="date" required/></Field>{business==="glamping"?<Field label="Check-out"><Input name="endDate" type="date" required/></Field>:null}</div><div className="split"><Field label="Jumlah unit"><Input name="quantity" type="number" min="1" defaultValue="1" required/></Field><Field label="Jumlah tamu"><Input name="guestCount" type="number" min="1" defaultValue="1" required/></Field></div><div className="split"><Field label="Nama pelanggan"><Input name="fullName" required/></Field><Field label="WhatsApp / telepon"><Input name="whatsapp" required/></Field></div><Field label="Email (opsional)"><Input name="email" type="email"/></Field><div className="split"><Field label="Status pembayaran"><AdminSelect name="paymentState" defaultValue="UNPAID" placeholder="Pilih status" options={[{value:"UNPAID",label:"Belum dibayar"},{value:"PARTIALLY_PAID",label:"DP / sebagian diterima"},{value:"PAID",label:"Lunas"}]}/></Field><Field label="Nominal sudah diterima"><Input name="amountReceived" type="number" min="0" defaultValue="0" required/></Field></div><Field label="Permintaan pelanggan"><Textarea name="specialRequest"/></Field><Field label="Catatan internal"><Textarea name="notes"/></Field><div className="payment-terms"><strong>Aturan operasional</strong><span>DP minimal 50%, batas pembayaran 12 jam, dan booking manual memakai pengalokasi inventori yang sama.</span></div>{error?<div className="ui-alert danger">{error}</div>:null}<footer className="dialog-actions"><Button type="button" variant="ghost" onClick={onClose}>Batal</Button><Button disabled={busy||!productId||(business==="jeep"&&!slotId)}>{busy?"Memeriksa inventori...":"Simpan Booking Manual"}</Button></footer></form></Dialog>;
}

function BookingDetail({
  booking,
  reload,
}: {
  booking: Row;
  reload: () => Promise<void>;
}) {
  const { language, t } = useAdminLanguage();
  const events = (booking.events ?? []) as Row[],
    attempts = (booking.paymentAttempts ?? []) as Row[],
    reservations = (booking.reservations ?? []) as Row[],
    invoice = booking.invoice as Row | null;
  const [command, setCommand] = useState<
      "check-in" | "check-out" | "complete" | "cancel" | null
    >(null),
    [reason, setReason] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [commandSuccess, setCommandSuccess] = useState<
      "check-in" | "check-out" | "complete" | null
    >(null),
    [commandError, setCommandError] = useState(""),
    [notice, setNotice] = useState(""),
    [settlementOpen, setSettlementOpen] = useState(false),
    [settlementAmount, setSettlementAmount] = useState(Number(booking.remainingAmount ?? 0)),
    [settlementMethod, setSettlementMethod] = useState("CASH"),
    [settlementNote, setSettlementNote] = useState(""),
    [settlementKey, setSettlementKey] = useState("");
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });
  const reservationDate = String(booking.startDate ?? "").slice(0, 10);
  const isAccommodationBooking = booking.bookingType !== "JEEP";
  const jakartaTimeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const jakartaMinutes =
    Number(jakartaTimeParts.find((part) => part.type === "hour")?.value ?? 0) * 60 +
    Number(jakartaTimeParts.find((part) => part.type === "minute")?.value ?? 0);
  const checkInIsEarly =
    isAccommodationBooking &&
    booking.status === "CONFIRMED" &&
    (reservationDate > today || (reservationDate === today && jakartaMinutes < 13 * 60));
  const checkInHasBalance =
    isAccommodationBooking &&
    booking.status === "CONFIRMED" &&
    (booking.paymentStatus !== "PAID" || Number(booking.remainingAmount) > 0);
  const checkoutIsEarly =
    isAccommodationBooking &&
    booking.status === "CHECKED_IN" &&
    Boolean(booking.endDate) &&
    String(booking.endDate).slice(0, 10) > today;
  async function runCommand() {
    if (!command || (command === "cancel" && !reason.trim())) return;
    setBusy(true);
    setCommandError("");
    try {
      const completedCommand = command;
      await adminApi(`/bookings/${booking.bookingCode}/${command}`, {
        method: "POST",
        body:
          command === "cancel"
            ? JSON.stringify({ reason, note })
            : command === "check-out"
              ? JSON.stringify({ confirmEarlyCheckout: checkoutIsEarly })
              : undefined,
      });
      setNotice(
        language === "id"
          ? "Perubahan berhasil disimpan."
          : "Change saved successfully.",
      );
      if (completedCommand !== "cancel") {
        setCommandSuccess(completedCommand);
        // Keep the detail view mounted long enough for the success animation.
        // Calling reload here would replace the entire content area with its
        // skeleton and unmount this dialog before it can be seen.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 1500));
        setCommand(null);
        setCommandSuccess(null);
        await reload();
      } else {
        setCommand(null);
        await reload();
      }
    } catch (caught) {
      if (caught instanceof AdminApiError && caught.code === "PAYMENT_BALANCE_REMAINING") {
        setCommandError(
          language === "id"
            ? "Booking harus LUNAS sebelum Check-In. Catat sisa pembayaran tanpa menganggapnya lunas otomatis."
            : "The booking must be paid in full before check-in. Record the remaining payment first.",
        );
      } else if (caught instanceof AdminApiError && caught.code === "CHECK_IN_NOT_ALLOWED") {
        setCommandError(
          language === "id"
            ? "Check-in belum dapat dilakukan. Booking harus terkonfirmasi dan waktu Check-In baru dimulai pukul 13.00 WIB pada tanggal reservasi."
            : "Check-in is not available yet. The booking must be confirmed and check-in opens at 13:00 WIB on the reservation date.",
        );
      } else if (caught instanceof AdminApiError && caught.code === "CHECK_OUT_NOT_ALLOWED") {
        setCommandError(
          language === "id"
            ? `Checkout dini memerlukan konfirmasi admin. Tanggal pulang terjadwal adalah ${fmtDate(booking.endDate)}; rentang reservasi historis tidak akan berubah.`
            : `Early checkout requires admin confirmation. The scheduled checkout date is ${fmtDate(booking.endDate)}; the historical reservation range will not change.`,
        );
      } else if (caught instanceof AdminApiError && caught.code === "BOOKING_STATE_CONFLICT") {
        setCommandError(
          language === "id"
            ? "Status booking telah berubah sehingga tindakan ini tidak lagi valid. Tutup dialog lalu muat ulang detail booking."
            : "The booking status changed, so this action is no longer valid. Close the dialog and reload the booking detail.",
        );
      } else {
        setCommandError(
          language === "id"
            ? "Tindakan belum dapat disimpan. Periksa koneksi lalu coba kembali; tidak ada status booking yang diubah."
            : "The action could not be saved. Check your connection and try again; no booking status was changed.",
        );
      }
    } finally {
      setBusy(false);
    }
  }
  async function file(kind: "invoice" | "email-preview") {
    const response = await fetch(
      `${API_URL}/admin/bookings/${booking.bookingCode}/${kind}`,
      { credentials: "include", cache: "no-store" },
    );
    if (!response.ok) {
      setNotice(
        language === "id"
          ? "Dokumen belum tersedia."
          : "Document is not available yet.",
      );
      return;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (kind === "invoice" && !contentType.includes("application/pdf")) {
      setNotice(
        language === "id"
          ? "PDF invoice belum tersedia."
          : "The invoice PDF is not available yet.",
      );
      return;
    }
    const blob = await response.blob(),
      url = URL.createObjectURL(blob);
    if (kind === "invoice") {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${booking.bookingCode}.pdf`;
      anchor.click();
    } else window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
  function openSettlement() {
    setSettlementAmount(Number(booking.remainingAmount ?? 0));
    setSettlementMethod("CASH");
    setSettlementNote("");
    setSettlementKey(crypto.randomUUID());
    setCommandError("");
    setSettlementOpen(true);
  }
  async function submitSettlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settlementKey) return;
    setBusy(true);
    setCommandError("");
    try {
      const result = await adminApi<{ invoice: "ready" | "failed" | "unchanged" }>(`/bookings/${booking.bookingCode}/settlement`, {
        method: "POST",
        headers: { "Idempotency-Key": settlementKey },
        body: JSON.stringify({
          amount: settlementAmount,
          method: settlementMethod,
          note: settlementNote || undefined,
        }),
      });
      setSettlementOpen(false);
      setNotice(
        result.invoice === "failed"
          ? "Pelunasan berhasil dicatat. PDF invoice belum dapat diperbarui dan dapat dicoba lagi."
          : "Pelunasan berhasil dicatat. Status pembayaran dan invoice telah diperbarui.",
      );
      await reload();
    } catch (caught) {
      setCommandError(
        caught instanceof Error
          ? caught.message
          : "Pelunasan belum dapat dicatat. Tidak ada pembayaran yang ditambahkan.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="command-bar">
        <div>
          <Badge value={booking.status}>
            {statusLabel(booking.status, language)}
          </Badge>
          <Badge value={booking.paymentStatus}>
            {statusLabel(booking.paymentStatus, language)}
          </Badge>
        </div>
        <div>
          {booking.status === "CONFIRMED" && Number(booking.remainingAmount) > 0 ? (
            <Button variant="outline" onClick={openSettlement}>
              Catat Pelunasan
            </Button>
          ) : null}
          {isAccommodationBooking && booking.status === "CONFIRMED" ? (
            <Button
              disabled={checkInIsEarly || checkInHasBalance}
              title={
                checkInHasBalance
                  ? "Booking harus LUNAS sebelum Check-In."
                  : checkInIsEarly
                  ? language === "id"
                    ? `Check-in tersedia pada ${fmtDate(booking.startDate)} pukul 13.00 WIB.`
                    : `Check-in is available at 13:00 WIB on ${fmtDate(booking.startDate)}.`
                  : undefined
              }
              onClick={() => { setCommandError(""); setCommand("check-in"); }}
            >
              {t("booking.checkIn")}
            </Button>
          ) : null}
          {isAccommodationBooking && booking.status === "CHECKED_IN" ? (
            <Button onClick={() => { setCommandError(""); setCommand("check-out"); }}>
              {t("booking.checkOut")}
            </Button>
          ) : null}
          {!isAccommodationBooking && booking.status === "CONFIRMED" && booking.paymentStatus === "PAID" && Number(booking.remainingAmount) === 0 ? (
            <Button onClick={() => { setCommandError(""); setCommand("complete"); }}>
              Selesai
            </Button>
          ) : null}
          {!["CANCELLED", "EXPIRED", "CHECKED_OUT", "COMPLETED"].includes(
            String(booking.status),
          ) ? (
            <Button variant="destructive" onClick={() => { setCommandError(""); setCommand("cancel"); }}>
              {t("booking.cancel")}
            </Button>
          ) : null}
        </div>
      </div>
      {isAccommodationBooking && checkInIsEarly ? (
        <div className="ui-alert check-in-eligibility">
          <Clock3 size={17} />
          <span>
            {language === "id"
              ? `Early check-in tidak diizinkan. Tindakan check-in aktif pada ${fmtDate(booking.startDate)} pukul 13.00 WIB.`
              : `Early check-in is not allowed. Check-in becomes available at 13:00 WIB on ${fmtDate(booking.startDate)}.`}
          </span>
        </div>
      ) : null}
      {isAccommodationBooking && checkInHasBalance ? (
        <div className="ui-alert danger check-in-eligibility">
          <span>
            Masih ada sisa pembayaran {rupiah(Number(booking.remainingAmount))}. Booking harus LUNAS sebelum Check-In.
          </span>
          <Button variant="outline" onClick={openSettlement}>Catat Pelunasan</Button>
        </div>
      ) : null}
      {notice ? <div className="ui-alert">{notice}</div> : null}
      <div className="detail-grid">
        <Card>
          <p className="section-kicker">{text(booking.bookingCode)}</p>
          <h2>{text(booking.productName)}</h2>
          <dl className="details">
            <dt>{t("common.business")}</dt>
            <dd>{text(booking.businessName)}</dd>
            <dt>Sumber booking</dt>
            <dd>{statusLabel(booking.bookingSource, language)}</dd>
            <dt>{t("common.customer")}</dt>
            <dd>
              {text(booking.customerName)}
              <small>
                {text(booking.customerEmail)} · {text(booking.customerWhatsapp)}
              </small>
            </dd>
            <dt>Reservasi</dt>
            <dd>
              {fmtDate(booking.startDate)}
              {booking.endDate ? ` — ${fmtDate(booking.endDate)}` : ""}
            </dd>
            {booking.bookingType === "ACCOMMODATION" ? <><dt>Waktu menginap</dt><dd>Check-in mulai 13.00 WIB<small>Check-out maksimal 12.00 WIB</small></dd></> : null}
            <dt>{language === "id" ? "Tamu / jumlah" : "Guests / quantity"}</dt>
            <dd>
              {text(booking.guestCount)} / {text(booking.quantity)}
            </dd>
            <dt>Total</dt>
            <dd>{rupiah(Number(booking.totalAmount))}</dd>
            <dt>
              {t("payments.verified")} / {t("dashboard.outstanding")}
            </dt>
            <dd>
              {rupiah(Number(booking.verifiedPaidAmount))} /{" "}
              {rupiah(Number(booking.remainingAmount))}
              <small>DP minimal 50% · DP terbayar tidak dapat dikembalikan bila booking dibatalkan.</small>
            </dd>
          </dl>
        </Card>
        <Card>
          <div className="card-title">
            <h2>{t("booking.documents")}</h2>
          </div>
          {invoice ? (
            <div className="document-panel">
              <div>
                <strong>{text(invoice.invoiceNumber)}</strong>
                <Badge value={invoice.status}>
                  {statusLabel(invoice.status, language)}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => void file("invoice")}>
                <Download size={16} /> PDF
              </Button>
              <Button
                variant="ghost"
                onClick={() => void file("email-preview")}
              >
                Email preview
              </Button>
            </div>
          ) : (
            <EmptyState
              title={t("common.noData")}
              description={
                language === "id"
                  ? "Invoice belum dibuat."
                  : "Invoice has not been generated."
              }
            />
          )}
          <h3>{t("booking.allocation")}</h3>
          {reservations.map((row) => (
            <div className="allocation" key={text(row.code)}>
              <span>
                {text(row.code)} · {text(row.name)}
              </span>
              <Badge value={row.state}>
                {statusLabel(row.state, language)}
              </Badge>
            </div>
          ))}
        </Card>
        <Card>
          <h2>{t("booking.attempts")}</h2>
          {attempts.length ? (
            attempts.map((row) => (
              <div className="timeline-item" key={text(row.id)}>
                <Badge value={row.status}>
                  {statusLabel(row.status, language)}
                </Badge>
                <strong>
                  {text(row.provider)} · {rupiah(Number(row.requestedAmount))}
                </strong>
                <small>{text(row.orderId)}</small>
              </div>
            ))
          ) : (
            <EmptyState
              title={t("common.noData")}
              description={
                language === "id"
                  ? "Belum ada percobaan pembayaran."
                  : "No payment attempts yet."
              }
            />
          )}
        </Card>
        <Card>
          <h2>{t("booking.timeline")}</h2>
          {events.map((row) => (
            <div className="timeline-item" key={text(row.id)}>
              <time>{fmtDate(row.createdAt)}</time>
              <strong>{text(row.title)}</strong>
              <small>{statusLabel(row.actorType, language)}</small>
            </div>
          ))}
        </Card>
      </div>
      <Dialog
        open={settlementOpen}
        title="Catat Pelunasan"
        description={`${text(booking.bookingCode)} · Sisa ${rupiah(Number(booking.remainingAmount))}`}
        onClose={() => { if (!busy) { setSettlementOpen(false); setCommandError(""); } }}
      >
        <form className="dialog-form" onSubmit={(event) => void submitSettlement(event)}>
          <Field label="Nominal pelunasan">
            <Input
              type="number"
              min="1"
              max={Number(booking.remainingAmount)}
              value={settlementAmount}
              onChange={(event) => setSettlementAmount(Number(event.target.value))}
              required
            />
          </Field>
          <Field label="Metode pembayaran">
            <AdminSelect
              value={settlementMethod}
              onValueChange={setSettlementMethod}
              placeholder="Pilih metode"
              options={[
                { value: "CASH", label: "Tunai" },
                { value: "TRANSFER", label: "Transfer" },
                { value: "MANUAL_QRIS", label: "QRIS Manual" },
                { value: "OTHER", label: "Lainnya" },
              ]}
            />
          </Field>
          <Field label="Catatan (opsional)">
            <Textarea
              value={settlementNote}
              onChange={(event) => setSettlementNote(event.target.value)}
              maxLength={2000}
            />
          </Field>
          {commandError ? <div className="ui-alert danger">{commandError}</div> : null}
          <footer className="dialog-actions">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setSettlementOpen(false)}>Batal</Button>
            <Button
              disabled={busy || settlementAmount < 1 || settlementAmount > Number(booking.remainingAmount)}
            >
              {busy ? "Menyimpan..." : "Catat Pelunasan"}
            </Button>
          </footer>
        </form>
      </Dialog>
      <Dialog
        open={Boolean(command)}
        title={
          commandSuccess
            ? language === "id"
              ? "Berhasil disimpan"
              : "Berhasil disimpan"
            : command === "cancel"
            ? t("booking.cancel")
            : command === "check-in"
              ? t("booking.checkIn")
              : command === "complete"
                ? "Selesaikan booking Jeep"
                : t("booking.checkOut")
        }
        description={
          commandSuccess
            ? text(booking.bookingCode)
            : command === "cancel"
            ? t("booking.cancelWarning")
            : `${text(booking.customerName)} · ${text(booking.productName)}`
        }
        dismissible={!commandSuccess}
        onClose={() => { if (!commandSuccess) { setCommand(null); setCommandError(""); } }}
      >
        {commandSuccess ? (
          <div className="command-success" role="status" aria-live="polite">
            <div className="success-check" aria-hidden="true">
              <span />
              <Check />
            </div>
            <strong>
              {commandSuccess === "check-in"
                ? language === "id"
                  ? "Check-in berhasil"
                  : "Check-in successful"
                : commandSuccess === "complete"
                  ? "Booking Jeep selesai"
                : language === "id"
                  ? "Checkout berhasil diselesaikan"
                  : "Check-out berhasil diselesaikan"}
            </strong>
            <span>
              {language === "id"
                ? "Status booking dan ketersediaan unit telah diperbarui."
                : "The booking status and unit availability have been updated."}
            </span>
          </div>
        ) : command === "cancel" ? (
          <div className="dialog-form">
            <Field label={t("booking.cancelReason")}>
              <AdminSelect
                value={reason}
                onValueChange={setReason}
                placeholder="—"
                options={[
                  {
                    value: "Perubahan rencana",
                    label:
                      language === "id"
                        ? "Perubahan rencana"
                        : "Perubahan rencana",
                  },
                  {
                    value: "Permintaan pelanggan",
                    label:
                      language === "id"
                        ? "Permintaan pelanggan"
                        : "Permintaan pelanggan",
                  },
                  {
                    value: "Operasional",
                    label: language === "id" ? "Operasional" : "Operational",
                  },
                ]}
              />
            </Field>
            <Field
              label={
                language === "id" ? "Catatan (opsional)" : "Note (optional)"
              }
            >
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
          </div>
        ) : (
          <div className="confirmation-summary">
            <div className="confirmation-icon"><Clock3 /></div>
            <div className="confirmation-row">
              <span>{language === "id" ? "Kode booking" : "Booking code"}</span>
              <strong>{text(booking.bookingCode)}</strong>
            </div>
            <div className="confirmation-row">
              <span>{language === "id" ? "Jadwal reservasi" : "Reservation schedule"}</span>
              <strong>{fmtDate(booking.startDate)}{booking.endDate ? ` — ${fmtDate(booking.endDate)}` : ""}</strong>
            </div>
            <div className={`confirmation-note ${checkoutIsEarly && command === "check-out" ? "warning" : ""}`}>
              {command === "complete"
                ? "Booking akan ditandai selesai dan Jeep langsung tersedia kembali untuk jadwal lain pada hari yang sama."
                : checkoutIsEarly && command === "check-out"
                ? language === "id"
                  ? `Anda akan menyelesaikan checkout sebelum jadwal ${fmtDate(booking.endDate)}. Unit akan dilepas sekarang, tetapi tanggal reservasi historis tetap tersimpan. Konfirmasikan hanya jika tamu benar-benar sudah meninggalkan unit.`
                  : `You are checking out before ${fmtDate(booking.endDate)}. Inventory will be released now, while the historical reservation dates remain unchanged.`
                : language === "id"
                  ? "Status booking, jadwal reservasi, dan persyaratan pembayaran akan diperiksa kembali sebelum perubahan disimpan."
                  : "The booking status, reservation schedule, and payment requirements will be checked again before saving."}
            </div>
          </div>
        )}
        {!commandSuccess && commandError ? (
          <div className="dialog-error" role="alert">
            <strong>{language === "id" ? "Tindakan belum berhasil" : "Action not completed"}</strong>
            <span>{commandError}</span>
          </div>
        ) : null}
        {!commandSuccess ? <footer className="dialog-actions">
          <Button variant="ghost" onClick={() => { setCommand(null); setCommandError(""); }}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={command === "cancel" ? "destructive" : "default"}
            disabled={busy || (command === "cancel" && !reason)}
            onClick={() => void runCommand()}
          >
            {busy
              ? t("common.loading")
              : command === "cancel"
                ? t("booking.cancel")
                : language === "id"
                  ? "Konfirmasi"
                  : "Confirm"}
          </Button>
        </footer> : null}
      </Dialog>
    </>
  );
}

function ProofImage({id}:{id:string}){
  const [url,setUrl]=useState("");
  useEffect(()=>{let objectUrl="";void fetch(`${API_URL}/admin/payment-proofs/${id}/file`,{credentials:"include",cache:"no-store"}).then(response=>{if(!response.ok)throw new Error("proof");return response.blob()}).then(blob=>{objectUrl=URL.createObjectURL(blob);setUrl(objectUrl)}).catch(()=>setUrl(""));return()=>{if(objectUrl)URL.revokeObjectURL(objectUrl)}},[id]);
  return url?<div className="proof-image" role="img" aria-label="Bukti pembayaran" style={{backgroundImage:`url(${url})`}}/>:<div className="proof-image loading">Memuat bukti...</div>;
}

function PaymentProofVerification({rows,reload}:{rows:Row[];reload:()=>Promise<void>}){
  const {language}=useAdminLanguage();
  const [selected,setSelected]=useState<Row|null>(null),[reason,setReason]=useState(""),[amount,setAmount]=useState(0),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const pending=rows.filter(row=>row.status==="PENDING"),history=rows.filter(row=>row.status!=="PENDING");
  async function act(action:"approve"|"reject") {if(!selected)return;setBusy(true);setNotice("");try{await adminApi(`/payment-proofs/${selected.id}/${action}`,{method:"POST",body:JSON.stringify(action==="approve"?{verifiedAmount:amount}:{reason})});setNotice(action==="approve"?"Pembayaran disetujui dan booking telah diperbarui.":"Bukti ditolak. Pelanggan dapat mengunggah ulang sebelum batas waktu.");setSelected(null);setReason("");await reload()}catch(caught){setNotice(caught instanceof Error?caught.message:"Verifikasi belum dapat disimpan.")}finally{setBusy(false)}}
  return <div className="verification-stack">
    {notice?<div className="ui-alert">{notice}</div>:null}
    <Card><div className="card-title"><div><h2>{pending.length} menunggu verifikasi</h2><p>Diperbarui otomatis setiap 10 detik</p></div></div>{pending.length?<div className="proof-grid">{pending.map(row=><button className="proof-notification" key={text(row.id)} onClick={()=>{setSelected(row);setAmount(Number(row.claimedAmount));setReason("")}}><Bell/><span><strong>{text(row.customerName)}</strong><small>{text(row.bookingCode)} · {row.business==="glamping"?"Shakila Akomodasi":"Shakila Jeep Tour"}</small><b>{rupiah(Number(row.claimedAmount))}</b><time>{fmtDate(row.createdAt)}</time></span><ChevronRight/></button>)}</div>:<EmptyState title="Tidak ada bukti baru" description="Notifikasi baru akan muncul otomatis setelah pelanggan mengunggah bukti."/>}</Card>
    {history.length?<Card><h2>Riwayat verifikasi</h2><div className="table-scroll"><Table><TableHeader><TableRow><TableHead>Booking</TableHead><TableHead>Pelanggan</TableHead><TableHead>Nominal</TableHead><TableHead>Status</TableHead><TableHead>Admin</TableHead></TableRow></TableHeader><TableBody>{history.map(row=><TableRow key={text(row.id)}><TableCell><Link className="code-link" href={`/bookings/${row.bookingCode}`}>{text(row.bookingCode)}</Link></TableCell><TableCell>{text(row.customerName)}</TableCell><TableCell>{rupiah(Number(row.verifiedAmount||row.claimedAmount))}</TableCell><TableCell><Badge value={row.status}>{statusLabel(row.status,language)}</Badge>{row.rejectionReason?<small>{text(row.rejectionReason)}</small>:null}</TableCell><TableCell>{text(row.verifiedByAdminEmail)}</TableCell></TableRow>)}</TableBody></Table></div></Card>:null}
    <Dialog open={Boolean(selected)} title="Verifikasi bukti pembayaran" description={selected?`${text(selected.customerName)} · ${text(selected.bookingCode)}`:""} onClose={()=>setSelected(null)}>{selected?<div className="proof-review"><ProofImage id={text(selected.id)}/><dl className="details"><dt>Pelanggan</dt><dd>{text(selected.customerName)}<small>{text(selected.customerWhatsapp)}</small></dd><dt>Bisnis</dt><dd>{text(selected.businessName)}</dd><dt>Nominal diklaim</dt><dd>{rupiah(Number(selected.claimedAmount))}</dd><dt>Diunggah</dt><dd>{fmtDate(selected.createdAt)}</dd><dt>Batas pembayaran</dt><dd>{fmtDate(selected.expiresAt)}</dd></dl><Field label="Nominal terverifikasi"><Input type="number" min="1" max={Number(selected.claimedAmount)} value={amount} onChange={event=>setAmount(Number(event.target.value))}/></Field><Field label="Alasan penolakan (wajib bila ditolak)"><Textarea value={reason} onChange={event=>setReason(event.target.value)} placeholder="Contoh: nominal, rekening, atau tanggal pada bukti tidak sesuai"/></Field><div className="payment-terms"><strong>Aturan pembayaran</strong><span>DP minimal 50% · batas pembayaran 12 jam · DP tidak dapat dikembalikan setelah pembatalan.</span></div><footer className="dialog-actions"><Button variant="destructive" disabled={busy||reason.trim().length<3} onClick={()=>void act("reject")}>Tolak Bukti</Button><Button disabled={busy||amount<1||amount>Number(selected.claimedAmount)} onClick={()=>void act("approve")}>{busy?"Menyimpan...":"Setujui Pembayaran"}</Button></footer></div>:null}</Dialog>
  </div>;
}

function Payments({
  data,
  onPage,
}: {
  data: PageData;
  onPage: (page: number) => void;
}) {
  const { language, t } = useAdminLanguage();
  const start = data.total ? (data.page - 1) * data.pageSize + 1 : 0,
    end = Math.min(data.page * data.pageSize, data.total);
  return (
    <Card>
      <div className="card-title">
        <h2>
          {data.total} {language === "id" ? "transaksi" : "transactions"}
        </h2>
        <span>Data operasional</span>
      </div>
      {data.items.length ? (
        <div className="table-scroll">
          <Table className="payments-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t("payments.transaction")}</TableHead>
                <TableHead>{t("payments.booking")}</TableHead>
                <TableHead>{t("common.customer")}</TableHead>
                <TableHead>{t("common.business")}</TableHead>
                <TableHead>{t("payments.requested")}</TableHead>
                <TableHead>{t("payments.verified")}</TableHead>
                <TableHead>{t("payments.method")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("payments.paidAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <TableRow key={text(row.id)}>
                  <TableCell>
                    <strong>{text(row.transactionId || row.orderId)}</strong>
                    <small>{text(row.provider)}</small>
                  </TableCell>
                  <TableCell>
                    <Link
                      className="code-link"
                      href={`/bookings/${text(row.bookingCode)}`}
                    >
                      {text(row.bookingCode)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <strong>{text(row.customerName)}</strong>
                    <small>{text(row.customerEmail)}</small>
                  </TableCell>
                  <TableCell>
                    {row.business === "glamping" ? "Glamping" : "Jeep"}
                  </TableCell>
                  <TableCell>{rupiah(Number(row.requestedAmount))}</TableCell>
                  <TableCell>{rupiah(Number(row.verifiedAmount))}</TableCell>
                  <TableCell>{text(row.paymentMethod)}</TableCell>
                  <TableCell>
                    <Badge value={row.status}>
                      {statusLabel(row.status, language)}
                    </Badge>
                    {row.requiresReview ? (
                      <small className="review-warning">
                        {t("payments.review")}
                      </small>
                    ) : null}
                  </TableCell>
                  <TableCell>{fmtDate(row.paidAt || row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={t("common.noData")}
          description={t("payments.empty")}
        />
      )}
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        label={
          language === "id"
            ? `Menampilkan ${start}–${end} dari ${data.total} pembayaran`
            : `Showing ${start}–${end} of ${data.total} payments`
        }
        previous={t("common.previous")}
        next={t("common.next")}
        onPage={onPage}
      />
    </Card>
  );
}

void Payments;
function Customers({ rows }: { rows: Row[] }) {
  const { language, t } = useAdminLanguage();
  if (!rows.length)
    return (
      <Card>
        <EmptyState
          title={t("common.noData")}
          description={t("customers.empty")}
        />
      </Card>
    );
  return (
    <section className="customer-grid">
      {rows.map((row) => (
        <Link
          href={`/customers/${row.id}`}
          className="customer-card"
          key={text(row.id)}
        >
          <div className="customer-card-head">
            <span className="avatar">{String(row.fullName).slice(0, 1)}</span>
            <div>
              <strong>{text(row.fullName)}</strong>
              <small>
                {language === "id"
                  ? "Pelanggan Shakila Group"
                  : "Shakila Group customer"}
              </small>
            </div>
            <ChevronRight />
          </div>
          <div className="customer-contact">
            <span>
              <Mail />
              {text(row.email)}
            </span>
            <span>
              <Phone />
              {text(row.whatsapp)}
            </span>
          </div>
          <div className="customer-card-stats">
            <span>
              <b>{text(row.bookingCount)}</b>
              {language === "id" ? "Booking" : "Bookings"}
            </span>
            <span>
              <b>{rupiah(Number(row.verifiedSpending))}</b>
              {language === "id" ? "Terverifikasi" : "Verified"}
            </span>
          </div>
          <div className="customer-card-foot">
            <span>
              <Building2 />
              {text(row.businesses)}
            </span>
            <span>
              {language === "id" ? "Terakhir" : "Last"}{" "}
              {fmtDate(row.lastBookingAt)}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
function Customer({ item }: { item: Row }) {
  const { language } = useAdminLanguage();
  return (
    <>
      <Card className="profile">
        <div className="profile-identity">
          <span className="avatar large">
            {String(item.fullName).slice(0, 1)}
          </span>
          <div>
            <p className="section-kicker">PROFIL PELANGGAN</p>
            <h2>{text(item.fullName)}</h2>
            <div className="profile-contact">
              <span>
                <Mail />
                {text(item.email)}
              </span>
              <span>
                <Phone />
                {text(item.whatsapp)}
              </span>
            </div>
            <small>
              <CalendarDays />
              {language === "id" ? "Pelanggan sejak" : "Customer since"}{" "}
              {fmtDate(item.createdAt)}
            </small>
          </div>
        </div>
        <div className="profile-metrics">
          <span>
            <small>
              {language === "id" ? "Total booking" : "Total bookings"}
            </small>
            <strong>{text(item.bookingCount)}</strong>
          </span>
          <span>
            <small>
              {language === "id"
                ? "Pembayaran terverifikasi"
                : "Verified payments"}
            </small>
            <strong>{rupiah(Number(item.verifiedSpending))}</strong>
          </span>
          <span>
            <small>{language === "id" ? "Bisnis" : "Businesses"}</small>
            <strong>{text(item.businesses)}</strong>
          </span>
        </div>
      </Card>
      <Card>
        <h2>{language === "id" ? "Riwayat booking" : "Booking history"}</h2>
        <BookingRows rows={(item.bookings ?? []) as Row[]} />
      </Card>
    </>
  );
}

function OperationsCalendar({
  data,
}: {
  data: { bookings: Row[]; capacity: Row[] };
}) {
  const { language, t } = useAdminLanguage();
  const capacityLabel = (
    key: "held" | "confirmed" | "blocked" | "available",
  ) =>
    language === "id"
      ? (
          {
            held: "ditahan",
            confirmed: "terkonfirmasi",
            blocked: "diblokir",
            available: "tersedia",
          } as const
        )[key]
      : key;
  const slotLabel = (value: unknown) => {
    const slot = text(value);
    if (language !== "id") return slot;
    return (
      (
        {
          Morning: "Pagi",
          Sunrise: "Matahari terbit",
          Afternoon: "Siang",
        } as Record<string, string>
      )[slot] ?? slot
    );
  };
  return (
    <>
      <Card className="capacity-card">
        <div className="card-title">
          <h2>{language === "id" ? "Kapasitas fisik" : "Physical capacity"}</h2>
          <span>
            {capacityLabel("held")} · {capacityLabel("confirmed")} ·{" "}
            {capacityLabel("blocked")} · {capacityLabel("available")}
          </span>
        </div>
        <div className="capacity-grid">
          {data.capacity.map((row) => (
            <div
              className="capacity-row"
              key={`${row.date}-${row.business}-${row.departureSlotId ?? "all"}`}
            >
              <div>
                <strong>{fmtDate(row.date)}</strong>
                <small>
                  {row.business === "glamping" ? "Glamping" : "Jeep"}{" "}
                  {row.slotName ? `· ${slotLabel(row.slotName)}` : ""}
                </small>
              </div>
              <span>
                {text(row.held)} {capacityLabel("held")}
              </span>
              <span>
                {text(row.confirmed)} {capacityLabel("confirmed")}
              </span>
              <span>
                {text(row.blocked)} {capacityLabel("blocked")}
              </span>
              <strong>
                {text(row.available)} {capacityLabel("available")}
              </strong>
            </div>
          ))}
        </div>
      </Card>
      <section className="calendar-list">
        {data.bookings.length ? (
          data.bookings.map((row) => (
            <Link
              href={`/bookings/${row.bookingCode}`}
              className="calendar-row"
              key={text(row.bookingCode)}
            >
              <time>
                <strong>{String(row.startDate).slice(8, 10)}</strong>
                <small>{fmtDate(row.startDate)}</small>
              </time>
              <span className={`business-stripe ${row.business}`} />
              <div>
                <strong>{text(row.productName)}</strong>
                <small>
                  {text(row.customerName)} · {text(row.bookingCode)}
                </small>
              </div>
              <Badge value={row.status}>
                {statusLabel(row.status, language)}
              </Badge>
            </Link>
          ))
        ) : (
          <Card>
            <EmptyState
              title={t("common.noData")}
              description={
                language === "id"
                  ? "Tidak ada operasi pada periode ini."
                  : "No operations in this period."
              }
            />
          </Card>
        )}
      </section>
    </>
  );
}

function Inventory({
  units,
  reload,
}: {
  units: Row[];
  reload: () => Promise<void>;
}) {
  const { language, t } = useAdminLanguage();
  const [blocks, setBlocks] = useState<Row[]>([]),
    [catalog, setCatalog] = useState<Row>({}),
    [notice, setNotice] = useState("");
  const loadExtras = useCallback(async () => {
    const [nextBlocks, nextCatalog] = await Promise.all([
      adminApi<Row[]>("/inventory/blocks"),
      adminApi<Row>("/catalog"),
    ]);
    setBlocks(nextBlocks);
    setCatalog(nextCatalog);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadExtras(), 0);
    return () => window.clearTimeout(timer);
  }, [loadExtras, units]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      unit = units.find((row) => row.id === form.get("unitId"));
    if (!unit) return;
    if (!form.get("startDate")) {
      setNotice(
        language === "id"
          ? "Tanggal mulai wajib dipilih."
          : "Start date is required.",
      );
      return;
    }
    try {
      await adminApi("/inventory/blocks", {
        method: "POST",
        body: JSON.stringify({
          resourceType: unit.resourceType,
          unitId: unit.id,
          startDate: form.get("startDate"),
          endDate:
            unit.resourceType === "ACCOMMODATION_UNIT"
              ? form.get("endDate")
              : undefined,
          departureSlotId:
            unit.resourceType === "JEEP_UNIT"
              ? form.get("departureSlotId")
              : undefined,
          reason: form.get("reason"),
          note: form.get("note"),
        }),
      });
      setNotice(language === "id" ? "Blok berhasil dibuat." : "Block created.");
      await Promise.all([reload(), loadExtras()]);
    } catch {
      setNotice(t("error.generic"));
    }
  }
  async function remove(id: unknown) {
    await adminApi(`/inventory/blocks/${id}`, { method: "DELETE" });
    await loadExtras();
  }
  return (
    <div className="detail-grid">
      <Card>
        <h2>{t("inventory.createBlock")}</h2>
        <form className="form-grid" onSubmit={submit}>
          <Field label={language === "id" ? "Unit fisik" : "Physical unit"}>
            <AdminSelect
              name="unitId"
              required
              defaultValue={text(units[0]?.id)}
              placeholder={
                language === "id" ? "Pilih unit fisik" : "Choose physical unit"
              }
              options={units.map((row) => ({
                value: text(row.id),
                label: `${text(row.business)} · ${text(row.code)} · ${text(row.productName)}`,
              }))}
            />
          </Field>
          <Field label={language === "id" ? "Tanggal mulai" : "Start date"}>
            <AdminDatePicker
              name="startDate"
              required
              placeholder={
                language === "id" ? "Pilih tanggal mulai" : "Choose start date"
              }
            />
          </Field>
          <Field
            label={
              language === "id"
                ? "Tanggal akhir (Glamping)"
                : "End date (Glamping)"
            }
          >
            <AdminDatePicker
              name="endDate"
              placeholder={
                language === "id" ? "Pilih tanggal akhir" : "Choose end date"
              }
            />
          </Field>
          <Field
            label={
              language === "id"
                ? "Slot keberangkatan (Jeep)"
                : "Departure slot (Jeep)"
            }
          >
            <AdminSelect
              name="departureSlotId"
              placeholder={language === "id" ? "Tanpa slot" : "No slot"}
              options={((catalog.slots ?? []) as Row[]).map((row) => ({
                value: text(row.id),
                label: row.departureTime ? `${text(row.name)} · ${String(row.departureTime).slice(0, 5)}` : text(row.name),
              }))}
            />
          </Field>
          <Field label={language === "id" ? "Alasan" : "Reason"}>
            <AdminSelect
              name="reason"
              defaultValue="Maintenance"
              placeholder={language === "id" ? "Pilih alasan" : "Choose reason"}
              options={[
                {
                  value: "Maintenance",
                  label: language === "id" ? "Pemeliharaan" : "Maintenance",
                },
                {
                  value: "Owner use",
                  label: language === "id" ? "Penggunaan pemilik" : "Owner use",
                },
                {
                  value: "Operational hold",
                  label:
                    language === "id"
                      ? "Penahanan operasional"
                      : "Operational hold",
                },
              ]}
            />
          </Field>
          <Field
            className="full"
            label={language === "id" ? "Catatan" : "Note"}
          >
            <Textarea name="note" rows={3} />
          </Field>
          <Button>{t("inventory.createBlock")}</Button>
        </form>
        {notice ? <div className="ui-alert">{notice}</div> : null}
      </Card>
      <Card>
        <h2>{t("inventory.activeBlocks")}</h2>
        {blocks.length ? (
          blocks.map((row) => (
            <div className="block-row" key={text(row.id)}>
              <div>
                <strong>
                  {text(row.unitCode)} · {text(row.reason)}
                </strong>
                <small>
                  {text(row.startDate)} {row.endDate ? `— ${row.endDate}` : ""}{" "}
                  {text(row.slotName)}
                </small>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void remove(row.id)}
              >
                {language === "id" ? "Hapus blok" : "Remove block"}
              </Button>
            </div>
          ))
        ) : (
          <EmptyState
            title={t("common.noData")}
            description={
              language === "id"
                ? "Tidak ada unit yang diblokir."
                : "No active inventory blocks."
            }
          />
        )}
      </Card>
      <Card className="full-span">
        <h2>{t("inventory.units")}</h2>
        <div className="unit-grid">
          {units.map((row) => (
            <div className="unit" key={text(row.id)}>
              <strong>{text(row.code)}</strong>
              <span>{text(row.productName)}</span>
              <small>
                {text(row.business)} ·{" "}
                {row.isActive ? t("common.active") : t("common.inactive")}
              </small>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

type CatalogDialog = {
  type: "product" | "unit" | "slot";
  parentId?: string;
  item?: Row;
} | null;
type CatalogRemoval = { type: "product" | "unit" | "slot"; item: Row } | null;
function CatalogManager({
  kind,
  rows,
  reload,
}: {
  kind: "glamping" | "jeep";
  rows: Row[];
  reload: () => Promise<void>;
}) {
  const { language, t } = useAdminLanguage();
  const [units, setUnits] = useState<Row[]>([]),
    [slots, setSlots] = useState<Row[]>([]),
    [dialog, setDialog] = useState<CatalogDialog>(null),
    [removal, setRemoval] = useState<CatalogRemoval>(null),
    [notice, setNotice] = useState("");
  const loadChildren = useCallback(async () => {
    if (kind === "glamping") {
      const nested = await Promise.all(
        rows.map((row) => adminApi<Row[]>(`/glamping/types/${row.id}/units`)),
      );
      setUnits(nested.flat());
      setSlots([]);
    } else {
      const [fleet, ...slotLists] = await Promise.all([
        adminApi<Row[]>("/jeep/units"),
        ...rows.map((row) => adminApi<Row[]>(`/jeep/packages/${row.id}/slots`)),
      ]);
      setUnits(fleet);
      setSlots(slotLists.flat());
    }
  }, [kind, rows]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadChildren(), 0);
    return () => window.clearTimeout(timer);
  }, [loadChildren]);
  async function mutate(path: string, method: "POST" | "PATCH", body: Row) {
    setNotice("");
    try {
      await adminApi(path, { method, body: JSON.stringify(body) });
      setDialog(null);
      setNotice(
        language === "id"
          ? "Perubahan katalog berhasil disimpan."
          : "Catalog change saved.",
      );
      await reload();
      await loadChildren();
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : t("error.generic"));
    }
  }
  async function removeCatalogItem() {
    if (!removal) return;
    const path = removal.type === "product"
      ? `/${kind === "glamping" ? "glamping/types" : "jeep/packages"}/${removal.item.id}`
      : removal.type === "slot"
        ? `/jeep/slots/${removal.item.id}`
        : kind === "glamping"
          ? `/glamping/units/${removal.item.id}`
          : `/jeep/units/${removal.item.id}`;
    try {
      const result = await adminApi<{ disposition: "DELETED" | "ARCHIVED" }>(path, { method: "DELETE" });
      setRemoval(null);
      setNotice(result.disposition === "DELETED" ? "Data katalog berhasil dihapus." : "Data memiliki riwayat dan telah diarsipkan dari katalog publik.");
      await reload();
      await loadChildren();
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : t("error.generic"));
    }
  }
  async function saveProduct(event: FormEvent<HTMLFormElement>, row?: Row) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      body = {
        name: String(form.get("name")),
        description: String(form.get("description")),
        price: Number(form.get("price")),
        capacity: Number(form.get("capacity")),
        ...(kind === "glamping" ? { kind: String(form.get("kind") || row?.kind || "GLAMPING") } : {}),
        isActive: form.get("isActive") === "on",
      };
    await mutate(
      `/${kind === "glamping" ? "glamping/types" : "jeep/packages"}${row ? `/${row.id}` : ""}`,
      row ? "PATCH" : "POST",
      body,
    );
  }
  async function saveChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    const form = new FormData(event.currentTarget);
    if (dialog.type === "unit") {
      const body = {
        code: String(form.get("code")),
        name: String(form.get("name")),
        isActive: form.get("isActive") === "on",
      };
      const path =
        kind === "glamping"
          ? dialog.item
            ? `/glamping/units/${dialog.item.id}`
            : `/glamping/types/${dialog.parentId}/units`
          : dialog.item
            ? `/jeep/units/${dialog.item.id}`
            : "/jeep/units";
      await mutate(path, dialog.item ? "PATCH" : "POST", body);
    } else if (dialog.type === "slot") {
      const body = {
        name: String(form.get("name")),
        departureTime: String(form.get("departureTime") || "") || null,
        isActive: form.get("isActive") === "on",
      };
      await mutate(
        dialog.item
          ? `/jeep/slots/${dialog.item.id}`
          : `/jeep/packages/${dialog.parentId}/slots`,
        dialog.item ? "PATCH" : "POST",
        body,
      );
    } else await saveProduct(event, dialog.item);
  }
  async function toggleChild(item: Row, type: "unit" | "slot") {
    const path =
      type === "slot"
        ? `/jeep/slots/${item.id}`
        : kind === "glamping"
          ? `/glamping/units/${item.id}`
          : `/jeep/units/${item.id}`;
    await mutate(path, "PATCH", { isActive: !item.isActive });
  }
  return (
    <>
      <div className="catalog-actions">
        <div>
          <strong>
            {kind === "glamping"
              ? `${rows.length} ${language === "id" ? "tipe akomodasi" : "accommodation types"}`
              : `${rows.length} ${language === "id" ? "paket Jeep" : "Jeep packages"}`}
          </strong>
          <span>{t("catalog.snapshot")}</span>
        </div>
        <Button onClick={() => setDialog({ type: "product" })}>
          <Plus size={17} />
          {kind === "glamping" ? t("catalog.addType") : t("catalog.addPackage")}
        </Button>
      </div>
      {notice ? <div className="ui-alert">{notice}</div> : null}
      {kind === "jeep" ? (
        <Card className="fleet-card">
          <div className="card-title">
            <div>
              <p className="section-kicker">ARMADA FISIK · {units.filter((item) => item.isActive).length} JEEP AKTIF · DATA CLIENT TERKONFIRMASI</p>
              <h2>{t("catalog.fleet")}</h2>
            </div>
            <Button
              variant="outline"
              onClick={() => setDialog({ type: "unit" })}
            >
              <Plus size={16} />
              {t("catalog.addJeep")}
            </Button>
          </div>
          <UnitList
            items={units}
            onEdit={(item) => setDialog({ type: "unit", item })}
            onToggle={(item) => void toggleChild(item, "unit")}
            onRemove={(item) => setRemoval({ type: "unit", item })}
          />
        </Card>
      ) : null}
      <div className="product-grid">
        {rows.map((row) => (
          <Card className="product-editor" key={text(row.id)}>
            <form onSubmit={(event) => void saveProduct(event, row)}>
              <div className="product-head">
                <div>
                  <p className="section-kicker">{kind === "glamping" ? `${text(row.kind) === "HOMESTAY" ? "HOMESTAY" : "GLAMPING"} · ${text(row.slug)}` : text(row.slug)}</p>
                  <h2>{text(row.name)}</h2>
                </div>
                <div className="catalog-item-actions"><Badge value={row.isActive ? "ACTIVE" : "INACTIVE"}>{row.isActive ? t("common.active") : t("common.inactive")}</Badge><Button type="button" variant="destructive" size="sm" onClick={()=>setRemoval({type:"product",item:row})}><Trash2 size={14}/>Hapus</Button></div>
              </div>
              <Field label={t("common.name")}>
                <Input name="name" defaultValue={text(row.name)} required />
              </Field>
              <Field label={t("common.description")}>
                <Textarea
                  name="description"
                  defaultValue={text(row.description)}
                  rows={4}
                  required
                />
              </Field>
              <div className="split">
                <Field label={t("common.price")}>
                  <Input
                    name="price"
                    type="number"
                    min="1"
                    defaultValue={Number(row.price)}
                    required
                  />
                </Field>
                <Field label={t("common.capacity")}>
                  <Input
                    name="capacity"
                    type="number"
                    min="1"
                    defaultValue={Number(row.capacity)}
                    required
                  />
                </Field>
              </div>
              <label className="switch-field">
                <Switch
                  name="isActive"
                  defaultChecked={Boolean(row.isActive)}
                />
                {t("common.active")}
              </label>
              <Button>{t("common.save")}</Button>
            </form>
            <div className="children-manager">
              <div className="card-title">
                <div>
                  <h3>
                    {kind === "glamping"
                      ? t("inventory.units")
                      : language === "id"
                        ? "Slot keberangkatan"
                        : "Departure slots"}
                  </h3>
                  <p>
                    {kind === "glamping"
                      ? `${units.filter((item) => item.accommodationTypeId === row.id).length} ${t("catalog.units")}`
                      : `${slots.filter((item) => item.jeepPackageId === row.id).length} slot`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setDialog({
                      type: kind === "glamping" ? "unit" : "slot",
                      parentId: text(row.id),
                    })
                  }
                >
                  <Plus size={15} />
                  {kind === "glamping"
                    ? t("catalog.addUnit")
                    : t("catalog.addSlot")}
                </Button>
              </div>
              {kind === "glamping" ? (
                <UnitList
                  items={units.filter(
                    (item) => item.accommodationTypeId === row.id,
                  )}
                  onEdit={(item) =>
                    setDialog({ type: "unit", parentId: text(row.id), item })
                  }
                  onToggle={(item) => void toggleChild(item, "unit")}
                  onRemove={(item) => setRemoval({ type: "unit", item })}
                />
              ) : (
                <SlotList
                  items={slots.filter((item) => item.jeepPackageId === row.id)}
                  onEdit={(item) =>
                    setDialog({ type: "slot", parentId: text(row.id), item })
                  }
                  onToggle={(item) => void toggleChild(item, "slot")}
                  onRemove={(item) => setRemoval({ type: "slot", item })}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
      {!rows.length ? (
        <Card>
          <EmptyState
            title={
              kind === "glamping"
                ? language === "id"
                  ? "Belum ada tipe glamping."
                  : "No Glamping types yet."
                : language === "id"
                  ? "Belum ada paket Jeep."
                  : "No Jeep packages yet."
            }
            description={t("catalog.snapshot")}
            action={
              <Button onClick={() => setDialog({ type: "product" })}>
                {kind === "glamping"
                  ? t("catalog.addType")
                  : t("catalog.addPackage")}
              </Button>
            }
          />
        </Card>
      ) : null}
      <Dialog
        open={Boolean(dialog)}
        title={
          dialog?.type === "product"
            ? kind === "glamping"
              ? t("catalog.addType")
              : t("catalog.addPackage")
            : dialog?.type === "slot"
              ? t("catalog.addSlot")
              : kind === "jeep"
                ? t("catalog.addJeep")
                : t("catalog.addUnit")
        }
        description={
          dialog?.item
            ? language === "id"
              ? "Perbarui data dan status dengan aman."
              : "Safely update data and active status."
            : t("catalog.snapshot")
        }
        onClose={() => setDialog(null)}
      >
        {dialog ? (
          <form
            className="dialog-form"
            onSubmit={(event) => void saveChild(event)}
          >
            {dialog.type === "product" ? (
              <>
                {kind === "glamping" ? <Field label="Jenis akomodasi"><AdminSelect name="kind" defaultValue={text(dialog.item?.kind || "GLAMPING")} placeholder="Pilih jenis" options={[{value:"GLAMPING",label:"Glamping"},{value:"HOMESTAY",label:"Homestay"}]}/></Field> : null}
                <Field label={t("common.name")}>
                  <Input
                    name="name"
                    defaultValue={dialog.item ? text(dialog.item.name) : ""}
                    required
                  />
                </Field>
                <Field label={t("common.description")}>
                  <Textarea
                    name="description"
                    defaultValue={
                      dialog.item ? text(dialog.item.description) : ""
                    }
                    required
                  />
                </Field>
                <div className="split">
                  <Field label={t("common.price")}>
                    <Input
                      name="price"
                      type="number"
                      min="1"
                      defaultValue={Number(dialog.item?.price ?? 850000)}
                      required
                    />
                  </Field>
                  <Field label={t("common.capacity")}>
                    <Input
                      name="capacity"
                      type="number"
                      min="1"
                      defaultValue={Number(dialog.item?.capacity ?? 2)}
                      required
                    />
                  </Field>
                </div>
              </>
            ) : dialog.type === "unit" ? (
              <>
                <Field label={t("common.code")}>
                  <Input
                    name="code"
                    defaultValue={dialog.item ? text(dialog.item.code) : ""}
                    placeholder={kind === "glamping" ? "DOME-05" : "JEEP-09"}
                    required
                  />
                </Field>
                <Field label={t("common.name")}>
                  <Input
                    name="name"
                    defaultValue={dialog.item ? text(dialog.item.name) : ""}
                    placeholder={kind === "glamping" ? "Dome 05" : "Jeep 09"}
                    required
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label={t("common.name")}>
                  <Input
                    name="name"
                    defaultValue={dialog.item ? text(dialog.item.name) : ""}
                    placeholder="Jadwal Keberangkatan"
                    required
                  />
                </Field>
                <Field
                  label={
                    language === "id" ? "Waktu keberangkatan" : "Departure time"
                  }
                >
                  <Input
                    name="departureTime"
                    type="time"
                    defaultValue={String(
                      dialog.item?.departureTime ?? "",
                    ).slice(0, 5)}
                  />
                </Field>
              </>
            )}
            <label className="switch-field">
              <Switch
                name="isActive"
                defaultChecked={
                  dialog.item ? Boolean(dialog.item.isActive) : true
                }
              />
              {t("common.active")}
            </label>
            <footer className="dialog-actions">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialog(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button>{t("common.save")}</Button>
            </footer>
          </form>
        ) : null}
      </Dialog>
      <Dialog open={Boolean(removal)} title="Hapus data katalog?" description="Data tanpa riwayat akan dihapus. Data yang sudah memiliki booking atau reservasi akan dinonaktifkan agar rincian lama tetap utuh." onClose={()=>setRemoval(null)}>
        {removal?<div className="confirmation-summary"><div className="confirmation-icon"><Trash2/></div><strong>{text(removal.item.name)}</strong><span>Data ini tidak akan tampil di katalog publik setelah tindakan selesai.</span><footer className="dialog-actions"><Button variant="ghost" onClick={()=>setRemoval(null)}>Batal</Button><Button variant="destructive" onClick={()=>void removeCatalogItem()}>Hapus</Button></footer></div>:null}
      </Dialog>
    </>
  );
}
function UnitList({
  items,
  onEdit,
  onToggle,
  onRemove,
}: {
  items: Row[];
  onEdit: (item: Row) => void;
  onToggle: (item: Row) => void;
  onRemove: (item: Row) => void;
}) {
  const { language, t } = useAdminLanguage();
  if (!items.length)
    return (
      <EmptyState
        title={t("common.noData")}
        description={
          language === "id" ? "Belum ada unit fisik." : "No physical units yet."
        }
      />
    );
  return (
    <div className="catalog-list">
      {items.map((item) => (
        <div key={text(item.id)}>
          <div>
            <span className="resource-icon">
              <BedDouble size={16} />
            </span>
            <span>
              <strong>{text(item.name)}</strong>
              <small>{text(item.code)}</small>
            </span>
          </div>
          <div>
            {item.hasActiveReservation ? (
              <span className="reservation-lock">
                <Clock3 size={13} />
                {language === "id" ? "Ada reservasi" : "Reserved"}
              </span>
            ) : null}
            <Badge value={item.isActive ? "ACTIVE" : "INACTIVE"}>
              {item.isActive ? t("common.active") : t("common.inactive")}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Pencil size={15} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(item.hasActiveReservation && item.isActive)}
              onClick={() => onToggle(item)}
            >
              {item.isActive
                ? language === "id"
                  ? "Nonaktifkan"
                  : "Deactivate"
                : language === "id"
                  ? "Aktifkan"
                  : "Activate"}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onRemove(item)}><Trash2 size={14}/>Hapus</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
function SlotList({
  items,
  onEdit,
  onToggle,
  onRemove,
}: {
  items: Row[];
  onEdit: (item: Row) => void;
  onToggle: (item: Row) => void;
  onRemove: (item: Row) => void;
}) {
  const { language, t } = useAdminLanguage();
  if (!items.length)
    return (
      <EmptyState
        title={t("common.noData")}
        description={
          language === "id"
            ? "Belum ada slot keberangkatan."
            : "No departure slots yet."
        }
      />
    );
  return (
    <div className="catalog-list">
      {items.map((item) => (
        <div key={text(item.id)}>
          <div>
            <span className="resource-icon">
              <Clock3 size={16} />
            </span>
            <span>
              <strong>
                {item.departureTime ? `${String(item.departureTime).slice(0, 5)} · ${text(item.name)}` : text(item.name)}
              </strong>
              <small>{text(item.packageName)}</small>
            </span>
          </div>
          <div>
            <Badge value={item.isActive ? "ACTIVE" : "INACTIVE"}>
              {item.isActive ? t("common.active") : t("common.inactive")}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Pencil size={15} />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onRemove(item)}><Trash2 size={14}/>Hapus</Button>
            <Button variant="outline" size="sm" onClick={() => onToggle(item)}>
              {item.isActive
                ? language === "id"
                  ? "Nonaktifkan"
                  : "Deactivate"
                : language === "id"
                  ? "Aktifkan"
                  : "Activate"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsView({
  rows,
  reload,
}: {
  rows: Row[];
  reload: () => Promise<void>;
}) {
  const { language, t } = useAdminLanguage();
  async function save(event: FormEvent<HTMLFormElement>, id: unknown) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await adminApi(`/settings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        dpPercentage: Number(form.get("dpPercentage")),
        bookingHoldMinutes: Number(form.get("bookingHoldMinutes")),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
      }),
    });
    await reload();
  }
  return (
    <div className="product-grid">
      {rows.map((row) => (
        <Card className="product-editor" key={text(row.id)}>
          <form onSubmit={(event) => void save(event, row.id)}>
            <p className="section-kicker">{text(row.business)}</p>
            <h2>
              {row.business === "glamping"
                ? "Shakila Glamping"
                : "Shakila Jeep Tour"}
            </h2>
            <div className="mode-status">
              <strong>MODE OPERASIONAL</strong>
              <span>Proses langsung · PDF langsung · pratinjau surel</span>
            </div>
            <Field
              label={
                language === "id" ? "Zona waktu bisnis" : "Business timezone"
              }
            >
              <Input disabled readOnly value={text(row.timezone)} />
            </Field>
            <div className="split">
              <Field label="Persentase DP">
                <Input
                  type="number"
                  min="50"
                  max="100"
                  name="dpPercentage"
                  defaultValue={Number(row.dpPercentage)}
                />
              </Field>
              <Field
                label={
                  language === "id"
                    ? "Durasi hold (menit)"
                    : "Hold duration (minutes)"
                }
              >
                <Input
                  type="number"
                  min="1"
                  max="720"
                  name="bookingHoldMinutes"
                  defaultValue={Number(row.bookingHoldMinutes)}
                />
              </Field>
            </div>
            <div className="payment-terms"><strong>Kebijakan pembayaran aktif</strong><span>DP minimal 50% · pembayaran maksimal 12 jam · DP tidak dapat dikembalikan bila booking dibatalkan.</span></div>
            <Field label="Surel kontak">
              <Input
                type="email"
                name="contactEmail"
                defaultValue={text(row.contactEmail)}
              />
            </Field>
            <Field label="Nomor kontak">
              <Input
                name="contactPhone"
                defaultValue={text(row.contactPhone)}
              />
            </Field>
            <Button>{t("common.save")}</Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
