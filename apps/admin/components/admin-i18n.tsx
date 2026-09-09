"use client";

import { createContext, useContext, useMemo } from "react";

export type AdminLanguage = "id" | "en";
const copy = {
  "brand.parent": ["Shakila Group", "Shakila Group"],
  "brand.admin": ["Admin", "Admin"],
  "nav.overview": ["Ringkasan", "Overview"],
  "nav.operations": ["OPERASIONAL", "OPERATIONS"],
  "nav.bookings": ["Booking", "Bookings"],
  "nav.calendar": ["Kalender", "Calendar"],
  "nav.inventory": ["Inventori", "Inventory"],
  "nav.payments": ["Pembayaran", "Payments"],
  "nav.customers": ["Pelanggan", "Customers"],
  "nav.business": ["BISNIS", "BUSINESS"],
  "nav.glamping": ["Akomodasi", "Accommodation"],
  "nav.jeep": ["Jeep", "Jeep"],
  "nav.system": ["SISTEM", "SYSTEM"],
  "nav.settings": ["Pengaturan", "Settings"],
  "common.allBusinesses": ["Semua Bisnis", "All Businesses"],
  "common.active": ["Aktif", "Active"],
  "common.inactive": ["Nonaktif", "Inactive"],
  "common.save": ["Simpan", "Save"],
  "common.cancel": ["Batal", "Cancel"],
  "common.close": ["Tutup", "Close"],
  "common.add": ["Tambah", "Add"],
  "common.edit": ["Edit", "Edit"],
  "common.apply": ["Terapkan", "Apply"],
  "common.reset": ["Reset Filter", "Reset Filters"],
  "common.previous": ["Sebelumnya", "Previous"],
  "common.next": ["Berikutnya", "Next"],
  "common.loading": ["Memuat data operasional…", "Loading operational data…"],
  "common.retry": ["Coba lagi", "Try again"],
  "common.noData": ["Belum ada data operasional", "No operational data yet"],
  "common.logout": ["Keluar", "Log out"],
  "common.name": ["Nama", "Name"],
  "common.description": ["Deskripsi", "Description"],
  "common.code": ["Kode", "Code"],
  "common.capacity": ["Kapasitas", "Capacity"],
  "common.status": ["Status", "Status"],
  "common.created": ["Dibuat", "Created"],
  "common.business": ["Bisnis", "Business"],
  "common.customer": ["Pelanggan", "Customer"],
  "common.date": ["Tanggal", "Date"],
  "common.price": ["Harga", "Price"],
  "dashboard.title": ["Ringkasan hari ini", "Today’s overview"],
  "dashboard.description": ["Ringkasan operasional seluruh layanan Shakila Group.", "Operational overview of all Shakila Group services."],
  "dashboard.revenue": ["Pendapatan diterima", "Revenue received"],
  "dashboard.bookingValue": ["Nilai booking", "Booking value"],
  "dashboard.outstanding": ["Sisa tagihan", "Outstanding"],
  "dashboard.totalBookings": ["Total booking", "Total bookings"],
  "dashboard.todayBookings": ["Booking hari ini", "Today’s bookings"],
  "dashboard.upcoming": ["7 hari mendatang", "Upcoming 7 days"],
  "dashboard.pulse": ["Pergerakan 7 hari", "7-day pulse"],
  "dashboard.recent": ["Booking terbaru", "Recent bookings"],
  "dashboard.seeAll": ["Lihat semua", "See all"],
  "bookings.title": ["Operasional booking", "Booking operations"],
  "bookings.description": ["Cari, periksa, dan jalankan siklus reservasi.", "Search, review, and run reservation lifecycles."],
  "bookings.search": ["Cari kode, nama, email, atau WhatsApp…", "Search code, name, email, or WhatsApp…"],
  "bookings.allStatus": ["Semua status booking", "All booking statuses"],
  "bookings.allPayment": ["Semua status pembayaran", "All payment statuses"],
  "bookings.empty": ["Tidak ada booking yang sesuai filter.", "No bookings match these filters."],
  "booking.title": ["Detail booking", "Booking detail"],
  "booking.description": ["Reservasi, pembayaran, invoice, dan timeline dalam satu layar.", "Reservation, payment, invoice, and timeline in one view."],
  "booking.checkIn": ["Check-in tamu", "Check in guest"],
  "booking.checkOut": ["Selesaikan check-out", "Complete check-out"],
  "booking.cancel": ["Batalkan booking", "Cancel booking"],
  "booking.cancelReason": ["Alasan pembatalan", "Cancellation reason"],
  "booking.cancelWarning": ["Pembatalan tidak otomatis mengembalikan pembayaran.", "Cancellation does not automatically refund payment."],
  "booking.documents": ["Dokumen", "Documents"],
  "booking.allocation": ["Alokasi fisik", "Physical allocation"],
  "booking.timeline": ["Timeline", "Timeline"],
  "booking.attempts": ["Percobaan pembayaran", "Payment attempts"],
  "payments.title": ["Pembayaran", "Payments"],
  "payments.description": ["Lacak transaksi terverifikasi, pending, dan yang perlu ditinjau.", "Track verified, pending, and review-required transactions."],
  "payments.search": ["Cari nama, kode booking, email, atau transaksi…", "Search customer, booking, email, or transaction…"],
  "payments.allStatus": ["Semua status", "All statuses"],
  "payments.allMethods": ["Semua metode", "All methods"],
  "payments.review": ["Perlu ditinjau", "Requires review"],
  "payments.transaction": ["Transaksi", "Transaction"],
  "payments.booking": ["Booking", "Booking"],
  "payments.requested": ["Diminta", "Requested"],
  "payments.verified": ["Terverifikasi", "Verified"],
  "payments.method": ["Metode", "Method"],
  "payments.paidAt": ["Dibayar", "Paid at"],
  "payments.empty": ["Tidak ada pembayaran yang sesuai filter.", "No payments match these filters."],
  "customers.title": ["Direktori pelanggan", "Customer directory"],
  "customers.description": ["Riwayat pelanggan lintas bisnis Shakila Group.", "Customer history across Shakila Group businesses."],
  "customers.empty": ["Tidak ada pelanggan ditemukan.", "No customers found."],
  "calendar.title": ["Kalender operasional", "Operations calendar"],
  "calendar.description": ["Kedatangan Glamping dan perjalanan Jeep dalam 45 hari.", "Glamping arrivals and Jeep trips over 45 days."],
  "inventory.title": ["Ketersediaan unit", "Unit availability"],
  "inventory.description": ["Kelola unit dan blok operasional untuk setiap tanggal reservasi.", "Manage units and operational blocks for each reservation date."],
  "inventory.createBlock": ["Buat blok inventory", "Create inventory block"],
  "inventory.activeBlocks": ["Blok aktif", "Active blocks"],
  "inventory.units": ["Unit fisik", "Physical units"],
  "catalog.glampingTitle": ["Katalog Akomodasi", "Accommodation catalog"],
  "catalog.glampingDescription": ["Kelola tipe akomodasi dan unit tanpa mengubah rincian booking lama.", "Manage accommodation types and units without changing past booking details."],
  "catalog.jeepTitle": ["Katalog Jeep", "Jeep catalog"],
  "catalog.jeepDescription": ["Kelola paket, slot keberangkatan, dan armada fisik.", "Manage packages, departure slots, and physical fleet."],
  "catalog.addType": ["Tambah tipe", "Add type"],
  "catalog.addPackage": ["Tambah paket", "Add package"],
  "catalog.manageUnits": ["Kelola unit", "Manage units"],
  "catalog.addUnit": ["Tambah unit", "Add unit"],
  "catalog.addJeep": ["Tambah Jeep", "Add Jeep"],
  "catalog.addSlot": ["Tambah slot", "Add slot"],
  "catalog.units": ["unit fisik", "physical units"],
  "catalog.fleet": ["armada Jeep", "Jeep fleet"],
  "catalog.snapshot": ["Rincian harga pada booking lama tetap tidak berubah.", "Pricing details on past bookings remain unchanged."],
  "settings.title": ["Pengaturan bisnis", "Business settings"],
  "settings.description": ["Atur persentase DP dan batas waktu pembayaran.", "Configure deposit percentage and payment deadline."],
  "login.welcome": ["Selamat datang kembali", "Welcome back"],
  "login.description": ["Masuk untuk mengelola booking, pembayaran, dan operasional Shakila Group.", "Sign in to manage Shakila Group bookings, payments, and operations."],
  "login.password": ["Kata sandi", "Password"],
  "login.submit": ["Masuk ke dashboard", "Sign in to dashboard"],
  "login.verifying": ["Memverifikasi…", "Verifying…"],
  "error.generic": ["Data tidak dapat dimuat. Silakan coba lagi.", "Data could not be loaded. Please try again."],
} as const satisfies Record<string, readonly [string, string]>;

