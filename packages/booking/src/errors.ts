export type DomainErrorCode =
  | "VALIDATION_ERROR" | "BUSINESS_NOT_FOUND" | "PRODUCT_NOT_FOUND" | "PRODUCT_NOT_ACTIVE"
  | "INVENTORY_NOT_AVAILABLE" | "INVENTORY_IN_USE" | "DUPLICATE_CODE" | "INVALID_DATE_RANGE" | "INVALID_GUEST_COUNT"
  | "INVALID_QUANTITY" | "INVALID_DEPARTURE_SLOT" | "DEPARTURE_SLOT_CLOSED" | "IDEMPOTENCY_CONFLICT"
  | "BOOKING_NOT_FOUND" | "BOOKING_STATE_CONFLICT" | "BOOKING_LOOKUP_FAILED"
  | "CHECK_IN_NOT_ALLOWED" | "CHECK_OUT_NOT_ALLOWED" | "CANCELLATION_NOT_ALLOWED"
  | "PAYMENT_NOT_CONFIGURED" | "PAYMENT_VERIFICATION_FAILED" | "PAYMENT_AMOUNT_MISMATCH"
  | "PAYMENT_ATTEMPT_NOT_FOUND" | "PAYMENT_ATTEMPT_NOT_ACTIVE" | "PAYMENT_THRESHOLD_NOT_MET"
  | "INVALID_PAYMENT_PROOF" | "PAYMENT_PROOF_NOT_FOUND" | "PAYMENT_PROOF_ALREADY_REVIEWED"
  | "BOOKING_EXPIRED"
  | "HUMAN_VERIFICATION_REQUIRED" | "HUMAN_VERIFICATION_FAILED"
  | "UNAUTHORIZED" | "INTERNAL_ERROR";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string, public readonly status = 400) {
    super(message);
    this.name = "DomainError";
  }
}

export function isInventoryConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const constraint = "constraint_name" in error ? String(error.constraint_name) : "";
  return code === "23P01" || (code === "23505" && constraint.includes("reservations"));
}

export function isIdempotencyConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  const constraint = "constraint_name" in error ? String(error.constraint_name) : "";
  return code === "23505" && constraint.includes("client_idempotency_key");
}
