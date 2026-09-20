import { createClient } from "./client";
import type { Day, MealType, Pick as MenuPick, Week } from "@/lib/domain";
import { activeMeals, coverage, picksFor, splitEvenly } from "@/lib/domain";
import type { Member } from "@/lib/domain";

// Writes against one planned week. The domain functions decide what the new
// state should be; these only persist it.

export async function setSlotEating(weekId: string, day: Day, meal: MealType, memberId: string, eating: boolean) {
  const { error } = await createClient()
    .from("week_slots")
    .update({ eating })
    .eq("week_id", weekId)
    .eq("day", day)
    .eq("meal", meal)
    .eq("member_id", memberId);
  if (error) throw error;
}

/** Clears a whole day, or restores it if it is already fully cleared (EAT-3). */
export async function setDayEating(week: Week, day: Day, eating: boolean) {
  const meals = activeMeals(week);
  const { error } = await createClient()
    .from("week_slots")
    .update({ eating })
    .eq("week_id", week.id)
    .eq("day", day)
    .in("meal", meals);
  if (error) throw error;
}

export async function setSnacks(weekId: string, enabled: boolean) {
  const { error } = await createClient().from("weeks").update({ snacks_enabled: enabled }).eq("id", weekId);
  if (error) throw error;
}

/**
 * Adds a recipe to a meal, pinning whichever version is current right now so
 * a later tweak cannot change this week's list or prep (MENU-7).
 */
export async function addPick(
  week: Week,
  members: Member[],
  meal: MealType,
  recipeId: string,
  versionId: string,
) {
  const supabase = createClient();
  const mine = picksFor(week, meal);
  if (mine.some((p) => p.recipeId === recipeId)) return;

  const c = coverage(week, meal, members);
  const sortOrder = mine.length ? Math.max(...mine.map((p) => p.sortOrder)) + 1 : 0;

  if (c.diff > 0) {
    const { error } = await supabase.from("week_picks").insert({
      week_id: week.id,
      meal,
      recipe_id: recipeId,
      version_id: versionId,
      portions: c.diff,
      sort_order: sortOrder,
    });
    if (error) throw error;
    return;
  }

  // Everything is already covered, so the new recipe joins an even split.
  const { data, error } = await supabase
    .from("week_picks")
    .insert({
      week_id: week.id,
      meal,
      recipe_id: recipeId,
      version_id: versionId,
      portions: 1,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error) throw error;

  const withNew: MenuPick[] = [
    ...mine,
    { id: data.id as string, meal, recipeId, versionId, portions: 1, sortOrder },
  ];
  await applySplit(splitEvenly(withNew, c.total), withNew);
}

/** Writes the result of an even split, deleting any pick that fell to zero. */
async function applySplit(next: MenuPick[], before: MenuPick[]) {
  const supabase = createClient();
  const keep = new Set(next.map((p) => p.id));
  const dropped = before.filter((p) => !keep.has(p.id));
  await Promise.all([
    ...next.map((p) => supabase.from("week_picks").update({ portions: p.portions }).eq("id", p.id)),
    ...dropped.map((p) => supabase.from("week_picks").delete().eq("id", p.id)),
  ]);
}

export async function splitMealEvenly(week: Week, members: Member[], meal: MealType) {
  const mine = picksFor(week, meal);
  if (!mine.length) return;
  const c = coverage(week, meal, members);
  await applySplit(splitEvenly(mine, c.total), mine);
}

/** Steps one pick's portions. Reaching zero removes it from the menu (MENU-5). */
export async function setPortions(pickId: string, portions: number) {
  const supabase = createClient();
  if (portions <= 0) {
    const { error } = await supabase.from("week_picks").delete().eq("id", pickId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("week_picks").update({ portions }).eq("id", pickId);
  if (error) throw error;
}

export async function removePick(pickId: string) {
  const { error } = await createClient().from("week_picks").delete().eq("id", pickId);
  if (error) throw error;
}

/** The one-tap swap from the macro tip (MAC-5). Portions stay as they were. */
export async function swapPick(pickId: string, recipeId: string, versionId: string) {
  const { error } = await createClient()
    .from("week_picks")
    .update({ recipe_id: recipeId, version_id: versionId })
    .eq("id", pickId);
  if (error) throw error;
}
