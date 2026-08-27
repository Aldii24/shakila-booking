import {createHmac,timingSafeEqual} from "node:crypto";
import {getIntegrationMode} from "@booking/validation";

export const DEMO_ADMIN_COOKIE="booking_demo_admin";
export type DemoAdminSession={email:string;name:string;role:"OWNER";expiresAt:number};
const encode=(value:string)=>Buffer.from(value).toString("base64url");
const secret=()=>{const value=process.env.BOOKING_ACCESS_TOKEN_SECRET;if(!value)throw new Error("BOOKING_ACCESS_TOKEN_SECRET is required.");return value};
const sign=(payload:string)=>createHmac("sha256",secret()).update(payload).digest("base64url");

export function demoAdminCredentials(){
  if(getIntegrationMode().appMode!=="demo")throw new Error("Demo admin authentication requires APP_MODE=demo.");
  return {email:(process.env.DEMO_ADMIN_EMAIL?.trim()||"admin@shakilagroup.demo").toLowerCase(),password:process.env.DEMO_ADMIN_PASSWORD||"demo12345"};
}
export function verifyDemoAdminCredentials(email:string,password:string){
  const expected=demoAdminCredentials(),emailBytes=Buffer.from(email.trim().toLowerCase()),expectedEmail=Buffer.from(expected.email),passwordBytes=Buffer.from(password),expectedPassword=Buffer.from(expected.password);
  return emailBytes.length===expectedEmail.length&&passwordBytes.length===expectedPassword.length&&timingSafeEqual(emailBytes,expectedEmail)&&timingSafeEqual(passwordBytes,expectedPassword);
}
export function createDemoAdminSession(email:string,ttlSeconds=8*60*60){
  const session:DemoAdminSession={email:email.trim().toLowerCase(),name:"Demo Administrator",role:"OWNER",expiresAt:Math.floor(Date.now()/1000)+ttlSeconds};
  const payload=encode(JSON.stringify(session));return `${payload}.${sign(payload)}`;
}
export function verifyDemoAdminSession(token:string|undefined|null):DemoAdminSession|null{
  if(!token||getIntegrationMode().appMode!=="demo")return null;const [payload,signature]=token.split(".");if(!payload||!signature)return null;const actual=Buffer.from(signature),expected=Buffer.from(sign(payload));if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
  try{const value=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")) as DemoAdminSession;if(value.role!=="OWNER"||value.expiresAt<=Math.floor(Date.now()/1000))return null;return value}catch{return null}
}
