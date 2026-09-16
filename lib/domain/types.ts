// Domain types, shaped like the database rows in PRD section 10.
// Nothing in lib/domain imports React or Supabase.

export type MealType = "b" | "l" | "d" | "s";
export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export type Method = "oven" | "stove" | "nocook";
export type Rating = "keeper" | "good" | "work";
export type PantryStatus = "none" | "staple" | "usual";
export type SourceKind = "photo" | "notes" | "link" | "manual" | "seed";

export const UNITS = [
  "count",
  "lb",
  "oz",
  "cup",
  "tbsp",
  "tsp",
  "can",
  "clove",
  "bunch",
  "pint",
  "head",
  "scoop",
] as const;
export type Unit = (typeof UNITS)[number];

export const AISLES = [
  "Produce",
  "Meat & fish",
  "Dairy & eggs",
  "Bakery",
  "Pantry",
  "Household",
  "Other",
] as const;
export type Aisle = (typeof AISLES)[number];
export const FOOD_AISLES: Aisle[] = ["Produce", "Meat & fish", "Dairy & eggs", "Bakery", "Pantry"];

export interface Member {
  id: string;
  name: string;
  initial: string;
  /** Order used when portions are assigned to people: Shiva 0, Doreen 1. */
  sortOrder: number;
}

export interface Ingredient {
  id: string;
  name: string;
  defaultAisle: Aisle;
  pantryStatus: PantryStatus;
}

export interface VersionIngredient {
  ingredientId: string;
  qty: number;
  unit: Unit;
  sortOrder: number;
}

export interface RecipeVersion {
  id: string;
  recipeId: string;
  versionNo: number;
  baseServings: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  steps: string[];
  note: string;
  changes: string[];
  createdAt: string;
  ingredients: VersionIngredient[];
}

export interface Recipe {
  id: string;
  type: MealType;
  name: string;
  method: Method;
  rating: Rating;
  sourceKind: SourceKind;
  sourceRef: string;
  openGuesses: string[];
  currentVersionId: string;
}

export interface Slot {
  day: Day;
  meal: MealType;
  memberId: string;
  eating: boolean;
}

export interface Pick {
  id: string;
  meal: MealType;
  recipeId: string;
  /** Pinned when the pick is created. Later tweaks do not change a planned week. */
  versionId: string;
  portions: number;
  sortOrder: number;
}

export interface PantryCheck {
  ingredientId: string;
  have: boolean;
}

export interface Extra {
  id: string;
  name: string;
  aisle: Aisle;
}

export interface Week {
  id: string;
  /** ISO date of the Monday. */
  startDate: string;
  snacksEnabled: boolean;
  slots: Slot[];
  picks: Pick[];
  pantryChecks: PantryCheck[];
  extras: Extra[];
  /** Crossed-off list items by item key. */
  listChecks: Record<string, boolean>;
  /** Batches marked done by pick id. */
  prepDone: Record<string, boolean>;
}

export interface MacroThresholds {
  /** Percent of calories from protein at or above which the week is protein-heavy. */
  protein: number;
  carbs: number;
  fat: number;
}

export interface Settings {
  snacksDefault: boolean;
  freezeDays: Day[];
  /** Day name for the prep day, for labels only. */
  prepDay: "Saturday" | "Sunday";
  macroThresholds: MacroThresholds;
}

/** Everything a screen needs besides the week itself. */
export interface Context {
  members: Member[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  versions: RecipeVersion[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  snacksDefault: true,
  freezeDays: ["Thu", "Fri"],
  prepDay: "Sunday",
  macroThresholds: { protein: 35, carbs: 45, fat: 35 },
};
