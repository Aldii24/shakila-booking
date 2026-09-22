import type {
  AdminReportPeriod,
  AdminReportPeriodKey,
  AdminReportQuery,
} from "@booking/contracts";

export const REPORT_TIMEZONE = "Asia/Jakarta";

function partsForBusinessDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return { year: Number(get("year")), month: Number(get("month")), day: Number(get("day")) };
}

export function formatDateOnly(value: Date): string {
  const date = partsForBusinessDate(value);
  return `${date.year.toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid report date.");
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year!, month! - 1, day!));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month! - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error("Invalid report date.");
  }
  return parsed;
}

export function addBusinessDays(value: string, amount: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: REPORT_TIMEZONE,
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function periodLabel(startDate: string, endDate: string): string {
  const start = formatDisplayDate(startDate);
  const end = formatDisplayDate(endDate);
  return startDate === endDate ? start : `${start} - ${end}`;
}

export function currentBusinessDate(now = new Date()): string {
  return formatDateOnly(now);
}

export function resolveReportPeriod(
  query: Pick<AdminReportQuery, "period" | "dateFrom" | "dateTo">,
  now = new Date(),
): AdminReportPeriod {
  const key: AdminReportPeriodKey = query.period;
  if (key === "custom") {
    if (!query.dateFrom || !query.dateTo) throw new Error("Custom report dates are required.");
    parseDateOnly(query.dateFrom);
    parseDateOnly(query.dateTo);
    if (query.dateFrom > query.dateTo) throw new Error("Report end date must not precede start date.");
    return {
      key,
      startDate: query.dateFrom,
      endDate: query.dateTo,
      label: periodLabel(query.dateFrom, query.dateTo),
    };
  }

  const today = currentBusinessDate(now);
  if (key === "today") return { key, startDate: today, endDate: today, label: periodLabel(today, today) };

  const todayDate = parseDateOnly(today);
  if (key === "this_week") {
    const weekday = todayDate.getUTCDay();
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
    const startDate = addBusinessDays(today, mondayOffset);
    const endDate = addBusinessDays(startDate, 6);
    return { key, startDate, endDate, label: periodLabel(startDate, endDate) };
  }

  const start = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + 1, 0));
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  return { key, startDate, endDate, label: periodLabel(startDate, endDate) };
}
