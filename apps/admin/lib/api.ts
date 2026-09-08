export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3003/api/v1";

export class AdminApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

const pesanKesalahan: Record<string, string> = {
  AUTH_REQUIRED: "Sesi Admin telah berakhir. Silakan masuk kembali.",
  FORBIDDEN: "Anda tidak memiliki izin untuk tindakan ini.",
  INVENTORY_NOT_AVAILABLE: "Inventori tidak mencukupi. Pilih tanggal, slot, atau jumlah lain.",
  PAYMENT_PROOF_ALREADY_REVIEWED: "Bukti pembayaran ini sudah diverifikasi sebelumnya.",
  PAYMENT_PROOF_NOT_FOUND: "Bukti pembayaran tidak ditemukan.",
  PAYMENT_PROOF_STORAGE_UNAVAILABLE: "Bukti pembayaran belum dapat dibuka.",
  BOOKING_EXPIRED: "Booking sudah kedaluwarsa dan inventori telah dilepas.",
  INVALID_PAYMENT_AMOUNT: "Nominal pembayaran tidak memenuhi ketentuan booking.",
  PAYMENT_BALANCE_REMAINING: "Booking harus LUNAS sebelum Check-In.",
  BOOKING_ALREADY_PAID: "Booking ini sudah LUNAS. Tidak ada pembayaran yang ditambahkan.",
  IDEMPOTENCY_CONFLICT: "Permintaan pembayaran ini sudah digunakan untuk booking lain.",
  VALIDATION_ERROR: "Data belum lengkap atau tidak valid.",
  REQUEST_FAILED: "Permintaan belum dapat diproses.",
};

export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/admin${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const envelope = (await response.json()) as {
    data: T | null;
    error: { code: string; message: string } | null;
  };
  if (!response.ok || envelope.error)
    throw new AdminApiError(
      envelope.error?.code ?? "REQUEST_FAILED",
      pesanKesalahan[envelope.error?.code ?? "REQUEST_FAILED"] ?? "Permintaan belum dapat diproses. Silakan coba lagi.",
    );
  return envelope.data as T;
}
export const rupiah=(value:number)=>`Rp${new Intl.NumberFormat("id-ID").format(value)}`;
export const text=(value:unknown)=>value===null||value===undefined?"—":String(value);
