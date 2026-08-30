import { NextResponse } from "next/server";
import {
  createDemoAdminSession,
  DEMO_ADMIN_COOKIE,
  verifyDemoAdminCredentials,
  verifyDemoAdminSession,
} from "@booking/auth";
import {
  adminBookingCommand,
  createAdminAccommodationUnit,
  createAdminDepartureSlot,
  createAdminJeepUnit,
  createAdminProduct,
  createInventoryBlock,
  createAdminManualBooking,
  getAdminBooking,
  getAdminCalendar,
  getAdminCatalog,
  getAdminCustomer,
  getAdminInventory,
  getAdminOverview,
  listAdminBookings,
  listAdminAccommodationUnits,
  listAdminCustomers,
  listAdminDepartureSlots,
  listAdminJeepUnits,
  listAdminPayments,
  removeInventoryBlock,
  updateAdminProduct,
  updateAdminAccommodationUnit,
  updateAdminDepartureSlot,
  updateAdminJeepUnit,
  updateAdminSettings,
  DomainError,
} from "@booking/booking";
import {
  approveManualPaymentProof,
  getPaymentProofFile,
  listPaymentProofs,
  rejectManualPaymentProof,
} from "@booking/payment";
import { renderBookingConfirmationPreview } from "@booking/email";
import { getDirectInvoicePdf, getInvoiceDownload } from "@booking/invoice";
import { getIntegrationMode } from "@booking/validation";
import { z } from "zod";
import { body, failure, ok } from "./http";
import { completePostPayment } from "./post-payment";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});
const checkoutSchema = z.object({
  confirmEarlyCheckout: z.boolean().optional().default(false),
});
const blockSchema = z.object({
  resourceType: z.enum(["ACCOMMODATION_UNIT", "JEEP_UNIT"]),
  unitId: z.uuid(),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional(),
  departureSlotId: z.uuid().optional(),
  reason: z.string().min(2).max(80),
  note: z.string().max(2000).optional(),
});
const productSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  description: z.string().min(2).max(5000).optional(),
  price: z.number().int().positive().optional(),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});
const createProductSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(5000),
  price: z.number().int().positive(),
  capacity: z.number().int().positive(),
  isActive: z.boolean().optional(),
});
const unitSchema = z.object({
  code: z.string().trim().min(2).max(40).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
});
const createUnitSchema = unitSchema.extend({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
});
const slotSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  departureTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  isActive: z.boolean().optional(),
});
const createSlotSchema = slotSchema.extend({
  name: z.string().trim().min(2).max(80),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
const settingsSchema = z.object({
  dpPercentage: z.number().int().min(50).max(100).optional(),
  bookingHoldMinutes: z.number().int().min(1).max(720).optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().min(8).max(32).optional(),
});
const cancellationSchema = z.object({
  reason: z.string().trim().min(2).max(80),
  note: z.string().trim().max(2000).optional(),
});
const manualCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().optional().or(z.literal("")),
  whatsapp: z.string().trim().min(8).max(32),
});
const manualBaseSchema = z.object({
  source: z.enum(["ADMIN_MANUAL", "WALK_IN"]),
  customer: manualCustomerSchema,
  specialRequest: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  paymentState: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID"]),
  amountReceived: z.number().int().nonnegative(),
});
const manualBookingSchema = z.discriminatedUnion("business", [
  manualBaseSchema.extend({
    business: z.literal("glamping"),
    reservation: z.object({
      productSlug: z.string().min(1), checkInDate: z.iso.date(), checkOutDate: z.iso.date(),
      quantity: z.number().int().positive(), guestCount: z.number().int().positive(),
    }),
  }),
  manualBaseSchema.extend({
    business: z.literal("jeep"),
    reservation: z.object({
      packageSlug: z.string().min(1), tourDate: z.iso.date(), departureSlotId: z.uuid(),
      quantity: z.number().int().positive(), guestCount: z.number().int().positive(),
    }),
  }),
]);
const approveProofSchema = z.object({ verifiedAmount: z.number().int().positive() });
const rejectProofSchema = z.object({ reason: z.string().trim().min(3).max(500) });

