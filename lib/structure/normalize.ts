import {
  UNITS,
  guessFoodAisle,
  type Aisle,
  type MealType,
  type Method,
  type Unit,
} from "@/lib/domain";

// Turning whatever came back into something the app can store. Pure, so the
// awkward cases are covered by tests rather than discovered in the kitchen.

export interface DraftIngredient {
  /** Set when the name matched an ingredient the household already uses. */
  ingredientId: string | null;
  name: string;
  qty: number;
  unit: Unit;
  aisle: Aisle;
}

export interface NormalizedDraft {
  name: string;
  type: MealType;
  method: Method;
  baseServings: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: DraftIngredient[];
  steps: string[];
  guesses: string[];
}

export interface KnownIngredient {
  id: string;
  name: string;
}

const FOOD_AISLES: Aisle[] = ["Produce", "Meat & fish", "Dairy & eggs", "Bakery", "Pantry"];

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function quantity(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  // Three decimals is what the column holds.
  return Math.round(n * 1000) / 1000;
}

/**
 * Validates and tidies a structured draft. Unknown units become count,
 * unknown aisles become Pantry, and a quantity that is not a positive
 * number becomes 1, so a partly wrong answer still saves rather than
 * throwing the whole import away.
 *
 * Ingredient names are matched case-insensitively against what the
 * household already cooks with, which is what keeps the shopping list
 * merging and the pantry lists working.
 */
export function normalizeDraft(raw: unknown, known: KnownIngredient[]): NormalizedDraft {
  const o = (raw ?? {}) as Record<string, unknown>;
  const perServing = (o.perServing ?? {}) as Record<string, unknown>;
  const byName = new Map(known.map((i) => [i.name.trim().toLowerCase(), i]));

  const seen = new Set<string>();
  const ingredients: DraftIngredient[] = (Array.isArray(o.ingredients) ? o.ingredients : [])
    .map((entry): DraftIngredient | null => {
      const x = (entry ?? {}) as Record<string, unknown>;
      const name = String(x.name ?? "").trim().slice(0, 60);
      if (!name) return null;
      const match = byName.get(name.toLowerCase());
      const unit = (UNITS as readonly string[]).includes(String(x.unit)) ? (x.unit as Unit) : "count";
      const aisle = FOOD_AISLES.includes(x.aisle as Aisle) ? (x.aisle as Aisle) : "Pantry";
      return {
        ingredientId: match?.id ?? null,
        name: match?.name ?? name,
        qty: quantity(x.qty),
        unit,
        // An ingredient the household already has keeps the aisle it is
        // filed under, rather than being re-guessed every import.
        aisle: match ? aisle : (aisle === "Pantry" ? guessFoodAisle(name) : aisle),
      };
    })
    .filter((x): x is DraftIngredient => {
      if (!x) return false;
      // The same ingredient twice in one unit would break the primary key.
      const key = `${(x.ingredientId ?? x.name).toLowerCase()}|${x.unit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);

  const type = (["b", "l", "d", "s"] as const).includes(o.type as MealType)
    ? (o.type as MealType)
    : "d";
  const method = (["oven", "stove", "nocook"] as const).includes(o.method as Method)
    ? (o.method as Method)
    : "stove";

  return {
    name: String(o.name ?? "").trim().slice(0, 80) || "New recipe",
    type,
    method,
    baseServings: Math.max(1, positiveInt(o.servings, 4)),
    cal: positiveInt(perServing.cal, 0),
    protein: positiveInt(perServing.protein, 0),
    carbs: positiveInt(perServing.carbs, 0),
    fat: positiveInt(perServing.fat, 0),
    ingredients,
    steps: (Array.isArray(o.steps) ? o.steps : [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .slice(0, 12),
    guesses: (Array.isArray(o.notes) ? o.notes : [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .slice(0, 8),
  };
}

/** A draft with no ingredients is a failed read, not a recipe. */
export function draftIsUsable(draft: NormalizedDraft): boolean {
  return draft.ingredients.length > 0;
}
