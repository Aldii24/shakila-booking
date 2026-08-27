import { verifyBookingAccessToken } from "@booking/booking";
import { getDirectInvoicePdf, getInvoiceDownload } from "@booking/invoice";
import { getIntegrationMode } from "@booking/validation";
import { accessSecret, bearer, failure, ok } from "@/lib/http";

export async function GET(request:Request,{params}:{params:Promise<{bookingCode:string}>}) {
  try {
    const {bookingCode}=await params;
    const access=verifyBookingAccessToken(bearer(request),accessSecret(),bookingCode,"invoice:read");
    const mode=getIntegrationMode();
    if(mode.invoiceStorage!=="direct") return ok(await getInvoiceDownload(access.bookingId));
    const invoice=await getDirectInvoicePdf(access.bookingId);
    if(invoice.status!=="GENERATED") return ok(invoice);
    const url=new URL(request.url);
    if(url.searchParams.get("download")!=="1") return ok({status:invoice.status,invoiceNumber:invoice.invoiceNumber,fileName:invoice.fileName,direct:true});
    return new Response(Buffer.from(invoice.bytes),{headers:{"content-type":"application/pdf","content-disposition":`attachment; filename="${invoice.fileName.replaceAll('"','')}"`,"cache-control":"private, no-store"}});
  } catch(error) { return failure(error); }
}
