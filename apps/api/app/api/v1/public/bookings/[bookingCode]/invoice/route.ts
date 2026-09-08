import { verifyBookingAccessToken } from "@booking/booking";
import { getInvoiceDownload, getSecureInvoicePdf } from "@booking/invoice";
import { accessSecret, bearer, failure, ok } from "@/lib/http";

export async function GET(request:Request,{params}:{params:Promise<{bookingCode:string}>}) {
  try {
    const {bookingCode}=await params;
    const access=verifyBookingAccessToken(bearer(request),accessSecret(),bookingCode,"invoice:read");
    const url=new URL(request.url);
    if(url.searchParams.get("download")!=="1") return ok(await getInvoiceDownload(access.bookingId));
    const invoice=await getSecureInvoicePdf(access.bookingId);
    if(invoice.status!=="GENERATED") return ok(invoice);
    return new Response(Buffer.from(invoice.bytes),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="${invoice.fileName.replaceAll('"','')}"`,"cache-control":"private, no-store"}});
  } catch(error) { return failure(error); }
}
