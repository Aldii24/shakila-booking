import { jeepPackage } from "@booking/booking"; import { failure,ok } from "@/lib/http";
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){try{return ok(await jeepPackage((await params).slug));}catch(e){return failure(e);}}
