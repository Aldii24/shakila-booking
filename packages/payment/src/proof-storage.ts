import { randomUUID } from "node:crypto";
import { DomainError } from "@booking/booking";

export type ProofStorageInput = {
  bookingCode: string;
  mimeType: "image/jpeg" | "image/png";
  fileDataBase64: string;
};

export type StoredPaymentProof = {
  provider: "DATABASE" | "R2";
  key: string;
  inlineDataBase64: string | null;
};

export type PaymentProofStorageAdapter = {
  store(input: ProofStorageInput): Promise<StoredPaymentProof>;
  read(input: StoredPaymentProof): Promise<Buffer>;
};

const extension = (mimeType: ProofStorageInput["mimeType"]) =>
  mimeType === "image/png" ? "png" : "jpg";

/**
 * Adapter aman untuk demo: bukti disimpan persisten di PostgreSQL, bukan di
 * filesystem deployment. Implementasi R2 dapat mengganti adapter ini tanpa
 * mengubah kontrak service atau audit payment proof.
 */
export const databasePaymentProofStorage: PaymentProofStorageAdapter = {
  async store(input) {
    return {
      provider: "DATABASE",
      key: `payment-proofs/${input.bookingCode}/${randomUUID()}.${extension(input.mimeType)}`,
      inlineDataBase64: input.fileDataBase64,
    };
  },
  async read(input) {
    if (input.provider !== "DATABASE" || !input.inlineDataBase64) {
      throw new DomainError(
        "PAYMENT_PROOF_STORAGE_UNAVAILABLE",
        "Bukti pembayaran belum dapat dibuka.",
        503,
      );
    }
    return Buffer.from(input.inlineDataBase64, "base64");
  },
};
