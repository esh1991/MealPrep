import { createClient } from "./client";
import type { Aisle, PantryStatus } from "@/lib/domain";
import { guessAisle } from "@/lib/domain";

// Writes behind the List tab: crossing items off, free-text extras, the
// weekly pantry check, and the two standing pantry lists.

/** Crossing an item off is per week, keyed the same way the list builds it. */
export async function setListChecked(weekId: string, itemKey: string, checked: boolean) {
  const { error } = await createClient()
    .from("week_list_checks")
    .upsert({ week_id: weekId, item_key: itemKey, checked }, { onConflict: "week_id,item_key" });
  if (error) throw error;
}

/** Anything typed in by hand, with a guessed aisle including Household and Other. */
export async function addExtra(weekId: string, memberId: string, name: string): Promise<Aisle> {
  const trimmed = name.trim();
  const aisle = guessAisle(trimmed);
  const { error } = await createClient()
    .from("week_extras")
    .insert({ week_id: weekId, name: trimmed, aisle, created_by: memberId });
  if (error) throw error;
  return aisle;
}

export async function removeExtra(extraId: string, weekId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("week_extras").delete().eq("id", extraId);
  if (error) throw error;
  // The crossed-off flag would otherwise outlive the item it belonged to.
  await supabase.from("week_list_checks").delete().eq("week_id", weekId).eq("item_key", `x:${extraId}`);
}

/** Have it or Buy for one usually-have item, for this week only (LIST-4). */
export async function setPantryCheck(weekId: string, ingredientId: string, have: boolean) {
  const { error } = await createClient()
    .from("week_pantry_checks")
    .upsert({ week_id: weekId, ingredient_id: ingredientId, have }, { onConflict: "week_id,ingredient_id" });
  if (error) throw error;
}

/** Moves an ingredient on or off one of the two standing lists (LIST-6). */
export async function setPantryStatus(ingredientId: string, status: PantryStatus) {
  const { error } = await createClient()
    .from("ingredients")
    .update({ pantry_status: status })
    .eq("id", ingredientId);
  if (error) throw error;
}

/**
 * Adds a name to a pantry list. If it matches an ingredient the household
 * already uses, that one is linked rather than a duplicate created, which is
 * what keeps the list maths and the pantry lists agreeing.
 */
export async function addToPantryList(
  householdId: string,
  name: string,
  status: Exclude<PantryStatus, "none">,
): Promise<{ matched: boolean }> {
  const supabase = createClient();
  const trimmed = name.trim();

  const { data: existing } = await supabase
    .from("ingredients")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  if (existing) {
    await setPantryStatus(existing.id as string, status);
    return { matched: true };
  }

  const { error } = await supabase.from("ingredients").insert({
    household_id: householdId,
    name: trimmed,
    default_aisle: guessAisle(trimmed),
    pantry_status: status,
  });
  if (error) throw error;
  return { matched: false };
}
