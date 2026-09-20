"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { addPick, setSnacks } from "@/lib/supabase/weekMutations";
import {
  MEALS,
  coverage,
  coverageLabel,
  mealName,
  mealPlural,
  picksFor,
  weekRange,
  type MealType,
  type Recipe,
  type RecipeVersion,
} from "@/lib/domain";

/**
 * Which meal to add a recipe to. Any recipe can fill any meal, so this asks
 * rather than assuming, and shows what each meal still needs.
 */
export default function AddToWeekSheet({
  recipe,
  version,
  onClose,
}: {
  recipe: Recipe;
  version: RecipeVersion;
  onClose: () => void;
}) {
  const toast = useToast();
  const { members, planningWeek, refresh } = useHousehold();
  const [busy, setBusy] = useState<MealType | null>(null);

  if (!planningWeek) {
    return (
      <Sheet onClose={onClose} label="Add to next week">
        <h2>Add to next week</h2>
        <p className="empty">Next week isn&apos;t set up yet. Open Plan first.</p>
      </Sheet>
    );
  }

  async function add(meal: MealType) {
    if (!planningWeek) return;
    setBusy(meal);
    try {
      // A snack can only be planned once the snack column is on.
      const week =
        meal === "s" && !planningWeek.snacksEnabled
          ? (await setSnacks(planningWeek.id, true), { ...planningWeek, snacksEnabled: true })
          : planningWeek;
      await addPick(week, members, meal, recipe.id, version.id);
      await refresh();
      onClose();
      toast(`Added to ${mealPlural(meal)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet onClose={onClose} label="Add to next week">
      <h2>Add to next week</h2>
      <p className="muted">
        {recipe.name}, for {weekRange(planningWeek.startDate)}. Pick any meal.
      </p>

      <ul className="rows">
        {MEALS.map((m) => {
          const already = picksFor(planningWeek, m.k).some((p) => p.recipeId === recipe.id);
          const c = coverage(planningWeek, m.k, members);
          const off = m.k === "s" && !planningWeek.snacksEnabled;
          return (
            <li key={m.k}>
              <button
                className="row"
                disabled={already || busy !== null}
                onClick={() => void add(m.k)}
              >
                <span className="row-main">
                  <span className="row-title">{mealName(m.k)}</span>
                  <span className={`row-meta ${c.diff > 0 && !off ? "warn" : ""}`}>
                    {off ? "Snacks are off, adding turns them back on" : coverageLabel(c)}
                  </span>
                </span>
                <span className="chev" aria-hidden="true">
                  {already ? "" : "›"}
                </span>
                {already ? <span className="rate">Added</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
