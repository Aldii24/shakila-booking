import { listAccommodationTypes } from "@booking/booking"; import { failure,ok } from "@/lib/http";
export async function GET(){try{return ok(await listAccommodationTypes());}catch(e){return failure(e);}}
