export type StayInventory = {
  productSlug: string;
  availableUnits: number;
};

export type StayDay<TInventory extends StayInventory> = {
  date: string;
  inventory: TInventory[];
};

export type StayAvailability = {
  slug: string;
  availableQuantity: number;
};

const dayMs = 86_400_000;
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export function addStayDays(date: string, days: number) {
  return dateKey(new Date(new Date(`${date}T00:00:00Z`).getTime() + days * dayMs));
}

export function selectedStayRange(checkInDate: string, checkOutDate: string) {
  if (!checkInDate) return null;
  return {
    checkInDate,
    checkOutDate: checkOutDate || addStayDays(checkInDate, 1),
  };
}

export function inventoryForSelectedStay<TInventory extends StayInventory>(
  days: StayDay<TInventory>[],
  checkInDate: string,
  checkOutDate: string,
  authoritativeAvailability: StayAvailability[] | null,
) {
  const reference = days.find((day) => day.date === checkInDate) ?? days[0];
  if (!reference) return [];

  const highlightedDays = days.filter(
    (day) => day.date >= checkInDate && (!checkOutDate || day.date <= checkOutDate),
  );
  // Keep the panel consistent with every date highlighted by the calendar. The
  // booking API remains authoritative and still validates [check-in, check-out).
  const displayedMinimumBySlug = new Map<string, number>();
  for (const day of highlightedDays) {
    for (const item of day.inventory) {
      const current = displayedMinimumBySlug.get(item.productSlug);
      displayedMinimumBySlug.set(
        item.productSlug,
        current === undefined ? item.availableUnits : Math.min(current, item.availableUnits),
      );
    }
  }

  if (!authoritativeAvailability) {
    return reference.inventory.map((item) => ({
      ...item,
      availableUnits: displayedMinimumBySlug.get(item.productSlug) ?? item.availableUnits,
    }));
  }

  const availableBySlug = new Map(
    authoritativeAvailability.map((item) => [item.slug, item.availableQuantity]),
  );
  return reference.inventory.map((item) => {
    const authoritativeUnits = availableBySlug.get(item.productSlug) ?? 0;
    const displayedMinimum = displayedMinimumBySlug.get(item.productSlug);
    return {
      ...item,
      availableUnits:
        displayedMinimum === undefined
          ? authoritativeUnits
          : Math.min(authoritativeUnits, displayedMinimum),
    };
  });
}
