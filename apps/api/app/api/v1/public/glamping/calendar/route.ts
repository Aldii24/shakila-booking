import { getPublicGlampingCalendar } from "@booking/booking";
import { availabilityCalendarRequestSchema } from "@booking/contracts";
import { body, failure, ok } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const input = availabilityCalendarRequestSchema.parse(await body(request));
    return ok(await getPublicGlampingCalendar(input));
  } catch (error) {
    return failure(error);
  }
}
