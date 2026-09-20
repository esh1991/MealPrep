import { describe, expect, it } from "vitest";
import {
  aggregate,
  assignments,
  batches,
  buyItems,
  containersByDay,
  coverage,
  coverageLabel,
  currentWeekStart,
  dailyAverage,
  dayOf,
  diffVersions,
  formatQty,
  frac,
  gapCount,
  groupByAisle,
  guessAisle,
  listAsText,
  macroWeek,
  planningWeekStart,
  prepDate,
  prepSummary,
  relativeWeek,
  roundQ,
  slotKey,
  splitEvenly,
  splitOf,
  swapTip,
  toggleDay,
  totals,
  weekLabel,
  weekRange,
  withAddedPick,
  withPortionDelta,
} from "./index";
import { DOREEN, SHIVA, sampleContext as ctx, sampleWeek } from "./fixtures/sample";

describe("units (PRD 7.3)", () => {
  it("rounds count-like units up to whole numbers, minimum 1", () => {
    expect(roundQ(0.4, "count")).toBe(1);
    expect(roundQ(7.5, "clove")).toBe(8);
    expect(roundQ(2, "can")).toBe(2);
  });
  it("rounds lb and cup up to the nearest quarter", () => {
    expect(roundQ(0.3, "lb")).toBe(0.5);
    expect(roundQ(1.875, "cup")).toBe(2);
    expect(roundQ(3.75, "cup")).toBe(3.75);
  });
  it("rounds tbsp and tsp up to the nearest half", () => {
    expect(roundQ(2.1, "tbsp")).toBe(2.5);
    expect(roundQ(0.5, "tsp")).toBe(0.5);
  });
  it("rounds oz up to a whole number, tolerating float noise", () => {
    expect(roundQ(2.0000001, "oz")).toBe(2);
    expect(roundQ(2.01, "oz")).toBe(3);
  });
  it("formats fractions", () => {
    expect(frac(3.75)).toBe("3¾");
    expect(frac(0.5)).toBe("½");
    expect(frac(2)).toBe("2");
    expect(frac(0)).toBe("0");
  });
  it("formats quantities with pluralised units", () => {
    expect(formatQty(3.75, "cup")).toBe("3¾ cups");
    expect(formatQty(1, "can")).toBe("1 can");
    expect(formatQty(2, "can")).toBe("2 cans");
    expect(formatQty(6, "count")).toBe("6");
    expect(formatQty(0.5, "tsp")).toBe("½ tsp");
    expect(formatQty(4, "lb")).toBe("4 lb");
  });
});

describe("counting meals (PRD 7.1)", () => {
  it("counts the sample week as 10, 9, 9, 10", () => {
    const t = totals(sampleWeek(), ctx.members);
    expect(t.byMeal).toEqual({ b: 10, l: 9, d: 9, s: 10 });
    expect(t.all).toBe(38);
  });
  it("drops snacks from the total when the switch is off", () => {
    const w = { ...sampleWeek(), snacksEnabled: false };
    expect(totals(w, ctx.members).all).toBe(28);
  });
  it("clears a whole day and restores it on the second tap", () => {
    const w = sampleWeek();
    const cleared = { ...w, slots: toggleDay(w, "Mon") };
    expect(totals(cleared, ctx.members).all).toBe(30);
    const restored = { ...cleared, slots: toggleDay(cleared, "Mon") };
    expect(totals(restored, ctx.members).all).toBe(38);
  });
});

describe("menu (PRD 6.3)", () => {
  it("covers every meal in the sample menu", () => {
    const w = sampleWeek();
    for (const m of ["b", "l", "d", "s"] as const) {
      const c = coverage(w, m, ctx.members);
      expect(c.diff).toBe(0);
      expect(coverageLabel(c)).toBe(`All ${c.total} covered`);
    }
    expect(gapCount(w, ctx.members)).toBe(0);
  });
  it("labels shortfalls and extras", () => {
    expect(coverageLabel({ total: 9, assigned: 7, diff: 2 })).toBe("2 still to cover");
    expect(coverageLabel({ total: 9, assigned: 10, diff: -1 })).toBe("1 extra");
  });
  it("splits 9 across two picks as 5 and 4", () => {
    const w = sampleWeek();
    const picks = splitEvenly(w.picks.filter((p) => p.meal === "l"), 9).map((p) => p.portions);
    expect(picks).toEqual([5, 4]);
  });
  it("adding a recipe covers the remainder, or splits evenly when covered", () => {
    const w = sampleWeek();
    const short = { ...w, picks: w.picks.map((p) => (p.id === "p4" ? { ...p, portions: 2 } : p)) };
    const added = withAddedPick(short, ctx.members, { id: "p9", meal: "l", recipeId: "l2", versionId: "v-l2" });
    expect(added.find((p) => p.id === "p9")?.portions).toBe(2);
    const full = withAddedPick(w, ctx.members, { id: "p9", meal: "l", recipeId: "l2", versionId: "v-l2" });
    expect(full.filter((p) => p.meal === "l").map((p) => p.portions)).toEqual([3, 3, 3]);
  });
  it("removes a pick when its portions reach zero", () => {
    const w = sampleWeek();
    const picks = withPortionDelta(w.picks, "p4", -4);
    expect(picks.find((p) => p.id === "p4")).toBeUndefined();
    expect(picks.length).toBe(7);
  });
});

