import { verifyBookingAccessToken } from "@booking/booking";
import { submitManualPaymentProof } from "@booking/payment";
import { z } from "zod";
import { accessSecret, bearer, body, failure, ok } from "@/lib/http";
import { verifyHuman } from "@/lib/human-verification";
import { notifyAdminPaymentProofSubmitted } from "@/lib/push";

const proofSchema = z.object({
  claimedAmount: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png"]),
  fileSize: z.number().int().min(1).max(5 * 1024 * 1024),
  fileDataBase64: z.string().min(1).max(7_100_000),
  turnstileToken: z.string().min(1).optional(),
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
    const input = proofSchema.parse(await body(request));
    await verifyHuman(input.turnstileToken, request, "payment_proof");
    const result = await submitManualPaymentProof(bookingCode, access.bookingId, input);
    await notifyAdminPaymentProofSubmitted(bookingCode);
    return ok(result, 201);
  } catch (error) {
    return failure(error);
  }
}
