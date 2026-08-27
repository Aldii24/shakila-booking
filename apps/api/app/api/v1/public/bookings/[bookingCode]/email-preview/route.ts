import { verifyBookingAccessToken } from "@booking/booking";
import { renderBookingConfirmationPreview } from "@booking/email";
import { accessSecret, bearer, failure } from "@/lib/http";

export async function GET(request:Request,{params}:{params:Promise<{bookingCode:string}>}) {
  try {
    const {bookingCode}=await params;
    const access=verifyBookingAccessToken(bearer(request),accessSecret(),bookingCode,"booking:read");
    return new Response(await renderBookingConfirmationPreview(access.bookingId),{headers:{"content-type":"text/html; charset=utf-8","cache-control":"private, no-store"}});
  } catch(error) { return failure(error); }
}
