import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest";
import {bookingFunctions} from "@/lib/jobs";
export const {GET,POST,PUT}=serve({client:inngest,functions:bookingFunctions});
