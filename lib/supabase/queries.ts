import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import type { APP_SCHEMA } from "./env";
import type {
  Aisle,
  Context,
  Ingredient,
  MealType,
  Member,
  Method,
  PantryStatus,
  Rating,
  Recipe,
  RecipeVersion,
  Settings,
  SourceKind,
  Unit,
} from "@/lib/domain";
import { DEFAULT_SETTINGS } from "@/lib/domain";

// Maps database rows onto the domain types. Nothing else in the app should
// know the column names.

interface HouseholdRow {
  id: string;
  name: string;
  settings: Partial<Settings> | null;
}
interface MemberRow {
  id: string;
  display_name: string;
  initial: string;
  sort_order: number;
}
interface IngredientRow {
  id: string;
  name: string;
  default_aisle: Aisle;
  pantry_status: PantryStatus;
}
interface RecipeRow {
  id: string;
  type: MealType;
  name: string;
  method: Method;
  rating: Rating;
  source_kind: SourceKind;
  source_ref: string;
  open_guesses: string[] | null;
  current_version_id: string | null;
}
interface VersionIngredientRow {
  ingredient_id: string;
  qty: number;
  unit: Unit;
  sort_order: number;
}
interface VersionRow {
  id: string;
  recipe_id: string;
  version_no: number;
  base_servings: number;
  cal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  steps: string[] | null;
  note: string | null;
  changes: string[] | null;
  created_at: string;
  recipe_version_ingredients: VersionIngredientRow[] | null;
}

export interface HouseholdData extends Context {
  householdId: string;
  householdName: string;
}

/** A Supabase client pinned to MealPrep's schema, browser or server. */
export type Db = SupabaseClient<Database, typeof APP_SCHEMA>;

/**
 * Everything the app needs except the weeks. Small enough for one household
 * to hold in memory, which is what lets every screen be a pure computation.
 */
export async function loadHousehold(supabase: Db): Promise<HouseholdData | null> {
  const [households, members, ingredients, recipes, versions] = await Promise.all([
    supabase.from("households").select("id, name, settings").limit(1).maybeSingle(),
    supabase.from("members").select("id, display_name, initial, sort_order").order("sort_order"),
    supabase.from("ingredients").select("id, name, default_aisle, pantry_status").order("name"),
    supabase
      .from("recipes")
      .select("id, type, name, method, rating, source_kind, source_ref, open_guesses, current_version_id")
      .order("name"),
    supabase
      .from("recipe_versions")
      .select(
        "id, recipe_id, version_no, base_servings, cal, protein_g, carbs_g, fat_g, steps, note, changes, created_at, recipe_version_ingredients(ingredient_id, qty, unit, sort_order)",
      )
      .order("version_no"),
  ]);

  const household = households.data as HouseholdRow | null;
  if (!household) return null;

  return {
    householdId: household.id,
    householdName: household.name,
    settings: { ...DEFAULT_SETTINGS, ...(household.settings ?? {}) },
    members: ((members.data ?? []) as MemberRow[]).map(
      (m): Member => ({
        id: m.id,
        name: m.display_name,
        initial: m.initial,
        sortOrder: m.sort_order,
      }),
    ),
    ingredients: ((ingredients.data ?? []) as IngredientRow[]).map(
      (i): Ingredient => ({
        id: i.id,
        name: i.name,
        defaultAisle: i.default_aisle,
        pantryStatus: i.pantry_status,
      }),
    ),
    recipes: ((recipes.data ?? []) as RecipeRow[]).map(
      (r): Recipe => ({
        id: r.id,
        type: r.type,
        name: r.name,
        method: r.method,
        rating: r.rating,
        sourceKind: r.source_kind,
        sourceRef: r.source_ref,
        openGuesses: r.open_guesses ?? [],
        currentVersionId: r.current_version_id ?? "",
      }),
    ),
    versions: ((versions.data ?? []) as VersionRow[]).map(
      (v): RecipeVersion => ({
        id: v.id,
        recipeId: v.recipe_id,
        versionNo: v.version_no,
        baseServings: v.base_servings,
        cal: v.cal,
        protein: v.protein_g,
        carbs: v.carbs_g,
        fat: v.fat_g,
        steps: v.steps ?? [],
        note: v.note ?? "",
        changes: v.changes ?? [],
        createdAt: v.created_at,
        ingredients: (v.recipe_version_ingredients ?? [])
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((vi) => ({
            ingredientId: vi.ingredient_id,
            qty: Number(vi.qty),
            unit: vi.unit,
            sortOrder: vi.sort_order,
          })),
      }),
    ),
  };
}
