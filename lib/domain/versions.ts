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
  ingredients: DraftIngredient[];
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Lines such as "Garlic 3 cloves to 6 cloves", "Added Zucchini", "Removed Feta"
 * and "Macros now 470 cal, P 42 C 52 F 10". Ingredients match on id and unit.
 * A draft ingredient at zero quantity counts as removed.
 */
export function diffVersions(prev: VersionDraft, next: VersionDraft): string[] {
  const changes: string[] = [];
  const key = (x: DraftIngredient) => `${x.ingredientId}|${x.unit}`;
  const before = new Map(prev.ingredients.map((x) => [key(x), x]));
  const seen = new Set<string>();
  for (const x of next.ingredients) {
    seen.add(key(x));
    const o = before.get(key(x));
    if (!o) {
      if (x.qty > 0) changes.push(`Added ${x.name}`);
    } else if (o.qty !== x.qty) {
      changes.push(x.qty === 0 ? `Removed ${x.name}` : `${x.name} ${formatQty(o.qty, o.unit)} to ${formatQty(x.qty, x.unit)}`);
    }
  }
  for (const o of prev.ingredients) {
    if (!seen.has(key(o))) changes.push(`Removed ${o.name}`);
  }
  const macroChanged = (["cal", "protein", "carbs", "fat"] as const).some((k) => (prev[k] || 0) !== (next[k] || 0));
  if (macroChanged) changes.push(`Macros now ${next.cal} cal, P ${next.protein} C ${next.carbs} F ${next.fat}`);
  return changes;
}