function cookie(request: Request, name: string) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
function requireAdmin(request: Request) {
  const session = verifyDemoAdminSession(cookie(request, DEMO_ADMIN_COOKIE));
  if (!session)
    throw new DomainError("UNAUTHORIZED", "Admin session is required.", 401);
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const allowed = new Set(
      (
        process.env.ALLOWED_ORIGINS ??
        "http://localhost:3000,http://localhost:3001,http://localhost:3002"
      )
        .split(",")
        .map((v) => v.trim()),
    );
    if (origin && !allowed.has(origin))
      throw new DomainError(
        "UNAUTHORIZED",
        "Request origin is not allowed.",
        403,
      );
  }
  return session;
}
const query = (request: Request) => new URL(request.url).searchParams;

export async function handleAdmin(
  request: Request,
  segments: string[],
): Promise<Response> {
  try {
    if (segments.join("/") === "auth/login" && request.method === "POST") {
      const input = loginSchema.parse(await body(request));
      if (!verifyDemoAdminCredentials(input.email, input.password))
        throw new DomainError(
          "UNAUTHORIZED",
          "Email atau password demo tidak valid.",
          401,
        );
      const response = ok({
        email: input.email.trim().toLowerCase(),
        name: "Demo Administrator",
        role: "OWNER",
        mode: "DEMO",
      });
      response.cookies.set(
        DEMO_ADMIN_COOKIE,
        createDemoAdminSession(input.email),
        {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 8 * 60 * 60,
        },
      );
      return response;
    }
    if (segments.join("/") === "auth/logout" && request.method === "POST") {
      requireAdmin(request);
      const response = ok({ signedOut: true });
      response.cookies.set(DEMO_ADMIN_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
      return response;
    }
    const session = requireAdmin(request),
      path = segments.join("/"),
      params = query(request);
    if (path === "me" && request.method === "GET")
      return ok({
        ...session,
        mode: "DEMO",
        integrations: getIntegrationMode(),
      });
    if (
      (path === "dashboard/overview" || path === "dashboard/chart") &&
      request.method === "GET"
    )
      return ok(await getAdminOverview(params.get("business")));
    if (path === "bookings" && request.method === "GET")
      return ok(
        await listAdminBookings({
          business: params.get("business") || null,
          status: params.get("status") || null,
          paymentStatus: params.get("paymentStatus") || null,
          dateFrom: params.get("dateFrom") || null,
          dateTo: params.get("dateTo") || null,
          search: params.get("search") || null,
          page: Number(params.get("page") ?? 1),
          pageSize: Number(params.get("pageSize") ?? 20),
        }),
      );
    if (path === "bookings/manual" && request.method === "POST")
      return ok(await createAdminManualBooking(manualBookingSchema.parse(await body(request)), session.email), 201);
    if (path === "payment-proofs" && request.method === "GET") {
      const status = params.get("status");
      return ok(await listPaymentProofs(status === "PENDING" || status === "APPROVED" || status === "REJECTED" ? status : null));
    }
    if (path === "payments" && request.method === "GET")
      return ok(
        await listAdminPayments({
          business: params.get("business"),
          status: params.get("status"),
          method: params.get("method"),
          provider: params.get("provider"),
          dateFrom: params.get("dateFrom"),
          dateTo: params.get("dateTo"),
          search: params.get("search"),
          requiresReview: params.has("requiresReview")
            ? params.get("requiresReview") === "true"
            : null,
          sort: [
            "createdAt",
            "paidAt",
            "requestedAmount",
            "verifiedAmount",
          ].includes(params.get("sort") ?? "")
            ? (params.get("sort") as
                "createdAt" | "paidAt" | "requestedAmount" | "verifiedAmount")
            : "createdAt",
          order: params.get("order") === "asc" ? "asc" : "desc",
          page: Number(params.get("page") ?? 1),
          pageSize: Number(params.get("pageSize") ?? 20),
        }),
      );
    if (path === "customers" && request.method === "GET")
      return ok(await listAdminCustomers(params.get("search")));
    if (path === "calendar" && request.method === "GET")
      return ok(
        await getAdminCalendar(
          params.get("startDate") ?? new Date().toISOString().slice(0, 10),
          params.get("endDate") ??
            new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          params.get("business"),
        ),
      );
    if (
      (path === "inventory/units" || path === "inventory/blocks") &&
      request.method === "GET"
    ) {
      const inventory = await getAdminInventory();
      return ok(path.endsWith("units") ? inventory.units : inventory.blocks);
    }
    if (path === "inventory/blocks" && request.method === "POST")
      return ok(
        await createInventoryBlock(blockSchema.parse(await body(request))),
        201,
      );
    if (path === "catalog" && request.method === "GET")
      return ok(await getAdminCatalog());
    if (path === "settings" && request.method === "GET")
      return ok((await getAdminCatalog()).settings);

    const blockMatch = path.match(/^inventory\/blocks\/([0-9a-f-]+)$/);
    if (blockMatch && request.method === "DELETE")
      return ok(await removeInventoryBlock(blockMatch[1]!));
    const customerMatch = path.match(/^customers\/([0-9a-f-]+)$/);
    if (customerMatch && request.method === "GET")
      return ok(await getAdminCustomer(customerMatch[1]!));
    const productMatch = path.match(
      /^(glamping\/types|jeep\/packages)\/([0-9a-f-]+)$/,
    );
    if (productMatch && request.method === "PATCH")
      return ok(
        await updateAdminProduct(
          productMatch[1] === "glamping/types" ? "glamping" : "jeep",
          productMatch[2]!,
          productSchema.parse(await body(request)),
        ),
      );
    if (
      (path === "glamping/types" || path === "jeep/packages") &&
      request.method === "POST"
    )
      return ok(
        await createAdminProduct(
          path === "glamping/types" ? "glamping" : "jeep",
          createProductSchema.parse(await body(request)),
        ),
        201,
      );
    if (
      (path === "glamping/types" || path === "jeep/packages") &&
      request.method === "GET"
    ) {
      const catalog = await getAdminCatalog();
      return ok(path.startsWith("glamping") ? catalog.glamping : catalog.jeep);
    }
    const accommodationUnitsMatch = path.match(
      /^glamping\/types\/([0-9a-f-]+)\/units$/,
    );
    if (accommodationUnitsMatch && request.method === "GET")
      return ok(await listAdminAccommodationUnits(accommodationUnitsMatch[1]!));
    if (accommodationUnitsMatch && request.method === "POST")
      return ok(
        await createAdminAccommodationUnit(
          accommodationUnitsMatch[1]!,
          createUnitSchema.parse(await body(request)),
        ),
        201,
      );
    const accommodationUnitMatch = path.match(
      /^glamping\/units\/([0-9a-f-]+)$/,
    );
    if (accommodationUnitMatch && request.method === "PATCH")
      return ok(
        await updateAdminAccommodationUnit(
          accommodationUnitMatch[1]!,
          unitSchema.parse(await body(request)),
        ),
      );
    if (path === "jeep/units" && request.method === "GET")
      return ok(await listAdminJeepUnits());
    if (path === "jeep/units" && request.method === "POST")
      return ok(
        await createAdminJeepUnit(createUnitSchema.parse(await body(request))),
        201,
      );
    const jeepUnitMatch = path.match(/^jeep\/units\/([0-9a-f-]+)$/);
    if (jeepUnitMatch && request.method === "PATCH")
      return ok(
        await updateAdminJeepUnit(
          jeepUnitMatch[1]!,
          unitSchema.parse(await body(request)),
        ),
      );
    const slotListMatch = path.match(/^jeep\/packages\/([0-9a-f-]+)\/slots$/);
    if (slotListMatch && request.method === "GET")
      return ok(await listAdminDepartureSlots(slotListMatch[1]!));
    if (slotListMatch && request.method === "POST")
      return ok(
        await createAdminDepartureSlot(
          slotListMatch[1]!,
          createSlotSchema.parse(await body(request)),
        ),
        201,
      );
    const slotMatch = path.match(/^jeep\/slots\/([0-9a-f-]+)$/);
    if (slotMatch && request.method === "PATCH")
      return ok(
        await updateAdminDepartureSlot(
          slotMatch[1]!,
          slotSchema.parse(await body(request)),
        ),
      );
    const settingMatch = path.match(/^settings\/([0-9a-f-]+)$/);
    if (settingMatch && request.method === "PATCH")
      return ok(
        await updateAdminSettings(
          settingMatch[1]!,
          settingsSchema.parse(await body(request)),
        ),
      );

    const proofFileMatch = path.match(/^payment-proofs\/([0-9a-f-]+)\/file$/);
    if (proofFileMatch && request.method === "GET") {
      const proof = await getPaymentProofFile(proofFileMatch[1]!);
      return new Response(Buffer.from(proof.fileDataBase64, "base64"), {
        headers: { "content-type": proof.mimeType, "content-disposition": `inline; filename="${proof.fileName.replaceAll('"', '')}"`, "cache-control": "private, no-store" },
      });
    }
    const proofActionMatch = path.match(/^payment-proofs\/([0-9a-f-]+)\/(approve|reject)$/);
    if (proofActionMatch && request.method === "POST") {
      if (proofActionMatch[2] === "approve") {
        const result = await approveManualPaymentProof(proofActionMatch[1]!, approveProofSchema.parse(await body(request)).verifiedAmount, session.email);
        const postPayment = result.status === "CONFIRMED" && !result.duplicate ? await completePostPayment(result.bookingId) : null;
        return ok({ ...result, postPayment });
      }
      return ok(await rejectManualPaymentProof(proofActionMatch[1]!, rejectProofSchema.parse(await body(request)).reason, session.email));
    }

    const bookingMatch = path.match(/^bookings\/([^/]+)(?:\/(.*))?$/);
    if (bookingMatch) {
      const bookingCode = decodeURIComponent(bookingMatch[1]!),
        action = bookingMatch[2];
      if (!action && request.method === "GET")
        return ok(await getAdminBooking(bookingCode));
      if (action === "events" && request.method === "GET")
        return ok((await getAdminBooking(bookingCode)).events);
      if (
        ["check-in", "check-out", "cancel"].includes(action ?? "") &&
        request.method === "POST"
      ) {
        const details =
          action === "cancel"
            ? cancellationSchema.parse(await body(request))
            : action === "check-out"
              ? checkoutSchema.parse(await body(request))
              : {};
        return ok(
          await adminBookingCommand(
            bookingCode,
            action as "check-in" | "check-out" | "cancel",
            details,
          ),
        );
      }
      if (action === "email-preview" && request.method === "GET") {
        const booking = (await getAdminBooking(bookingCode)) as Record<
          string,
          unknown
        >;
        return new Response(
          await renderBookingConfirmationPreview(String(booking.id)),
          {
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "private, no-store",
            },
          },
        );
      }
      if (action === "invoice" && request.method === "GET") {
        const booking = (await getAdminBooking(bookingCode)) as Record<
          string,
          unknown
        >;
        if (getIntegrationMode().invoiceStorage !== "direct")
          return ok(await getInvoiceDownload(String(booking.id)));
        const invoice = await getDirectInvoicePdf(String(booking.id));
        if (invoice.status !== "GENERATED") return ok(invoice);
        return new Response(Buffer.from(invoice.bytes), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="${invoice.fileName.replaceAll('"', "")}"`,
            "cache-control": "private, no-store",
          },
        });
      }
    }
    return NextResponse.json(
      {
        data: null,
        error: { code: "NOT_FOUND", message: "Admin endpoint not found." },
        meta: null,
      },
      { status: 404 },
    );
  } catch (error) {
    return failure(error);
  }
}
