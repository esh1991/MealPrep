import { createClient } from "./client";
import type { MealType, Rating, Unit } from "@/lib/domain";
import { guessFoodAisle } from "@/lib/domain";
import type { NormalizedDraft } from "@/lib/structure/normalize";

// Writes. Every one of these runs under row level security as the signed-in
// member, so there is no household check to forget here.

export async function setRating(recipeId: string, rating: Rating) {
  const { error } = await createClient().from("recipes").update({ rating }).eq("id", recipeId);
  if (error) throw error;
}

export async function clearGuesses(recipeId: string) {
  const { error } = await createClient().from("recipes").update({ open_guesses: [] }).eq("id", recipeId);
  if (error) throw error;
}

/**
 * Finds an ingredient by name, case-insensitively, or creates it. Keeping
 * names canonical is what makes the shopping list merge and the pantry
 * lists keep working.
 */
async function resolveIngredient(householdId: string, name: string): Promise<string> {
  const supabase = createClient();
  const trimmed = name.trim();
  const { data: found } = await supabase
    .from("ingredients")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();
  if (found) return found.id as string;

  const { data, error } = await supabase
    .from("ingredients")
    .insert({ household_id: householdId, name: trimmed, default_aisle: guessFoodAisle(trimmed) })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface TweakIngredient {
  /** Empty for an ingredient being added by name. */
  ingredientId: string;
  name: string;
  qty: number;
  unit: Unit;
}

export interface TweakInput {
  householdId: string;
  recipeId: string;
  memberId: string;
  nextVersionNo: number;
  baseServings: number;
  ingredients: TweakIngredient[];
  steps: string[];
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string;
  changes: string[];
}

/**
 * Saves a tweak as a new version and makes it current. Earlier versions are
 * never touched, so a week that pinned one keeps the recipe it planned.
 */
export async function saveTweak(input: TweakInput): Promise<string> {
  const supabase = createClient();

  const kept = input.ingredients.filter((x) => x.qty > 0);
  const ids = await Promise.all(
    kept.map((x) => x.ingredientId || resolveIngredient(input.householdId, x.name)),
  );

  const { data: version, error: versionError } = await supabase
    .from("recipe_versions")
    .insert({
      household_id: input.householdId,
      recipe_id: input.recipeId,
      version_no: input.nextVersionNo,
      base_servings: input.baseServings,
      cal: input.cal,
      protein_g: input.protein,
      carbs_g: input.carbs,
      fat_g: input.fat,
      steps: input.steps,
      note: input.note,
      changes: input.changes,
      created_by: input.memberId,
    })
    .select("id")
    .single();
  if (versionError) throw versionError;

  if (kept.length) {
    const { error } = await supabase.from("recipe_version_ingredients").insert(
      kept.map((x, i) => ({
        version_id: version.id,
        ingredient_id: ids[i],
        qty: x.qty,
        unit: x.unit,
        sort_order: i,
      })),
    );
    if (error) throw error;
  }

  const { error: pointError } = await supabase
    .from("recipes")
    .update({ current_version_id: version.id })
    .eq("id", input.recipeId);
  if (pointError) throw pointError;

  return version.id as string;
}

/** Creates a bare recipe. Ingredients and macros are filled in with Save a tweak. */
export async function createRecipe(input: {
  householdId: string;
  memberId: string;
  name: string;
  type: MealType;
}): Promise<string> {
  const supabase = createClient();
  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: input.householdId,
      type: input.type,
      name: input.name.trim(),
      method: "stove",
      rating: "good",
      source_kind: "manual",
      source_ref: "Your own recipe",
    })
    .select("id")
    .single();
  if (error) throw error;

  const { data: version, error: versionError } = await supabase
    .from("recipe_versions")
    .insert({
      household_id: input.householdId,
      recipe_id: recipe.id,
      version_no: 1,
      base_servings: 4,
      note: "Created.",
      created_by: input.memberId,
    })
    .select("id")
    .single();
  if (versionError) throw versionError;

  await supabase.from("recipes").update({ current_version_id: version.id }).eq("id", recipe.id);
  return recipe.id as string;
}

/**
 * Recipe-level details: the name, the meal it is usually eaten at, and where
 * it came from. These are not versioned, because they describe the recipe
 * rather than the version of it you cook.
 */
export async function updateRecipeDetails(
  recipeId: string,
  details: { name: string; type: MealType; sourceRef: string },
) {
  const { error } = await createClient()
    .from("recipes")
    .update({ name: details.name.trim(), type: details.type, source_ref: details.sourceRef.trim() })
    .eq("id", recipeId);
  if (error) throw error;
}

/**
 * Saves a structured draft as a new recipe at version 1, with whatever the
 * reader guessed kept on the recipe until someone taps Looks right.
 */
export async function createRecipeFromDraft(input: {
  householdId: string;
  memberId: string;
  draft: NormalizedDraft;
  sourceKind: "photo" | "notes";
}): Promise<string> {
  const supabase = createClient();
  const { draft } = input;

  const ingredientIds = await Promise.all(
    draft.ingredients.map((x) => x.ingredientId ?? resolveIngredient(input.householdId, x.name)),
  );

  const { data: recipe, error } = await supabase
    .from("recipes")
    .insert({
      household_id: input.householdId,
      type: draft.type,
      name: draft.name,
      method: draft.method,
      rating: "good",
      source_kind: input.sourceKind,
      source_ref: input.sourceKind === "photo" ? "From a photo" : "From your notes",
      open_guesses: draft.guesses,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { data: version, error: versionError } = await supabase
    .from("recipe_versions")
    .insert({
      household_id: input.householdId,
      recipe_id: recipe.id,
      version_no: 1,
      base_servings: draft.baseServings,
      cal: draft.cal,
      protein_g: draft.protein,
      carbs_g: draft.carbs,
      fat_g: draft.fat,
      steps: draft.steps,
      note: input.sourceKind === "photo" ? "Created from a photo." : "Created from your notes.",
      created_by: input.memberId,
    })
    .select("id")
    .single();
  if (versionError) throw versionError;

  if (draft.ingredients.length) {
    const { error: ingError } = await supabase.from("recipe_version_ingredients").insert(
      draft.ingredients.map((x, i) => ({
        version_id: version.id,
        ingredient_id: ingredientIds[i],
        qty: x.qty,
        unit: x.unit,
        sort_order: i,
      })),
    );
    if (ingError) throw ingError;
  }

  await supabase.from("recipes").update({ current_version_id: version.id }).eq("id", recipe.id);
  return recipe.id as string;
}
