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
      envelope.error?.message ?? "Permintaan gagal.",
    );
  return envelope.data as T;
}
export const rupiah=(value:number)=>`Rp${new Intl.NumberFormat("id-ID").format(value)}`;
export const text=(value:unknown)=>value===null||value===undefined?"—":String(value);
