import type { Day, MealType, Member, Week } from "./types";

// Counting meals, PRD 7.1.

export const DAYS: readonly Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const DAY_FULL: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

export const MEALS: readonly { k: MealType; n: string; plural: string }[] = [
  { k: "b", n: "Breakfast", plural: "breakfasts" },
  { k: "l", n: "Lunch", plural: "lunches" },
  { k: "d", n: "Dinner", plural: "dinners" },
  { k: "s", n: "Snack", plural: "snacks" },
];

export function mealName(k: MealType): string {
  return MEALS.find((m) => m.k === k)?.n ?? "Dinner";
}

export function mealPlural(k: MealType): string {
  return MEALS.find((m) => m.k === k)?.plural ?? "dinners";
}

/** Meal types in play for a week. Snacks drop out when the switch is off. */
export function activeMeals(week: Pick<Week, "snacksEnabled">): MealType[] {
  return MEALS.filter((m) => m.k !== "s" || week.snacksEnabled).map((m) => m.k);
}

export function slotKey(day: Day, meal: MealType, memberId: string): string {
  return `${day}-${meal}-${memberId}`;
}

export function isEating(week: Week, day: Day, meal: MealType, memberId: string): boolean {
  const s = week.slots.find((x) => x.day === day && x.meal === meal && x.memberId === memberId);
  return s ? s.eating : false;
}

export function sortedMembers(members: Member[]): Member[] {
  return [...members].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * The slots switched on for one meal type, ordered Monday first and then by
 * member order. This order is what assigns portions to days (PRD 7.2).
 */
export function neededSlots(
  week: Week,
  meal: MealType,
  members: Member[],
): { day: Day; memberId: string }[] {
  const out: { day: Day; memberId: string }[] = [];
  const ms = sortedMembers(members);
  for (const day of DAYS) {
    for (const m of ms) {
      if (isEating(week, day, meal, m.id)) out.push({ day, memberId: m.id });
    }
  }
  return out;
}

export function mealTotal(week: Week, meal: MealType, members: Member[]): number {
  return neededSlots(week, meal, members).length;
}

/** Per-meal totals for the active meal types, plus the overall total. */
export function totals(week: Week, members: Member[]): { byMeal: Record<MealType, number>; all: number } {
  const byMeal = { b: 0, l: 0, d: 0, s: 0 } as Record<MealType, number>;
  let all = 0;
  for (const meal of activeMeals(week)) {
    byMeal[meal] = mealTotal(week, meal, members);
    all += byMeal[meal];
  }
  return { byMeal, all };
}

/** Returns a new slot list with one slot toggled. */
export function toggleSlot(week: Week, day: Day, meal: MealType, memberId: string): Week["slots"] {
  return week.slots.map((s) =>
    s.day === day && s.meal === meal && s.memberId === memberId ? { ...s, eating: !s.eating } : s,
  );
}

/** Clears the whole day, or restores it if it is already fully cleared (EAT-3). */
export function toggleDay(week: Week, day: Day): Week["slots"] {
  const meals = activeMeals(week);
  const anyOn = week.slots.some((s) => s.day === day && meals.includes(s.meal) && s.eating);
  return week.slots.map((s) => (s.day === day && meals.includes(s.meal) ? { ...s, eating: !anyOn } : s));
}

/** All 40 slots switched on, for a brand-new week. */
export function freshSlots(members: Member[]): Week["slots"] {
  const out: Week["slots"] = [];
  for (const day of DAYS) {
    for (const m of MEALS) {
      for (const p of sortedMembers(members)) {
        out.push({ day, meal: m.k, memberId: p.id, eating: true });
      }
    }
  }
  return out;
}
