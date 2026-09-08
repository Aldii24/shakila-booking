import { NextResponse } from "next/server";
import { productionReadiness } from "@/lib/production-readiness";

export const dynamic = "force-dynamic";

export function GET() {
  const readiness = productionReadiness();
  return NextResponse.json(
    { status: readiness.ready ? "ok" : "not_ready", mode: readiness.mode, missing: readiness.missing },
    { status: readiness.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