describe("assigning portions to days (PRD 7.2)", () => {
  it("fills slots Monday first, Shiva then Doreen, in menu order", () => {
    const a = assignments(sampleWeek(), ctx);
    expect(a.get(slotKey("Mon", "l", SHIVA.id))?.recipe.id).toBe("l1");
    expect(a.get(slotKey("Wed", "l", DOREEN.id))?.recipe.id).toBe("l1");
    expect(a.get(slotKey("Thu", "l", SHIVA.id))?.recipe.id).toBe("l3");
    expect(a.get(slotKey("Tue", "l", DOREEN.id))).toBeUndefined();
    expect(a.size).toBe(38);
  });
  it("labels containers by day and marks extras", () => {
    const bs = batches(sampleWeek(), ctx);
    const l3 = bs.find((b) => b.recipe.id === "l3")!;
    expect(l3.days).toEqual({ Thu: 2, Fri: 2 });
    expect(l3.extra).toBe(0);
    expect(l3.multiple).toBe(1);
    const l1 = bs.find((b) => b.recipe.id === "l1")!;
    expect(l1.days).toEqual({ Mon: 2, Tue: 1, Wed: 2 });
    expect(l1.multiple).toBe(1.25);
  });
  it("reports portions beyond the slots as extra", () => {
    const w = sampleWeek();
    const over = { ...w, picks: w.picks.map((p) => (p.id === "p6" ? { ...p, portions: 6 } : p)) };
    const d2 = batches(over, ctx).find((b) => b.recipe.id === "d2")!;
    expect(d2.extra).toBe(2);
  });
  it("counts the containers waiting for each day", () => {
    const byDay = containersByDay(sampleWeek(), ctx);
    // Tuesday loses Doreen's lunch, Wednesday loses Shiva's dinner.
    expect(byDay).toEqual({ Mon: 8, Tue: 7, Wed: 7, Thu: 8, Fri: 8 });
    expect(Object.values(byDay).reduce((a, b) => a + b, 0)).toBe(38);
  });
  it("summarises prep with frozen containers on Thursday and Friday", () => {
    const s = prepSummary(sampleWeek(), ctx);
    expect(s).toEqual({ done: 0, total: 8, containers: 38, frozen: 16 });
  });
});

describe("building the list (PRD 7.3)", () => {
  const w = sampleWeek();
  const items = buyItems(w, ctx);
  const find = (name: string) => items.find((i) => i.name === name);

  it("merges Greek yogurt across three recipes to 3¾ cups", () => {
    expect(find("Nonfat Greek yogurt")?.qtyLabel).toBe("3¾ cups");
    expect(find("Nonfat Greek yogurt")?.from).toBe("Protein overnight oats, Chicken tikka rice bowls, Sheet-pan chicken fajitas");
  });
  it("merges chicken breast to 4 lb and lemons to 6", () => {
    expect(find("Chicken breast")?.qtyLabel).toBe("4 lb");
    expect(find("Lemons")?.qtyLabel).toBe("6");
  });
  it("keeps garlic off the list when marked Have it, but shows it in pantry check", () => {
    expect(find("Garlic")).toBeUndefined();
    const a = aggregate(w, ctx);
    expect(a.check.find((x) => x.ingredientId === "garlic")?.qty).toBe(11.5);
  });
  it("puts usually-have items back on the list when not marked Have it", () => {
    const w2 = { ...w, pantryChecks: [] };
    expect(buyItems(w2, ctx).find((i) => i.name === "Garlic")?.qtyLabel).toBe("12 cloves");
  });
  it("never lists staples", () => {
    expect(find("Olive oil")).toBeUndefined();
    expect(aggregate(w, ctx).staples.some((x) => x.ingredientId === "olive-oil")).toBe(true);
  });
  it("appends extras under their aisle", () => {
    const groups = groupByAisle(items);
    const household = groups.find((g) => g.aisle === "Household");
    expect(household?.items.map((i) => i.name)).toEqual(["Paper towels"]);
    expect(groups.map((g) => g.aisle)).toEqual(["Produce", "Meat & fish", "Dairy & eggs", "Bakery", "Pantry", "Household", "Other"]);
  });
  it("copies as plain text grouped by aisle without crossed-off items", () => {
    const checked = { ...w, listChecks: { "chicken-breast|lb": true } };
    const text = listAsText(buyItems(checked, ctx));
    expect(text).toContain("Dairy & eggs\n- 8 Eggs");
    expect(text).toContain("- 3¾ cups Nonfat Greek yogurt");
    expect(text).toContain("Household\n- Paper towels");
    expect(text).not.toContain("Chicken breast");
    expect(text.startsWith("Produce\n")).toBe(true);
  });
});

