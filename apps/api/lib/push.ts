import webpush, { type PushSubscription } from "web-push";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import {
  adminPushSubscriptions,
  getDb,
  type BookingDatabase,
} from "@booking/database";

export type AdminPushSubscriptionInput = {
  adminEmail: string;
  endpoint: string;
  p256dhKey: string;
  authKey: string;
  expirationTime?: number | null;
  userAgent?: string | null;
};

export type AdminPushStatus = {
  configured: boolean;
  active: boolean;
  subscriptionCount: number;
  publicKey: string | null;
};

export type AdminPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

function vapidConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject) return null;
  return { publicKey, privateKey, subject };
}

function configureVapid() {
  const config = vapidConfig();
  if (!config) return null;
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return config;
}

function expirationDate(expirationTime: number | null | undefined) {
  if (!expirationTime || !Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
    return null;
  }
  return new Date(expirationTime);
}

function subscriptionJson(row: {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}): PushSubscription {
  return {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: { p256dh: row.p256dhKey, auth: row.authKey },
  };
}

export function shouldRemoveInvalidSubscription(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    ((error as { statusCode?: unknown }).statusCode === 404 ||
      (error as { statusCode?: unknown }).statusCode === 410)
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown push delivery error";
}

export function bookingCreatedPushPayload(input: {
  bookingCode: string;
  productName: string;
  adminOrigin?: string;
}): AdminPushPayload {
  return {
    title: "Booking Baru",
    body: input.productName,
    url: `${input.adminOrigin ?? "https://admin.shakilagrup.com"}/bookings/${encodeURIComponent(input.bookingCode)}`,
    tag: `booking-created-${input.bookingCode}`,
  };
}

export function paymentProofPushPayload(input: {
  bookingCode: string;
  adminOrigin?: string;
}): AdminPushPayload {
  return {
    title: "Bukti Pembayaran Baru",
    body: `Booking ${input.bookingCode}`,
    url: `${input.adminOrigin ?? "https://admin.shakilagrup.com"}/payments`,
    tag: `payment-proof-${input.bookingCode}`,
  };
}

export async function getAdminPushStatus(
  adminEmail: string,
  currentEndpoint?: string | null,
  database: BookingDatabase = getDb(),
): Promise<AdminPushStatus> {
  const config = vapidConfig();
  await database
    .delete(adminPushSubscriptions)
    .where(
      and(
        eq(adminPushSubscriptions.adminEmail, adminEmail),
        lt(adminPushSubscriptions.expirationAt, new Date()),
      ),
    );
  const rows = await database
    .select({ id: adminPushSubscriptions.id, endpoint: adminPushSubscriptions.endpoint })
    .from(adminPushSubscriptions)
    .where(eq(adminPushSubscriptions.adminEmail, adminEmail));
  return {
    configured: Boolean(config),
    active: Boolean(
      currentEndpoint && rows.some((row) => row.endpoint === currentEndpoint),
    ),
    subscriptionCount: rows.length,
    publicKey: config?.publicKey ?? null,
  };
}

export async function saveAdminPushSubscription(
  input: AdminPushSubscriptionInput,
  database: BookingDatabase = getDb(),
) {
  if (!vapidConfig()) {
    throw new Error("Web Push VAPID is not configured.");
  }
  const expirationAt = expirationDate(input.expirationTime);
  await database
    .insert(adminPushSubscriptions)
    .values({
      adminEmail: input.adminEmail,
      endpoint: input.endpoint,
      p256dhKey: input.p256dhKey,
      authKey: input.authKey,
      expirationAt,
      userAgent: input.userAgent ?? null,
      lastSuccessAt: null,
      lastFailureAt: null,
      failureCount: 0,
    })
    .onConflictDoUpdate({
      target: adminPushSubscriptions.endpoint,
      set: {
        adminEmail: input.adminEmail,
        p256dhKey: input.p256dhKey,
        authKey: input.authKey,
        expirationAt,
        userAgent: input.userAgent ?? null,
        lastFailureAt: null,
        failureCount: 0,
        updatedAt: new Date(),
      },
    });
  return getAdminPushStatus(input.adminEmail, input.endpoint, database);
}

