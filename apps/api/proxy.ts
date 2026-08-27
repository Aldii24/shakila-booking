import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const origin=request.headers.get("origin");
  const allowed=new Set((process.env.ALLOWED_ORIGINS??"http://localhost:3000,http://localhost:3001,http://localhost:3002").split(",").map(value=>value.trim()));
  if(request.method==="OPTIONS") {
    if(!origin || !allowed.has(origin)) return new NextResponse(null,{status:403});
    return new NextResponse(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Credentials":"true","Access-Control-Allow-Methods":"GET,POST,PATCH,DELETE,OPTIONS","Access-Control-Allow-Headers":"Authorization,Content-Type,Idempotency-Key","Access-Control-Max-Age":"86400","Vary":"Origin"}});
  }
  const response=NextResponse.next();
  if(origin && allowed.has(origin)){response.headers.set("Access-Control-Allow-Origin",origin);response.headers.set("Access-Control-Allow-Credentials","true");response.headers.set("Vary","Origin");}
  return response;
}
export const config={matcher:"/api/:path*"};
