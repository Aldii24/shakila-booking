import { handlePakasirWebhook } from "@booking/payment";
import { body,failure,ok } from "@/lib/http";
import {inngest} from "@/lib/inngest";

export async function POST(request:Request){
  try{const result=await handlePakasirWebhook(await body(request));if(result.status==="CONFIRMED"&&process.env.INNGEST_EVENT_KEY)await inngest.send({name:"booking/payment.confirmed",data:{bookingId:result.bookingId}});return ok(result);}catch(error){return failure(error);}
}
