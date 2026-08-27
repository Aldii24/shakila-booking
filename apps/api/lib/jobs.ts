import {expireDueBookings} from "@booking/booking";
import {prepareConfirmationEmail} from "@booking/email";
import {prepareInvoice} from "@booking/invoice";
import {inngest} from "./inngest";

export const expireBookingHolds=inngest.createFunction({id:"expire-booking-holds",retries:2},{cron:"*/1 * * * *"},async()=>expireDueBookings());
export const completeConfirmedBooking=inngest.createFunction({id:"complete-confirmed-booking",retries:4},{event:"booking/payment.confirmed"},async({event,step})=>{const bookingId=String(event.data.bookingId);let invoiceReady=false;try{await step.run("generate-invoice",()=>prepareInvoice(bookingId));invoiceReady=true;}catch{/* Booking stays confirmed; storage side effect will retry. */}await step.run("send-confirmation-email",()=>prepareConfirmationEmail(bookingId));return {bookingId,invoiceReady};});
export const bookingFunctions=[expireBookingHolds,completeConfirmedBooking];
