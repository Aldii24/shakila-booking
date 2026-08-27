import { NextResponse } from "next/server";
import { errorEnvelope, successEnvelope } from "@booking/contracts";
import { DomainError } from "@booking/booking";
import { ZodError } from "zod";

export const ok=<T>(data:T,status=200)=>NextResponse.json(successEnvelope(data),{status});
export function failure(error:unknown) {
  if(error instanceof ZodError) return NextResponse.json({data:null,error:{code:"VALIDATION_ERROR",message:"Request validation failed.",fields:error.flatten().fieldErrors},meta:null},{status:400});
  if(error instanceof DomainError) return NextResponse.json(errorEnvelope(error.code,error.message),{status:error.status});
  console.error("Unhandled API error",error instanceof Error?{name:error.name,message:error.message}:"Unknown error");
  return NextResponse.json(errorEnvelope("INTERNAL_ERROR","An unexpected error occurred."),{status:500});
}
export async function body(request:Request){ return request.json().catch(()=>{throw new DomainError("VALIDATION_ERROR","Request body must be valid JSON.",400);}); }
export function accessSecret(){ const value=process.env.BOOKING_ACCESS_TOKEN_SECRET; if(!value) throw new Error("BOOKING_ACCESS_TOKEN_SECRET is required."); return value; }
export function bearer(request:Request){ const value=request.headers.get("authorization"); if(!value?.startsWith("Booking ")) throw new DomainError("UNAUTHORIZED","Booking access token is required.",401); return value.slice(8); }
