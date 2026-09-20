import type { Week } from "@/lib/domain";
import { currentWeekStart, planningWeekStart, todayISO } from "@/lib/domain";
import { loadHousehold, type Db, type HouseholdData } from "./queries";
import { ensureAndLoadWeek, loadWeek } from "./weeks";

export interface AppData {
  household: HouseholdData;
  /** Next week, the one being planned. Created on first use. */
  planningWeek: Week | null;
  /** This week, for the home screen. Null until a week has been planned. */
  currentWeek: Week | null;
  /** The date the data was read for, so the client agrees with the server. */
  today: string;
}

/**
 * One read of everything the app shows. Two users and a handful of recipes
 * means this stays small, which is what lets every screen be a pure render.
 */
export async function loadAll(supabase: Db, today = todayISO()): Promise<AppData | null> {
  const household = await loadHousehold(supabase);
  if (!household) return null;

  const [planningWeek, currentWeek] = await Promise.all([
    ensureAndLoadWeek(supabase, planningWeekStart(today)),
    // Not created on demand: a week in the past that was never planned
    // should stay absent rather than appear as 40 empty slots.
    loadWeek(supabase, currentWeekStart(today)),
  ]);

  return { household, planningWeek, currentWeek, today };
}
