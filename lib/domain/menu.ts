import type { MealType, Member, Pick, Week } from "./types";
import { activeMeals, mealTotal } from "./slots";

// Menu rules, PRD 6.3.

export function picksFor(week: Week, meal: MealType): Pick[] {
  return week.picks.filter((p) => p.meal === meal).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function assignedPortions(week: Week, meal: MealType): number {
  return picksFor(week, meal).reduce((s, p) => s + p.portions, 0);
}

export interface Coverage {
  total: number;
  assigned: number;
  /** Positive when portions are still to cover, negative when there are extras. */
  diff: number;
}

export function coverage(week: Week, meal: MealType, members: Member[]): Coverage {
  const total = mealTotal(week, meal, members);
  const assigned = assignedPortions(week, meal);
  return { total, assigned, diff: total - assigned };
}

/** "All 9 covered", "2 still to cover" or "1 extra" (MENU-2). */
export function coverageLabel(c: Coverage): string {
  if (c.diff === 0) return `All ${c.total} covered`;
  if (c.diff > 0) return `${c.diff} still to cover`;
  return `${-c.diff} extra`;
}

/** Portions still uncovered across every active meal type. */
export function gapCount(week: Week, members: Member[]): number {
  return activeMeals(week).reduce((s, m) => s + Math.max(0, coverage(week, m, members).diff), 0);
}

/** Meal types that still have uncovered portions. */
export function gaps(week: Week, members: Member[]): { meal: MealType; missing: number }[] {
  return activeMeals(week)
    .map((meal) => ({ meal, missing: coverage(week, meal, members).diff }))
    .filter((g) => g.missing > 0);
}

/**
 * Distribute a meal's total across its picks as evenly as possible, earlier
 * picks getting the remainder (MENU-4). Picks that end at zero are dropped.
 */
export function splitEvenly(picks: Pick[], total: number): Pick[] {
  const sorted = [...picks].sort((a, b) => a.sortOrder - b.sortOrder);
  if (!sorted.length) return [];
  const base = Math.floor(total / sorted.length);
  let rem = total - base * sorted.length;
  return sorted
    .map((p) => {
      const portions = base + (rem > 0 ? 1 : 0);
      rem--;
      return { ...p, portions };
    })
    .filter((p) => p.portions > 0);
}

/**
 * Add a recipe to a meal (MENU-3). The new pick covers whatever is still
 * uncovered; if everything is covered already, portions are split evenly.
 * Returns the full new pick list for the week.
 */
export function withAddedPick(
  week: Week,
  members: Member[],
  pick: { id: string; meal: MealType; recipeId: string; versionId: string },
): Pick[] {
  const others = week.picks.filter((p) => p.meal !== pick.meal);
  const mine = picksFor(week, pick.meal);
  if (mine.some((p) => p.recipeId === pick.recipeId)) return week.picks;
  const c = coverage(week, pick.meal, members);
  const sortOrder = mine.length ? Math.max(...mine.map((p) => p.sortOrder)) + 1 : 0;
  const added: Pick = { ...pick, portions: Math.max(0, c.diff), sortOrder };
  const next = [...mine, added];
  return [...others, ...(c.diff > 0 ? next : splitEvenly(next, c.total))];
}

/** Step one pick's portions. Reaching zero removes it (MENU-5). */
export function withPortionDelta(picks: Pick[], pickId: string, delta: number): Pick[] {
  return picks
    .map((p) => (p.id === pickId ? { ...p, portions: p.portions + delta } : p))
    .filter((p) => p.portions > 0);
}

/** Replace one pick's recipe, keeping its portions (the macro swap tip). */
export function withSwappedPick(picks: Pick[], pickId: string, recipeId: string, versionId: string): Pick[] {
  return picks.map((p) => (p.id === pickId ? { ...p, recipeId, versionId } : p));
}
