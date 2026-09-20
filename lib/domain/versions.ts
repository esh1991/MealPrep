import type { Unit } from "./types";
import { formatQty } from "./units";

// Generating the change list for a tweak (REC-6).

export interface DraftIngredient {
  ingredientId: string;
  name: string;
  qty: number;
  unit: Unit;
}

export interface VersionDraft {
  baseServings: number;
  ingredients: DraftIngredient[];
  steps: string[];
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const sameSteps = (a: string[], b: string[]) =>
  a.length === b.length && a.every((s, i) => s.trim() === b[i].trim());

/**
 * Lines such as "Garlic 3 cloves to 6 cloves", "Added Zucchini", "Removed
 * Feta", "Now makes 6 servings" and "Macros now 470 cal, P 42 C 52 F 10".
 *
 * Ingredients match on id and unit first. Failing that they match on id
 * alone, so changing an ingredient's unit reads as one change rather than a
 * removal and an addition. A draft ingredient at zero counts as removed.
 */
export function diffVersions(prev: VersionDraft, next: VersionDraft): string[] {
  const changes: string[] = [];

  if (prev.baseServings !== next.baseServings) {
    changes.push(`Now makes ${next.baseServings} servings instead of ${prev.baseServings}`);
  }

  const exact = new Map(prev.ingredients.map((x) => [`${x.ingredientId}|${x.unit}`, x]));
  const byId = new Map(prev.ingredients.map((x) => [x.ingredientId, x]));
  const matched = new Set<DraftIngredient>();

  for (const x of next.ingredients) {
    const before = exact.get(`${x.ingredientId}|${x.unit}`) ?? byId.get(x.ingredientId);
    if (!before) {
      if (x.qty > 0) changes.push(`Added ${x.name}`);
      continue;
    }
    matched.add(before);
    if (x.qty === 0) {
      changes.push(`Removed ${x.name}`);
    } else if (before.qty !== x.qty || before.unit !== x.unit) {
      changes.push(`${x.name} ${formatQty(before.qty, before.unit)} to ${formatQty(x.qty, x.unit)}`);
    }
  }

  for (const before of prev.ingredients) {
    if (!matched.has(before)) changes.push(`Removed ${before.name}`);
  }

  if (!sameSteps(prev.steps, next.steps)) {
    const had = prev.steps.length;
    const has = next.steps.length;
    changes.push(had === 0 ? "Wrote the steps" : has === 0 ? "Cleared the steps" : "Reworded the steps");
  }

  const macroChanged = (["cal", "protein", "carbs", "fat"] as const).some(
    (k) => (prev[k] || 0) !== (next[k] || 0),
  );
  if (macroChanged) {
    changes.push(`Macros now ${next.cal} cal, P ${next.protein} C ${next.carbs} F ${next.fat}`);
  }

  return changes;
}