describe("macros (PRD 7.4)", () => {
  const w = sampleWeek();
  const mw = macroWeek(w, ctx);

  it("counts every assigned meal", () => {
    expect(mw.tot.n).toBe(38);
    expect(mw.tot.protein).toBe(1162);
    expect(mw.tot.carbs).toBe(1092);
    expect(mw.tot.fat).toBe(404);
  });
  it("labels the sample week protein-heavy at 37 / 35 / 28", () => {
    const sp = splitOf(mw.tot);
    expect(sp).toEqual({ p: 37, c: 35, f: 28 });
    expect(weekLabel(sp, ctx.settings.macroThresholds).title).toBe("Protein-heavy week");
  });
  it("uses the thresholds from settings", () => {
    expect(weekLabel({ p: 30, c: 50, f: 20 }, ctx.settings.macroThresholds).title).toBe("Carb-heavy week");
    expect(weekLabel({ p: 30, c: 30, f: 40 }, ctx.settings.macroThresholds).title).toBe("Fat-heavy week");
    expect(weekLabel({ p: 30, c: 40, f: 30 }, ctx.settings.macroThresholds).title).toBe("Balanced week");
    expect(weekLabel({ p: 30, c: 40, f: 30 }, { protein: 30, carbs: 45, fat: 35 }).title).toBe("Protein-heavy week");
    expect(weekLabel({ p: 0, c: 0, f: 0 }, ctx.settings.macroThresholds).title).toBe("No meals planned yet");
  });
  it("skips meals out per person and day", () => {
    expect(mw.per[DOREEN.id].Tue.n).toBe(3);
    expect(mw.per[SHIVA.id].Wed.n).toBe(3);
    expect(mw.per[SHIVA.id].Mon.n).toBe(4);
  });
  it("averages over days with at least one meal at home", () => {
    const avg = dailyAverage(mw.per[SHIVA.id]);
    expect(avg.cal).toBeGreaterThan(1000);
    const out = { ...mw.per[SHIVA.id], Mon: { cal: 0, protein: 0, carbs: 0, fat: 0, n: 0 } };
    expect(dailyAverage(out).cal).toBeGreaterThan(avg.cal - 200);
  });
  it("suggests swapping the highest-carb pick for the best lower-carb recipe", () => {
    const tip = swapTip(w, ctx);
    // Chicken tikka rice bowls carry the most carbs on the menu at 52 g.
    expect(tip?.from.recipe.id).toBe("l1");
    expect(tip?.meal).toBe("l");
    // Egg bite muffins win on protein minus carbs (24 - 6) even though they
    // are usually a breakfast: any recipe can fill any meal.
    expect(tip?.to.recipe.id).toBe("b1");
  });
  it("will not suggest a recipe already on that meal's menu", () => {
    const onMenu = new Set([...w.picks.filter((p) => p.meal === "l").map((p) => p.recipeId)]);
    const tip = swapTip(w, ctx);
    expect(onMenu.has(tip!.to.recipe.id)).toBe(false);
  });
});

