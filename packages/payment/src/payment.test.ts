import {describe,expect,it} from "vitest";
import {buildPakasirCheckoutUrl,evaluateVerifiedPayment} from "./index";
const completed={amount:255000,orderId:"GLP-TEST-1",project:"demo",status:"completed",paymentMethod:"qris",completedAt:"2026-08-25T10:00:00+07:00"};
describe("Pakasir payment authority",()=>{
  it("accepts exact completed verification",()=>expect(evaluateVerifiedPayment({amount:255000,orderId:"GLP-TEST-1",project:"demo"},completed)).toEqual({accepted:true}));
  it("rejects amount mismatch",()=>expect(evaluateVerifiedPayment({amount:300000,orderId:"GLP-TEST-1",project:"demo"},completed)).toMatchObject({accepted:false,reason:"PAYMENT_AMOUNT_OR_REFERENCE_MISMATCH"}));
  it("rejects a pending status",()=>expect(evaluateVerifiedPayment({amount:255000,orderId:"GLP-TEST-1",project:"demo"},{...completed,status:"pending"})).toMatchObject({accepted:false,reason:"PAYMENT_NOT_COMPLETED"}));
  it("does not expose API key in checkout URL",()=>{const url=new URL(buildPakasirCheckoutUrl({project:"demo",amount:255000,orderId:"GLP-TEST-1"}));expect(url.pathname).toBe("/pay/demo/255000");expect(url.searchParams.get("order_id")).toBe("GLP-TEST-1");expect(url.toString()).not.toContain("api_key");});
});
