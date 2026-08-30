import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { CreateBookingRequest } from "@booking/contracts";
import { getDb, type BookingDatabase } from "@booking/database";
import { createBooking, quoteBooking } from "./creation";
import { DomainError } from "./errors";

const rows = <T>(value: unknown) => value as T[];

type ManualBookingBase = {
  source: "ADMIN_MANUAL" | "WALK_IN";
  customer: { fullName: string; email?: string | null; whatsapp: string };
  specialRequest?: string | null;
  notes?: string | null;
  paymentState: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  amountReceived: number;
};
export type AdminManualBookingInput = ManualBookingBase & (
  | { business: "glamping"; reservation: Extract<CreateBookingRequest, { business: "glamping" }>["reservation"] }
  | { business: "jeep"; reservation: Extract<CreateBookingRequest, { business: "jeep" }>["reservation"] }
);

export async function createAdminManualBooking(
  input: AdminManualBookingInput,
  adminEmail: string,
  database: BookingDatabase = getDb(),
) {
  if (!Number.isSafeInteger(input.amountReceived) || input.amountReceived < 0)
    throw new DomainError("VALIDATION_ERROR", "Amount received must be a non-negative rupiah value.", 400);
  if ((input.paymentState === "UNPAID") !== (input.amountReceived === 0))
    throw new DomainError("VALIDATION_ERROR", "Payment state must match the amount already received.", 400);
  const key = randomUUID();
  const email = input.customer.email?.trim() || `manual-${key}@shakila.invalid`;
  const request = {
    business: input.business,
    reservation: input.reservation,
    customer: { fullName: input.customer.fullName, email, whatsapp: input.customer.whatsapp },
    specialRequest: input.specialRequest ?? null,
  } as CreateBookingRequest;
  const quote = await quoteBooking(input.business === "glamping"
    ? { business: "glamping", productSlug: input.reservation.productSlug, checkInDate: input.reservation.checkInDate, checkOutDate: input.reservation.checkOutDate, quantity: input.reservation.quantity, guestCount: input.reservation.guestCount }
    : { business: "jeep", packageSlug: input.reservation.packageSlug, tourDate: input.reservation.tourDate, departureSlotId: input.reservation.departureSlotId, quantity: input.reservation.quantity, guestCount: input.reservation.guestCount }, database);
  if (input.amountReceived > quote.totalAmount)
    throw new DomainError("PAYMENT_AMOUNT_MISMATCH", "Amount received cannot exceed booking total.", 409);
  if (input.paymentState === "PAID" && input.amountReceived !== quote.totalAmount)
    throw new DomainError("VALIDATION_ERROR", "Paid manual bookings must record the full total.", 400);
  if (input.paymentState === "PARTIALLY_PAID" && input.amountReceived >= quote.totalAmount)
    throw new DomainError("VALIDATION_ERROR", "A partially paid booking must remain below the full total.", 400);
  const created = await createBooking(request, key, database);

  return database.transaction(async (tx) => {
    const booking = rows<{ paymentId: string; totalAmount: number; requiredDp: number }>(await tx.execute(sql`
      select p.id as "paymentId",b.total_amount::int as "totalAmount",b.required_dp_amount::int as "requiredDp"
      from bookings b join payments p on p.booking_id=b.id where b.id=${created.bookingId}::uuid for update of b,p
    `))[0]!;
    const paymentStatus = input.amountReceived === 0 ? "UNPAID" : input.amountReceived >= booking.totalAmount ? "PAID" : "PARTIALLY_PAID";
    const confirmed = input.amountReceived >= booking.requiredDp;
    await tx.execute(sql`
      update bookings set booking_source=${input.source},admin_notes=${input.notes ?? null},created_by_admin_email=${adminEmail},
        verified_paid_amount=${input.amountReceived},remaining_amount=greatest(total_amount-${input.amountReceived},0),payment_status=${paymentStatus},
        status=case when ${confirmed} then 'CONFIRMED'::booking_status else 'WAITING_PAYMENT'::booking_status end,
        confirmed_at=case when ${confirmed} then now() else null end,updated_at=now()
      where id=${created.bookingId}::uuid
    `);
    await tx.execute(sql`update payments set verified_amount=${input.amountReceived},status=${paymentStatus},verified_at=case when ${input.amountReceived > 0} then now() else null end,updated_at=now() where id=${booking.paymentId}::uuid`);
    if (input.amountReceived > 0) await tx.execute(sql`
      insert into payment_attempts(payment_id,booking_id,provider,provider_order_id,provider_transaction_id,requested_amount,verified_amount,status,payment_method,provider_paid_at,verified_at)
      values(${booking.paymentId}::uuid,${created.bookingId}::uuid,'ADMIN_MANUAL',${`MANUAL-${created.bookingCode}`},${`ADMIN-${key}`},${input.amountReceived},${input.amountReceived},'SUCCESS','ADMIN_RECORDED',now(),now())
    `);
    if (confirmed) {
      await tx.execute(sql`update accommodation_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${created.bookingId}::uuid and state='HELD'`);
      await tx.execute(sql`update jeep_unit_reservations set state='CONFIRMED',updated_at=now() where booking_id=${created.bookingId}::uuid and state='HELD'`);
      await tx.execute(sql`insert into invoices(booking_id,invoice_number,status,total_amount,paid_amount,remaining_amount,issued_at) values(${created.bookingId}::uuid,${`INV-${created.bookingCode}`},'PENDING',${booking.totalAmount},${input.amountReceived},${Math.max(booking.totalAmount-input.amountReceived,0)},now()) on conflict(booking_id) do nothing`);
    }
    await tx.execute(sql`
      insert into booking_events(booking_id,event_type,actor_type,title,description,metadata)
      values(${created.bookingId}::uuid,'MANUAL_BOOKING_CREATED','ADMIN','Booking manual dibuat',${input.notes ?? null},${JSON.stringify({ source: input.source, adminEmail, amountReceived: input.amountReceived })}::jsonb)
    `);
    if (confirmed) await tx.execute(sql`insert into booking_events(booking_id,event_type,actor_type,title,metadata) values(${created.bookingId}::uuid,'BOOKING_CONFIRMED','ADMIN','Booking manual dikonfirmasi',${JSON.stringify({ source: input.source })}::jsonb)`);
    return { ...created, status: confirmed ? "CONFIRMED" : "WAITING_PAYMENT", paymentStatus, source: input.source, amountReceived: input.amountReceived };
  });
}
