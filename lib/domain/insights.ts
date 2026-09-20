import type { MacroTotals } from "./macros";
import { plannedTotals, splitOf, type Split } from "./macros";
import type { Rating, Recipe, RecipeVersion } from "./types";

// Reading across several weeks, for the Insights panel.

export interface WeekSummary {
  startDate: string;
  picks: { recipeId: string; versionId: string; portions: number }[];
}

export interface WeekPoint {
  startDate: string;
  totals: MacroTotals;
  split: Split;
  /** Portions planned that week. Zero means the week was never filled in. */
  portions: number;
}

/** One point per week, oldest first, for the trend chart. */
export function weekPoints(summaries: WeekSummary[], versions: RecipeVersion[]): WeekPoint[] {
  return summaries
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((w) => {
      const totals = plannedTotals(w.picks, versions);
      return { startDate: w.startDate, totals, split: splitOf(totals), portions: totals.n };
    });
}

export interface RecipeUsage {
  recipe: Recipe;
  /** Weeks this recipe appeared on the menu. */
  weeks: number;
  portions: number;
  /** Monday of the most recent week it was planned for, or null. */
  lastPlanned: string | null;
}

/** How often each recipe has actually been cooked, most used first. */
export function recipeUsage(summaries: WeekSummary[], recipes: Recipe[]): RecipeUsage[] {
  const byRecipe = new Map<string, { weeks: Set<string>; portions: number; last: string | null }>();
  for (const week of summaries) {
    for (const pick of week.picks) {
      let row = byRecipe.get(pick.recipeId);
      if (!row) {
        row = { weeks: new Set(), portions: 0, last: null };
        byRecipe.set(pick.recipeId, row);
      }
      row.weeks.add(week.startDate);
      row.portions += pick.portions;
      if (!row.last || week.startDate > row.last) row.last = week.startDate;
    }
  }
  return recipes
    .map((recipe) => {
      const row = byRecipe.get(recipe.id);
      return {
        recipe,
        weeks: row ? row.weeks.size : 0,
        portions: row ? row.portions : 0,
        lastPlanned: row ? row.last : null,
      };
    })
    .sort((a, b) => b.portions - a.portions || a.recipe.name.localeCompare(b.recipe.name));
}

/** How the library breaks down by rating, for the shape of what you keep. */
export function ratingCounts(recipes: Recipe[]): Record<Rating, number> {
  const out = { keeper: 0, good: 0, work: 0 } as Record<Rating, number>;
  for (const r of recipes) out[r.rating]++;
  return out;
}
