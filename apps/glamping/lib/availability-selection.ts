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

  const effectiveCheckOut = checkOutDate || addStayDays(checkInDate, 1);
  const highlightedDays = days.filter(
    (day) => day.date >= checkInDate && day.date < effectiveCheckOut,
  );

  // The calendar is a display range and may contain dates outside the selected
  // stay. The selected-range API is authoritative whenever it is available.
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
    return {
      ...item,
      availableUnits: availableBySlug.get(item.productSlug) ?? 0,
    };
  });
}