describe("tweak change list (REC-6)", () => {
  const base = { baseServings: 4, steps: ["Cook it."], cal: 470, protein: 42, carbs: 52, fat: 10 };

  it("describes quantity changes, additions, removals and macro edits", () => {
    const prev = {
      ...base,
      ingredients: [
        { ingredientId: "garlic", name: "Garlic", qty: 3, unit: "clove" as const },
        { ingredientId: "feta", name: "Feta", qty: 3, unit: "oz" as const },
      ],
    };
    const next = {
      ...base,
      ingredients: [
        { ingredientId: "garlic", name: "Garlic", qty: 6, unit: "clove" as const },
        { ingredientId: "feta", name: "Feta", qty: 0, unit: "oz" as const },
        { ingredientId: "zucchini", name: "Zucchini", qty: 2, unit: "count" as const },
      ],
      cal: 450, carbs: 48,
    };
    expect(diffVersions(prev, next)).toEqual([
      "Garlic 3 cloves to 6 cloves",
      "Removed Feta",
      "Added Zucchini",
      "Macros now 450 cal, P 42 C 48 F 10",
    ]);
  });

  it("reads a unit change as one change, not a removal and an addition", () => {
    const prev = { ...base, ingredients: [{ ingredientId: "rice", name: "Rice", qty: 2, unit: "cup" as const }] };
    const next = { ...base, ingredients: [{ ingredientId: "rice", name: "Rice", qty: 12, unit: "oz" as const }] };
    expect(diffVersions(prev, next)).toEqual(["Rice 2 cups to 12 oz"]);
  });

  it("notes a change of yield and of steps", () => {
    const prev = { ...base, ingredients: [] };
    const next = { ...base, ingredients: [], baseServings: 6, steps: ["Cook it well.", "Rest it."] };
    expect(diffVersions(prev, next)).toEqual([
      "Now makes 6 servings instead of 4",
      "Reworded the steps",
    ]);
  });

  it("distinguishes writing steps for the first time from rewording them", () => {
    const empty = { ...base, ingredients: [], steps: [] };
    expect(diffVersions(empty, { ...empty, steps: ["Do the thing."] })).toEqual(["Wrote the steps"]);
    expect(diffVersions({ ...empty, steps: ["Do the thing."] }, empty)).toEqual(["Cleared the steps"]);
  });

  it("ignores whitespace-only differences in steps", () => {
    const prev = { ...base, ingredients: [], steps: ["Cook it."] };
    expect(diffVersions(prev, { ...prev, steps: ["  Cook it.  "] })).toEqual([]);
  });

  it("returns nothing when nothing changed", () => {
    const v = { ...base, ingredients: [{ ingredientId: "a", name: "A", qty: 1, unit: "cup" as const }] };
    expect(diffVersions(v, v)).toEqual([]);
  });
});

describe("aisle guessing (LIST-7)", () => {
  it("guesses common aisles and falls back to Other", () => {
    expect(guessAisle("Paper towels")).toBe("Household");
    expect(guessAisle("Bananas")).toBe("Produce");
    expect(guessAisle("Coffee")).toBe("Pantry");
    expect(guessAisle("Greek yogurt")).toBe("Dairy & eggs");
    expect(guessAisle("Sparkling water")).toBe("Other");
  });
});

describe("week boundaries", () => {
  it("finds this week and next week from a Tuesday", () => {
    expect(currentWeekStart("2026-09-15")).toBe("2026-09-14");
    expect(planningWeekStart("2026-09-15")).toBe("2026-09-21");
  });
  it("treats a Monday as this week and plans the following Monday", () => {
    expect(currentWeekStart("2026-09-21")).toBe("2026-09-21");
    expect(planningWeekStart("2026-09-21")).toBe("2026-09-28");
  });
  it("plans tomorrow's week from a Sunday", () => {
    expect(currentWeekStart("2026-09-20")).toBe("2026-09-14");
    expect(planningWeekStart("2026-09-20")).toBe("2026-09-21");
  });
  it("names a week relative to today", () => {
    expect(relativeWeek("2026-09-14", "2026-09-15")).toBe("This week");
    expect(relativeWeek("2026-09-21", "2026-09-15")).toBe("Next week");
    expect(relativeWeek("2026-09-07", "2026-09-15")).toBe("Last week");
    expect(relativeWeek("2026-10-05", "2026-09-15")).toBe("In 3 weeks");
    expect(relativeWeek("2026-08-31", "2026-09-15")).toBe("2 weeks ago");
  });
  it("labels ranges and prep dates", () => {
    expect(weekRange("2026-09-21")).toBe("Sep 21 to 25");
    expect(weekRange("2026-09-28")).toBe("Sep 28 to Oct 2");
    expect(prepDate("2026-09-21", "Sunday")).toBe("2026-09-20");
    expect(dayOf("2026-09-15")).toBe("Tue");
    expect(dayOf("2026-09-19")).toBeNull();
  });
});