export async function removeAdminPushSubscription(
  adminEmail: string,
  endpoint: string,
  database: BookingDatabase = getDb(),
) {
  await database
    .delete(adminPushSubscriptions)
    .where(
      and(
        eq(adminPushSubscriptions.adminEmail, adminEmail),
        eq(adminPushSubscriptions.endpoint, endpoint),
      ),
    );
  return getAdminPushStatus(adminEmail, endpoint, database);
}

async function findBookingNotification(
  bookingId: string,
  database: BookingDatabase,
) {
  const result = await database.execute(sql<{
    bookingCode: string;
    productName: string;
  }>`
    select b.booking_code as "bookingCode",
      coalesce(g.product_name_snapshot, j.package_name_snapshot, bd.product_name_snapshot) as "productName"
    from bookings b
    left join glamping_booking_details g on g.booking_id = b.id
    left join jeep_booking_details j on j.booking_id = b.id
    left join bundle_booking_details bd on bd.booking_id = b.id
    where b.id = ${bookingId}::uuid
    limit 1
  `) as unknown as { bookingCode: string; productName: string }[];
  return result[0] ?? null;
}

async function findProofNotification(
  bookingCode: string,
  database: BookingDatabase,
) {
  const result = await database.execute(sql<{ bookingCode: string }>`
    select booking_code as "bookingCode"
    from bookings
    where booking_code = ${bookingCode}
    limit 1
  `) as unknown as { bookingCode: string }[];
  return result[0] ?? null;
}

async function deliverToAdminDevices(
  payload: AdminPushPayload,
  database: BookingDatabase,
) {
  const config = configureVapid();
  if (!config) return { attempted: 0, delivered: 0, removed: 0 };

  const subscriptions = await database
    .select({
      id: adminPushSubscriptions.id,
      endpoint: adminPushSubscriptions.endpoint,
      p256dhKey: adminPushSubscriptions.p256dhKey,
      authKey: adminPushSubscriptions.authKey,
    })
    .from(adminPushSubscriptions)
    .where(
      or(
        isNull(adminPushSubscriptions.expirationAt),
        gt(adminPushSubscriptions.expirationAt, new Date()),
      ),
    );
  const body = JSON.stringify(payload);
  let delivered = 0;
  let removed = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscriptionJson(subscription), body, {
          TTL: 60 * 60,
          urgency: "high",
        });
        delivered += 1;
        await database
          .update(adminPushSubscriptions)
          .set({ lastSuccessAt: new Date(), lastFailureAt: null, failureCount: 0, updatedAt: new Date() })
          .where(eq(adminPushSubscriptions.id, subscription.id));
      } catch (error) {
        if (shouldRemoveInvalidSubscription(error)) {
          removed += 1;
          await database
            .delete(adminPushSubscriptions)
            .where(eq(adminPushSubscriptions.id, subscription.id));
          return;
        }
        await database
          .update(adminPushSubscriptions)
          .set({
            lastFailureAt: new Date(),
            failureCount: sql`${adminPushSubscriptions.failureCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(adminPushSubscriptions.id, subscription.id));
        console.warn("Admin Web Push delivery failed", errorMessage(error));
      }
    }),
  );
  return { attempted: subscriptions.length, delivered, removed };
}

/**
 * Push delivery is a non-critical side effect. These functions intentionally
 * absorb configuration, database, and provider failures so booking/payment
 * state is never rolled back because a phone is offline or a subscription is
 * no longer valid.
 */
export async function notifyAdminBookingCreated(bookingId: string) {
  try {
    const database = getDb();
    const booking = await findBookingNotification(bookingId, database);
    if (!booking) return { attempted: 0, delivered: 0, removed: 0 };
    return await deliverToAdminDevices(bookingCreatedPushPayload(booking), database);
  } catch (error) {
    console.warn("Admin booking Web Push notification skipped", errorMessage(error));
    return { attempted: 0, delivered: 0, removed: 0 };
  }
}

export async function notifyAdminPaymentProofSubmitted(bookingCode: string) {
  try {
    const database = getDb();
    const booking = await findProofNotification(bookingCode, database);
    if (!booking) return { attempted: 0, delivered: 0, removed: 0 };
    return await deliverToAdminDevices(paymentProofPushPayload(booking), database);
  } catch (error) {
    console.warn("Admin payment-proof Web Push notification skipped", errorMessage(error));
    return { attempted: 0, delivered: 0, removed: 0 };
  }
}
