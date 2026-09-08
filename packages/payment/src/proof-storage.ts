import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DomainError } from "@booking/booking";
import { getIntegrationMode } from "@booking/validation";

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
  remove?(input: StoredPaymentProof): Promise<void>;
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
  async remove() {},
};

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_PAYMENT_PROOFS_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket)
    throw new DomainError(
      "PAYMENT_PROOF_STORAGE_UNAVAILABLE",
      "Penyimpanan bukti pembayaran belum dikonfigurasi.",
      503,
    );
  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export const r2PaymentProofStorage: PaymentProofStorageAdapter = {
  async store(input) {
    const { bucket, client } = r2Config();
    const key = `payment-proofs/${input.bookingCode}/${randomUUID()}.${extension(input.mimeType)}`;
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(input.fileDataBase64, "base64"),
      ContentType: input.mimeType,
      CacheControl: "private, no-store",
    }));
    return { provider: "R2", key, inlineDataBase64: null };
  },
  async read(input) {
    if (input.provider === "DATABASE")
      return databasePaymentProofStorage.read(input);
    const { bucket, client } = r2Config();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: input.key }));
    if (!result.Body)
      throw new DomainError("PAYMENT_PROOF_STORAGE_UNAVAILABLE", "Bukti pembayaran belum dapat dibuka.", 503);
    return Buffer.from(await result.Body.transformToByteArray());
  },
  async remove(input) {
    if (input.provider !== "R2") return;
    const { bucket, client } = r2Config();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: input.key }));
  },
};

export function getPaymentProofStorage(): PaymentProofStorageAdapter {
  return getIntegrationMode().appMode === "production"
    ? r2PaymentProofStorage
    : databasePaymentProofStorage;
}
