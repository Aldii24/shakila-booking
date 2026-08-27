import { listJeepPackages } from "@booking/booking"; import { failure,ok } from "@/lib/http";
export async function GET(){try{return ok(await listJeepPackages());}catch(e){return failure(e);}}
