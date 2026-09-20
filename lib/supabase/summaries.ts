import type { WeekSummary } from "@/lib/domain";
import type { Db } from "./queries";

/**
 * Every planned week with just its picks. Enough for the Insights panel to
 * total each week and count how often a recipe gets cooked, without pulling
 * 40 slot rows per week.
 */
export async function loadWeekSummaries(supabase: Db): Promise<WeekSummary[]> {
  const { data: weeks } = await supabase.from("weeks").select("id, start_date").order("start_date");
  const rows = (weeks ?? []) as { id: string; start_date: string }[];
  if (!rows.length) return [];

  const { data: picks } = await supabase
    .from("week_picks")
    .select("week_id, recipe_id, version_id, portions");
  const byWeek = new Map<string, WeekSummary["picks"]>();
  for (const p of (picks ?? []) as {
    week_id: string;
    recipe_id: string;
    version_id: string;
    portions: number;
  }[]) {
    const list = byWeek.get(p.week_id) ?? [];
    list.push({ recipeId: p.recipe_id, versionId: p.version_id, portions: p.portions });
    byWeek.set(p.week_id, list);
  }

  return rows.map((w) => ({ startDate: w.start_date, picks: byWeek.get(w.id) ?? [] }));
}
