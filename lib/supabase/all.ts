import type { Week } from "@/lib/domain";
import { currentWeekStart, planningWeekStart, todayISO } from "@/lib/domain";
import { loadHousehold, type Db, type HouseholdData } from "./queries";
import { ensureAndLoadWeek, loadWeek } from "./weeks";

export interface AppData {
  household: HouseholdData;
  /** This week, for the home screen. Null until a week has been planned. */
  currentWeek: Week | null;
  /** Next week. What the home screen points at. */
  planningWeek: Week | null;
  /** The week being worked on in Plan, List and Prep. Usually next week. */
  selectedWeek: Week | null;
  selectedWeekStart: string;
  /** The date the data was read for, so the client agrees with the server. */
  today: string;
}

/**
 * One read of everything the app shows. Two users and a handful of recipes
 * means this stays small, which is what lets every screen be a pure render.
 *
 * Weeks are created on demand when they are the one being planned. A week in
 * the past that was never planned stays absent rather than appearing as 40
 * empty slots.
 */
export async function loadAll(
  supabase: Db,
  today = todayISO(),
  selectedStart?: string,
): Promise<AppData | null> {
  const household = await loadHousehold(supabase);
  if (!household) return null;

  const planningStart = planningWeekStart(today);
  const selected = selectedStart ?? planningStart;

  const [planningWeek, currentWeek, selectedOnly] = await Promise.all([
    ensureAndLoadWeek(supabase, planningStart),
    loadWeek(supabase, currentWeekStart(today)),
    selected === planningStart ? Promise.resolve(null) : ensureAndLoadWeek(supabase, selected),
  ]);

  return {
    household,
    currentWeek,
    planningWeek,
    selectedWeek: selectedOnly ?? planningWeek,
    selectedWeekStart: selected,
    today,
  };
}
