import type { Aisle, Day, MealType, Unit, Week } from "@/lib/domain";
import type { Db } from "./queries";

// Loading one planned week. Weeks are created on demand by the ensure_week
// function, which also fills in all 40 slots switched on.

interface SlotRow {
  day: Day;
  meal: MealType;
  member_id: string;
  eating: boolean;
}
interface PickRow {
  id: string;
  meal: MealType;
  recipe_id: string;
  version_id: string;
  portions: number;
  sort_order: number;
}
interface WeekRow {
  id: string;
  start_date: string;
  snacks_enabled: boolean;
}

/** Creates the week if it does not exist yet, and returns its id. */
export async function ensureWeek(supabase: Db, startDate: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("ensure_week", { p_start_date: startDate });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function loadWeek(supabase: Db, startDate: string): Promise<Week | null> {
  const { data: weekRow } = await supabase
    .from("weeks")
    .select("id, start_date, snacks_enabled")
    .eq("start_date", startDate)
    .maybeSingle();
  const week = weekRow as WeekRow | null;
  if (!week) return null;

  const [slots, picks, pantry, extras, checks, prep] = await Promise.all([
    supabase.from("week_slots").select("day, meal, member_id, eating").eq("week_id", week.id),
    supabase
      .from("week_picks")
      .select("id, meal, recipe_id, version_id, portions, sort_order")
      .eq("week_id", week.id)
      .order("sort_order"),
    supabase.from("week_pantry_checks").select("ingredient_id, have").eq("week_id", week.id),
    supabase.from("week_extras").select("id, name, aisle").eq("week_id", week.id).order("created_at"),
    supabase.from("week_list_checks").select("item_key, checked").eq("week_id", week.id),
    supabase.from("week_prep_status").select("pick_id, done").eq("week_id", week.id),
  ]);

  const listChecks: Record<string, boolean> = {};
  for (const row of (checks.data ?? []) as { item_key: string; checked: boolean }[]) {
    listChecks[row.item_key] = row.checked;
  }
  const prepDone: Record<string, boolean> = {};
  for (const row of (prep.data ?? []) as { pick_id: string; done: boolean }[]) {
    prepDone[row.pick_id] = row.done;
  }

  return {
    id: week.id,
    startDate: week.start_date,
    snacksEnabled: week.snacks_enabled,
    slots: ((slots.data ?? []) as SlotRow[]).map((s) => ({
      day: s.day,
      meal: s.meal,
      memberId: s.member_id,
      eating: s.eating,
    })),
    picks: ((picks.data ?? []) as PickRow[]).map((p) => ({
      id: p.id,
      meal: p.meal,
      recipeId: p.recipe_id,
      versionId: p.version_id,
      portions: p.portions,
      sortOrder: p.sort_order,
    })),
    pantryChecks: ((pantry.data ?? []) as { ingredient_id: string; have: boolean }[]).map((c) => ({
      ingredientId: c.ingredient_id,
      have: c.have,
    })),
    extras: ((extras.data ?? []) as { id: string; name: string; aisle: Aisle }[]).map((e) => ({
      id: e.id,
      name: e.name,
      aisle: e.aisle,
    })),
    listChecks,
    prepDone,
  };
}

/** Creates the week if needed, then loads it. */
export async function ensureAndLoadWeek(supabase: Db, startDate: string): Promise<Week | null> {
  const existing = await loadWeek(supabase, startDate);
  if (existing) return existing;
  await ensureWeek(supabase, startDate);
  return loadWeek(supabase, startDate);
}

export type { Unit };
