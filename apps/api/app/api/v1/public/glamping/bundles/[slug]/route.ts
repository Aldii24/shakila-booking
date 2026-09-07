import { bundlePackage } from "@booking/booking";
import { failure, ok } from "@/lib/http";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try { return ok(await bundlePackage((await context.params).slug)); } catch (error) { return failure(error); }
}
