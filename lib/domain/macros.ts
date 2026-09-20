import type { Context, Day, MacroThresholds, MealType, Recipe, RecipeVersion, Week } from "./types";
import { DAYS, activeMeals } from "./slots";
import { picksFor } from "./menu";
import { assignments, currentVersion, recipeById, versionById } from "./assign";

// Macros, PRD 7.4.

export interface MacroTotals {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Number of meals counted. */
  n: number;
}

const blank = (): MacroTotals => ({ cal: 0, protein: 0, carbs: 0, fat: 0, n: 0 });

export interface MacroWeek {
  tot: MacroTotals;
  /** memberId -> day -> totals for meals eaten at home. */
  per: Record<string, Record<Day, MacroTotals>>;
}

export function macroWeek(week: Week, ctx: Context): MacroWeek {
  const tot = blank();
  const per: Record<string, Record<Day, MacroTotals>> = {};
  for (const m of ctx.members) {
    per[m.id] = { Mon: blank(), Tue: blank(), Wed: blank(), Thu: blank(), Fri: blank() };
  }
  for (const a of assignments(week, ctx).values()) {
    const p = per[a.memberId]?.[a.day];
    for (const f of ["cal", "protein", "carbs", "fat"] as const) {
      tot[f] += a.version[f];
      if (p) p[f] += a.version[f];
    }
    tot.n++;
    if (p) p.n++;
  }
  return { tot, per };
}

export interface Split {
  p: number;
  c: number;
  f: number;
}

/** Share of calories from protein, carbs and fat. Sums to 100 unless empty. */
export function splitOf(t: { protein: number; carbs: number; fat: number }): Split {
  const pc = t.protein * 4;
  const cc = t.carbs * 4;
  const fc = t.fat * 9;
  const s = pc + cc + fc;
  if (!s) return { p: 0, c: 0, f: 0 };
  const p = Math.round((pc / s) * 100);
  const c = Math.round((cc / s) * 100);
  return { p, c, f: Math.max(0, 100 - p - c) };
}

export interface WeekLabel {
  title: string;
  detail: string;
}

export function weekLabel(sp: Split, th: MacroThresholds): WeekLabel {
  if (!sp.p && !sp.c && !sp.f) return { title: "No meals planned yet", detail: "Pick a menu to see the macro split." };
  if (sp.p >= th.protein)
    return { title: "Protein-heavy week", detail: `Protein supplies ${sp.p}% of calories. Carbs are ${sp.c}% and fat is ${sp.f}%.` };
  if (sp.c >= th.carbs) return { title: "Carb-heavy week", detail: `Carbs supply ${sp.c}% of calories. Protein is ${sp.p}%.` };
  if (sp.f >= th.fat) return { title: "Fat-heavy week", detail: `Fat supplies ${sp.f}% of calories. Protein is ${sp.p}%.` };
  return { title: "Balanced week", detail: `No single macro dominates. Protein ${sp.p}%, carbs ${sp.c}%, fat ${sp.f}%.` };
}

/** Average over the days a person eats at least one meal at home (MAC-3). */
export function dailyAverage(days: Record<Day, MacroTotals>): { cal: number; protein: number; carbs: number; fat: number } {
  const ds = DAYS.map((d) => days[d]).filter((x) => x.n);
  const n = ds.length || 1;
  const s = (f: "cal" | "protein" | "carbs" | "fat") => Math.round(ds.reduce((a, x) => a + x[f], 0) / n);
  return { cal: s("cal"), protein: s("protein"), carbs: s("carbs"), fat: s("fat") };
}

export interface SwapTip {
  meal: MealType;
  pickId: string;
  from: { recipe: Recipe; version: RecipeVersion };
  to: { recipe: Recipe; version: RecipeVersion };
}

/**
 * The chosen recipe with the most carbs, and a lower-carb recipe to put in
 * its place, ranked by protein minus carbs (MAC-5).
 *
 * Any recipe can fill any meal, so the alternative is not restricted to the
 * meal type the replaced recipe is usually eaten at. Only recipes already on
 * that meal's menu are excluded.
 */
export function swapTip(week: Week, ctx: Context): SwapTip | null {
  const picked: { meal: MealType; pickId: string; recipe: Recipe; version: RecipeVersion }[] = [];
  for (const meal of activeMeals(week)) {
    for (const pick of picksFor(week, meal)) {
      const recipe = recipeById(ctx, pick.recipeId);
      const version = versionById(ctx, pick.versionId);
      if (recipe && version && pick.portions && version.cal) picked.push({ meal, pickId: pick.id, recipe, version });
    }
  }
  if (!picked.length) return null;
  const top = picked.reduce((a, b) => (b.version.carbs > a.version.carbs ? b : a));
  const onMenu = new Set(picksFor(week, top.meal).map((p) => p.recipeId));
  const alts = ctx.recipes
    .filter((r) => !onMenu.has(r.id))
    .map((r) => ({ recipe: r, version: currentVersion(ctx, r) }))
    .filter((x): x is { recipe: Recipe; version: RecipeVersion } => !!x.version && !!x.version.cal && x.version.carbs < top.version.carbs)
    .sort((a, b) => b.version.protein - b.version.carbs - (a.version.protein - a.version.carbs));
  if (!alts.length) return null;
  return { meal: top.meal, pickId: top.pickId, from: { recipe: top.recipe, version: top.version }, to: alts[0] };
}
