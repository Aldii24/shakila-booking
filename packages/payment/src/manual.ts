import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { DomainError } from "@booking/booking";
import { getDb, type BookingDatabase } from "@booking/database";

const rows = <T>(value: unknown) => value as T[];
export const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;
const proofMimeTypes = new Set(["image/jpeg", "image/png"]);

export type PaymentProofInput = {
  claimedAmount: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileDataBase64: string;
};

export function evaluateManualPayment(input: {
  currentVerified: number;
  verifiedAmount: number;
  requiredDp: number;
  totalAmount: number;
}) {
  const newVerified = input.currentVerified + input.verifiedAmount;
  return {
    newVerified,
    confirmed: newVerified >= input.requiredDp,
    paymentStatus: newVerified >= input.totalAmount ? "PAID" as const : "PARTIALLY_PAID" as const,
    remainingAmount: Math.max(input.totalAmount - newVerified, 0),
  };
}

function validateProof(input: PaymentProofInput) {
  if (!Number.isSafeInteger(input.claimedAmount) || input.claimedAmount <= 0)
    throw new DomainError("VALIDATION_ERROR", "Claimed amount must be a positive rupiah value.", 400);
  if (!proofMimeTypes.has(input.mimeType))
    throw new DomainError("INVALID_PAYMENT_PROOF", "Proof must be a JPG, JPEG, or PNG image.", 400);
  if (!Number.isSafeInteger(input.fileSize) || input.fileSize < 1 || input.fileSize > MAX_PAYMENT_PROOF_BYTES)
    throw new DomainError("INVALID_PAYMENT_PROOF", "Proof image must not exceed 5 MB.", 400);
  const decoded = Buffer.from(input.fileDataBase64, "base64");
  if (decoded.length !== input.fileSize)
    throw new DomainError("INVALID_PAYMENT_PROOF", "Proof image data is invalid.", 400);
  const signatureValid = input.mimeType === "image/png"
    ? decoded.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
    : decoded.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"));
  if (!signatureValid)
    throw new DomainError("INVALID_PAYMENT_PROOF", "Proof file signature does not match its image type.", 400);
}

