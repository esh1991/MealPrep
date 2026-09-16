import type { Context, Day, MealType, Pick, Recipe, RecipeVersion, Week } from "./types";
import { activeMeals, neededSlots, slotKey } from "./slots";
import { picksFor } from "./menu";

// Assigning portions to days, PRD 7.2.

export interface Assignment {
  day: Day;
  meal: MealType;
  memberId: string;
  pick: Pick;
  recipe: Recipe;
  version: RecipeVersion;
}

export function recipeById(ctx: Context, id: string): Recipe | undefined {
  return ctx.recipes.find((r) => r.id === id);
}

export function versionById(ctx: Context, id: string): RecipeVersion | undefined {
  return ctx.versions.find((v) => v.id === id);
}

export function currentVersion(ctx: Context, recipe: Recipe): RecipeVersion | undefined {
  return versionById(ctx, recipe.currentVersionId);
}

/** Which recipe fills each eating slot, keyed by slotKey. */
export function assignments(week: Week, ctx: Context): Map<string, Assignment> {
  const out = new Map<string, Assignment>();
  for (const meal of activeMeals(week)) {
    const slots = neededSlots(week, meal, ctx.members);
    let idx = 0;
    for (const pick of picksFor(week, meal)) {
      const recipe = recipeById(ctx, pick.recipeId);
      const version = versionById(ctx, pick.versionId);
      if (!recipe || !version) continue;
      for (const s of slots.slice(idx, idx + pick.portions)) {
        out.set(slotKey(s.day, meal, s.memberId), { day: s.day, meal, memberId: s.memberId, pick, recipe, version });
      }
      idx += pick.portions;
    }
  }
  return out;
}

export interface Batch {
  pick: Pick;
  recipe: Recipe;
  version: RecipeVersion;
  meal: MealType;
  portions: number;
  /** Containers per day. */
  days: Partial<Record<Day, number>>;
  /** Portions beyond the week's slots. */
  extra: number;
  /** Multiple of the base recipe, such as 1.25. */
  multiple: number;
}

/** One batch per pick, in menu order, with container counts by day. */
export function batches(week: Week, ctx: Context): Batch[] {
  const out: Batch[] = [];
  for (const meal of activeMeals(week)) {
    const slots = neededSlots(week, meal, ctx.members);
    let idx = 0;
    for (const pick of picksFor(week, meal)) {
      const recipe = recipeById(ctx, pick.recipeId);
      const version = versionById(ctx, pick.versionId);
      if (!recipe || !version) continue;
      const mine = slots.slice(idx, idx + pick.portions);
      idx += pick.portions;
      const days: Partial<Record<Day, number>> = {};
      for (const s of mine) days[s.day] = (days[s.day] ?? 0) + 1;
      out.push({
        pick,
        recipe,
        version,
        meal,
        portions: pick.portions,
        days,
        extra: pick.portions - mine.length,
        multiple: Math.round((pick.portions / version.baseServings) * 100) / 100,
      });
    }
  }
  return out;
}

export interface PrepSummary {
  done: number;
  total: number;
  containers: number;
  frozen: number;
}

export function prepSummary(week: Week, ctx: Context): PrepSummary {
  const bs = batches(week, ctx);
  const freeze = ctx.settings.freezeDays;
  return {
    done: bs.filter((b) => week.prepDone[b.pick.id]).length,
    total: bs.length,
    containers: bs.reduce((s, b) => s + b.portions, 0),
    frozen: bs.reduce((s, b) => s + freeze.reduce((t, d) => t + (b.days[d] ?? 0), 0), 0),
  };
}
