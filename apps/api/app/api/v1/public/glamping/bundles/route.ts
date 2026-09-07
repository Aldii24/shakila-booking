import { calculateBundleAvailability, listBundlePackages } from "@booking/booking";
import { bundleAvailabilityRequestSchema } from "@booking/contracts";
import { body, failure, ok } from "@/lib/http";

export async function GET() {
  try { return ok(await listBundlePackages()); } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const input = bundleAvailabilityRequestSchema.parse(await body(request));
    const availableQuantity = await calculateBundleAvailability(input);
    return ok({ ...input, availableQuantity });
  } catch (error) { return failure(error); }
}
