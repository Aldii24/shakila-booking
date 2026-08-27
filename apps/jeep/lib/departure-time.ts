export function departurePeriod(value: string): string {
  const hour = Number(value.slice(0, 2));
  if (hour < 4) return "dini hari";
  if (hour < 11) return "pagi";
  if (hour < 15) return "siang";
  if (hour < 18) return "sore";
  return "malam";
}

export function formatDepartureTime(value: string): string {
  return `${value.slice(0, 5).replace(":", ".")} WIB · ${departurePeriod(value)}`;
}

export function isDeparturePassed(
  tourDate: string,
  departureTime: string,
  now = new Date(),
): boolean {
  if (!tourDate) return false;
  const date = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  if (tourDate !== date) return tourDate < date;
  const current = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return departureTime.slice(0, 8).padEnd(8, ":00") <= current;
}
