import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const GROUP_HOSTS = new Set(["shakilagrup.com", "www.shakilagrup.com"]);

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostname = (forwardedHost ?? request.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim()
    .split(":")[0]
    ?.toLowerCase();

  if (hostname && GROUP_HOSTS.has(hostname)) {
    return NextResponse.rewrite(new URL("/group", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
