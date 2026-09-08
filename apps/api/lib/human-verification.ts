import { DomainError } from "@booking/booking";
import { getIntegrationMode } from "@booking/validation";
import { z } from "zod";

const responseSchema=z.object({success:z.boolean(),action:z.string().optional(),hostname:z.string().optional(),"error-codes":z.array(z.string()).optional()});

export async function verifyHuman(token:string|undefined,request:Request,expectedAction:string){
  const mode=getIntegrationMode();
  if(mode.turnstileMode==="disabled"){
    if(mode.appMode!=="demo")throw new DomainError("HUMAN_VERIFICATION_REQUIRED","Turnstile can only be disabled in demo mode.",503);
    return {verified:false as const,bypassed:true as const,mode:"demo-disabled" as const};
  }
  const localBypass=process.env.NODE_ENV!=="production"&&process.env.TURNSTILE_LOCAL_BYPASS==="true";
  if(localBypass)return {verified:false as const,bypassed:true as const};
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret)throw new DomainError("HUMAN_VERIFICATION_REQUIRED","Human verification is not configured.",503);
  if(!token)throw new DomainError("HUMAN_VERIFICATION_REQUIRED","Please complete human verification.",400);
  const form=new FormData();form.set("secret",secret);form.set("response",token);
  const remoteIp=request.headers.get("cf-connecting-ip");if(remoteIp)form.set("remoteip",remoteIp);
  const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form,cache:"no-store"});
  if(!response.ok)throw new DomainError("HUMAN_VERIFICATION_FAILED","Human verification could not be completed.",502);
  const result=responseSchema.parse(await response.json());if(!result.success||result.action!==expectedAction)throw new DomainError("HUMAN_VERIFICATION_FAILED","Human verification failed. Please try again.",400);
  return {verified:true as const,bypassed:false as const};
}
