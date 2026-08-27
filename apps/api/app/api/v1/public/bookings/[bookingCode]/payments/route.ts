import { verifyBookingAccessToken } from "@booking/booking";
import {
  completeDemoPayment,
  failDemoPayment,
  initiatePayment,
} from "@booking/payment";
import { z } from "zod";
import { completePostPayment } from "@/lib/post-payment";
import { accessSecret, bearer, failure, ok } from "@/lib/http";

const demoActionSchema = z.object({
  action: z.enum(["complete", "fail"]),
  orderId: z.string().min(1).max(160),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingCode: string }> },
) {
  try {
    const { bookingCode } = await params;
    const access = verifyBookingAccessToken(
      bearer(request),
      accessSecret(),
      bookingCode,
      "payment:create",
    );
    const raw = await request.text();
    if (!raw)
      return ok(await initiatePayment(bookingCode, access.bookingId), 201);

    const input = demoActionSchema.parse(JSON.parse(raw));
    const payment =
      input.action === "complete"
        ? await completeDemoPayment(
            bookingCode,
            access.bookingId,
            input.orderId,
          )
        : await failDemoPayment(bookingCode, access.bookingId, input.orderId);
    const postPayment =
      input.action === "complete"
        ? await completePostPayment(access.bookingId)
        : null;
    return ok({ ...payment, postPayment });
  } catch (error) {
    return failure(error);
  }
}