export async function submitManualPaymentProof(
  bookingCode: string,
  bookingId: string,
  input: PaymentProofInput,
  database: BookingDatabase = getDb(),
) {
  validateProof(input);
  return database.transaction(async (tx) => {
    const found = rows<{ paymentId: string; status: string; expiresAt: string | null }>(await tx.execute(sql`
      select p.id as "paymentId",b.status,b.expires_at::text as "expiresAt"
      from bookings b join payments p on p.booking_id=b.id
      where b.id=${bookingId}::uuid and b.booking_code=${bookingCode}
      for update of b,p
    `))[0];
    if (!found) throw new DomainError("BOOKING_NOT_FOUND", "Booking was not found.", 404);
    if (found.status !== "WAITING_PAYMENT" || !found.expiresAt || Date.parse(found.expiresAt) <= Date.now())
      throw new DomainError("BOOKING_EXPIRED", "Booking payment deadline has expired.", 409);

    const orderId = `TRANSFER-${bookingCode}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const attempt = rows<{ id: string }>(await tx.execute(sql`
      insert into payment_attempts(payment_id,booking_id,provider,provider_order_id,requested_amount,status,payment_method)
      values(${found.paymentId}::uuid,${bookingId}::uuid,'MANUAL_TRANSFER',${orderId},${input.claimedAmount},'PENDING','BANK_TRANSFER')
      returning id
    `))[0]!;
    const proof = rows<{ id: string; createdAt: string }>(await tx.execute(sql`
      insert into payment_proofs(payment_id,booking_id,payment_attempt_id,claimed_amount,file_name,mime_type,file_size,file_data_base64)
      values(${found.paymentId}::uuid,${bookingId}::uuid,${attempt.id}::uuid,${input.claimedAmount},${input.fileName},${input.mimeType},${input.fileSize},${input.fileDataBase64})
      returning id,created_at::text as "createdAt"
    `))[0]!;
    await tx.execute(sql`update payments set status='PENDING',updated_at=now() where id=${found.paymentId}::uuid`);
    await tx.execute(sql`update bookings set payment_status='PENDING',updated_at=now() where id=${bookingId}::uuid`);
    await tx.execute(sql`
      insert into booking_events(booking_id,event_type,actor_type,title,metadata)
      values(${bookingId}::uuid,'PAYMENT_PROOF_SUBMITTED','CUSTOMER','Bukti transfer diunggah',${JSON.stringify({ proofId: proof.id, claimedAmount: input.claimedAmount })}::jsonb)
    `);
    return { id: proof.id, status: "PENDING" as const, claimedAmount: input.claimedAmount, createdAt: proof.createdAt };
  });
}

export async function listPaymentProofs(
  status: "PENDING" | "APPROVED" | "REJECTED" | null = null,
  database: BookingDatabase = getDb(),
) {
  return rows<Record<string, unknown>>(await database.execute(sql`
    select pr.id,pr.status,pr.claimed_amount::int as "claimedAmount",pr.verified_amount::int as "verifiedAmount",
      pr.file_name as "fileName",pr.mime_type as "mimeType",pr.file_size::int as "fileSize",
      pr.rejection_reason as "rejectionReason",pr.verified_at as "verifiedAt",pr.verified_by_admin_email as "verifiedByAdminEmail",
      pr.created_at as "createdAt",b.booking_code as "bookingCode",b.customer_name as "customerName",b.customer_email as "customerEmail",
      b.customer_whatsapp as "customerWhatsapp",b.expires_at as "expiresAt",b.total_amount::int as "totalAmount",
      b.required_dp_amount::int as "requiredDpAmount",bu.slug as business,bu.name as "businessName"
    from payment_proofs pr join bookings b on b.id=pr.booking_id join businesses bu on bu.id=b.business_id
    where (${status}::payment_proof_status is null or pr.status=${status}::payment_proof_status)
    order by case when pr.status='PENDING' then 0 else 1 end,pr.created_at desc
  `));
}

export async function getPaymentProofFile(id: string, database: BookingDatabase = getDb()) {
  const proof = rows<{ fileName: string; mimeType: string; fileDataBase64: string }>(await database.execute(sql`
    select file_name as "fileName",mime_type as "mimeType",file_data_base64 as "fileDataBase64"
    from payment_proofs where id=${id}::uuid limit 1
  `))[0];
  if (!proof) throw new DomainError("PAYMENT_PROOF_NOT_FOUND", "Payment proof was not found.", 404);
  return proof;
}

export async function approveManualPaymentProof(
  id: string,
  verifiedAmount: number,
  adminEmail: string,
  database: BookingDatabase = getDb(),
) {
  if (!Number.isSafeInteger(verifiedAmount) || verifiedAmount <= 0)
    throw new DomainError("VALIDATION_ERROR", "Verified amount must be positive.", 400);
  return database.transaction(async (tx) => {
    const proof = rows<{ proofStatus: string; claimedAmount: number; attemptId: string; paymentId: string; bookingId: string; bookingCode: string; bookingStatus: string; expiresAt: string | null; currentVerified: number; requiredDp: number; totalAmount: number }>(await tx.execute(sql`
      select pr.status as "proofStatus",pr.claimed_amount::int as "claimedAmount",pr.payment_attempt_id as "attemptId",pr.payment_id as "paymentId",
        pr.booking_id as "bookingId",b.booking_code as "bookingCode",b.status as "bookingStatus",b.expires_at::text as "expiresAt",
        b.verified_paid_amount::int as "currentVerified",b.required_dp_amount::int as "requiredDp",b.total_amount::int as "totalAmount"
      from payment_proofs pr join bookings b on b.id=pr.booking_id where pr.id=${id}::uuid for update of pr,b
    `))[0];
    if (!proof) throw new DomainError("PAYMENT_PROOF_NOT_FOUND", "Payment proof was not found.", 404);
    if (proof.proofStatus === "APPROVED") return { proofId: id, bookingId: proof.bookingId, bookingCode: proof.bookingCode, status: proof.bookingStatus, duplicate: true };
    if (proof.proofStatus === "REJECTED") throw new DomainError("PAYMENT_PROOF_ALREADY_REVIEWED", "Rejected proof cannot be approved.", 409);
    if (proof.bookingStatus !== "WAITING_PAYMENT" || !proof.expiresAt || Date.parse(proof.expiresAt) <= Date.now())
      throw new DomainError("BOOKING_EXPIRED", "Expired booking proof cannot be approved automatically.", 409);
    if (verifiedAmount > proof.claimedAmount)
      throw new DomainError("PAYMENT_AMOUNT_MISMATCH", "Verified amount cannot exceed the amount claimed on this proof.", 409);
    if (proof.currentVerified + verifiedAmount > proof.totalAmount)
      throw new DomainError("PAYMENT_AMOUNT_MISMATCH", "Verified payments cannot exceed the booking total.", 409);

    const decision = evaluateManualPayment({ currentVerified: proof.currentVerified, verifiedAmount, requiredDp: proof.requiredDp, totalAmount: proof.totalAmount });
    await tx.execute(sql`update payment_proofs set status='APPROVED',verified_amount=${verifiedAmount},verified_at=now(),verified_by_admin_email=${adminEmail},updated_at=now() where id=${id}::uuid`);
    await tx.execute(sql`update payment_attempts set status='SUCCESS',verified_amount=${verifiedAmount},provider_transaction_id=${`ADMIN-${id}`},provider_paid_at=now(),verified_at=now(),updated_at=now() where id=${proof.attemptId}::uuid`);
    await tx.execute(sql`update payments set verified_amount=${decision.newVerified},status=${decision.paymentStatus},verified_at=now(),updated_at=now() where id=${proof.paymentId}::uuid`);
    await tx.execute(sql`
      update bookings set verified_paid_amount=${decision.newVerified},remaining_amount=${decision.remainingAmount},payment_status=${decision.paymentStatus},
        status=case when ${decision.confirmed} then 'CONFIRMED' else status end,
        confirmed_at=case when ${decision.confirmed} then coalesce(confirmed_at,now()) else confirmed_at end,updated_at=now()
      where id=${proof.bookingId}::uuid
    `);
    if (decision.confirmed) {
      await tx.execute(sql`update accommodation_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${proof.bookingId}::uuid and state='HELD'`);
      await tx.execute(sql`update jeep_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${proof.bookingId}::uuid and state='HELD'`);
      await tx.execute(sql`insert into invoices(booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at) values(${proof.bookingId}::uuid,${`INV-${proof.bookingCode}`},'PENDING',${proof.totalAmount},${decision.newVerified},${decision.remainingAmount},now()) on conflict(booking_id) do nothing`);
    }
    await tx.execute(sql`insert into booking_events(booking_id,event_type,actor_type,title,description,metadata) values(${proof.bookingId}::uuid,'PAYMENT_PROOF_APPROVED','ADMIN','Bukti transfer disetujui',${`Diverifikasi oleh ${adminEmail}`},${JSON.stringify({ proofId: id, verifiedAmount })}::jsonb)`);
    if (decision.confirmed) await tx.execute(sql`insert into booking_events(booking_id,event_type,actor_type,title,metadata) values(${proof.bookingId}::uuid,'BOOKING_CONFIRMED','SYSTEM','Booking dikonfirmasi setelah DP terverifikasi',${JSON.stringify({ source: "MANUAL_TRANSFER" })}::jsonb)`);
    return { proofId: id, bookingId: proof.bookingId, bookingCode: proof.bookingCode, status: decision.confirmed ? "CONFIRMED" : "WAITING_PAYMENT", paymentStatus: decision.paymentStatus, duplicate: false };
  });
}

export async function rejectManualPaymentProof(
  id: string,
  reason: string,
  adminEmail: string,
  database: BookingDatabase = getDb(),
) {
  return database.transaction(async (tx) => {
    const proof = rows<{ status: string; attemptId: string; paymentId: string; bookingId: string; bookingCode: string; verifiedPaid: number }>(await tx.execute(sql`
      select pr.status,pr.payment_attempt_id as "attemptId",pr.payment_id as "paymentId",pr.booking_id as "bookingId",b.booking_code as "bookingCode",b.verified_paid_amount::int as "verifiedPaid"
      from payment_proofs pr join bookings b on b.id=pr.booking_id where pr.id=${id}::uuid for update of pr,b
    `))[0];
    if (!proof) throw new DomainError("PAYMENT_PROOF_NOT_FOUND", "Payment proof was not found.", 404);
    if (proof.status === "REJECTED") return { proofId: id, bookingId: proof.bookingId, bookingCode: proof.bookingCode, status: "REJECTED" as const, duplicate: true };
    if (proof.status === "APPROVED") throw new DomainError("PAYMENT_PROOF_ALREADY_REVIEWED", "Approved proof cannot be rejected.", 409);
    await tx.execute(sql`update payment_proofs set status='REJECTED',rejection_reason=${reason},verified_at=now(),verified_by_admin_email=${adminEmail},updated_at=now() where id=${id}::uuid`);
    await tx.execute(sql`update payment_attempts set status='FAILED',raw_reference=${reason},failed_at=now(),verified_at=now(),updated_at=now() where id=${proof.attemptId}::uuid`);
    const paymentStatus = proof.verifiedPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";
    await tx.execute(sql`update payments set status=${paymentStatus},updated_at=now() where id=${proof.paymentId}::uuid`);
    await tx.execute(sql`update bookings set payment_status=${paymentStatus},updated_at=now() where id=${proof.bookingId}::uuid`);
    await tx.execute(sql`insert into booking_events(booking_id,event_type,actor_type,title,description,metadata) values(${proof.bookingId}::uuid,'PAYMENT_PROOF_REJECTED','ADMIN','Bukti transfer ditolak',${reason},${JSON.stringify({ proofId: id, adminEmail })}::jsonb)`);
    return { proofId: id, bookingId: proof.bookingId, bookingCode: proof.bookingCode, status: "REJECTED" as const, duplicate: false };
  });
}