type TranslationKey = keyof typeof copy;
type ContextValue = { language: AdminLanguage; t: (key: TranslationKey) => string };
const Context = createContext<ContextValue | null>(null);

export function AdminLanguageProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<ContextValue>(() => ({ language: "id", t: (key) => copy[key][0] }), []);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAdminLanguage() {
  const context = useContext(Context);
  if (!context) throw new Error("useAdminLanguage must be used within AdminLanguageProvider");
  return context;
}

export function statusLabel(value: unknown, language: AdminLanguage) {
  const statuses: Record<string, [string, string]> = {
    WAITING_PAYMENT: ["Menunggu Pembayaran", "Waiting Payment"], CONFIRMED: ["Dikonfirmasi", "Confirmed"], CHECKED_IN: ["Sudah Check-in", "Checked In"], CHECKED_OUT: ["Sudah Check-out", "Checked Out"], COMPLETED: ["Selesai", "Completed"], CANCELLED: ["Dibatalkan", "Cancelled"], EXPIRED: ["Kedaluwarsa", "Expired"], UNPAID: ["Belum Dibayar", "Unpaid"], PENDING: ["Menunggu", "Pending"], PARTIALLY_PAID: ["DP Terverifikasi", "DP Paid"], PAID: ["Lunas", "Paid"], FAILED: ["Gagal", "Failed"], REFUNDED: ["Dikembalikan", "Refunded"], SUCCESS: ["Berhasil", "Success"], CREATED: ["Dibuat", "Created"], EXCEPTION: ["Perlu Ditinjau", "Exception"], HELD: ["Ditahan", "Held"], IN_USE: ["Digunakan", "In Use"], RELEASED: ["Dilepas", "Released"], GENERATED: ["Dibuat", "Generated"], ACTIVE: ["Aktif", "Active"], INACTIVE: ["Nonaktif", "Inactive"], APPROVED: ["Disetujui", "Approved"], REJECTED: ["Ditolak", "Rejected"], ONLINE: ["Daring", "Online"], ADMIN_MANUAL: ["Booking manual Admin", "Manual Admin booking"], WALK_IN: ["Datang langsung", "Walk-in"], MANUAL_TRANSFER: ["Transfer manual", "Manual transfer"], BANK_TRANSFER: ["Transfer bank", "Bank transfer"], ACCOMMODATION: ["Akomodasi", "Accommodation"], CUSTOMER: ["Pelanggan", "Customer"], SYSTEM: ["Sistem", "System"], BACKGROUND_JOB: ["Proses latar", "Background job"],
  };
  const found = statuses[String(value)];
  return found ? found[language === "id" ? 0 : 1] : String(value ?? "—").replaceAll("_", " ");
}
