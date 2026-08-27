import { quoteBooking } from "@booking/booking"; import { quoteRequestSchema } from "@booking/contracts"; import { body,failure,ok } from "@/lib/http";
export async function POST(request:Request){try{return ok(await quoteBooking(quoteRequestSchema.parse(await body(request))));}catch(e){return failure(e);}}
