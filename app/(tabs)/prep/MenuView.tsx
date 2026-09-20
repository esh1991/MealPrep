"use client";

import Link from "next/link";
import { useState } from "react";
import Sheet from "@/components/Sheet";
import { MacroBar, MacroLine } from "@/components/Macros";
import { LabelledStepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { addPick, setPortions, splitMealEvenly } from "@/lib/supabase/weekMutations";
import {
  activeMeals,
  coverage,
  coverageLabel,
  macroWeek,
  mealName,
  mealPlural,
  picksFor,
  splitOf,
  weekLabel,
  type MealType,
  type Week,
} from "@/lib/domain";

const RATING_LABEL = { keeper: "Keeper", good: "Good", work: "Needs work" } as const;

export default function MenuView({ week, onOpenMacros }: { week: Week; onOpenMacros: () => void }) {
  const household = useHousehold();
  const { members, settings, recipeById, versionById, refresh } = household;
  const [picking, setPicking] = useState<MealType | null>(null);
  const [busy, setBusy] = useState(false);

  const split = splitOf(macroWeek(week, household).tot);
  const label = weekLabel(split, settings.macroThresholds);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="minisplit" onClick={onOpenMacros}>
        <MacroBar split={split} />
        <span>
          {label.title}
          {split.p ? `: ${split.p}% protein, ${split.c}% carbs, ${split.f}% fat` : ""}
        </span>
      </button>

      {activeMeals(week).map((meal) => {
        const c = coverage(week, meal, members);
        const picks = picksFor(week, meal);
        return (
          <section className="block" key={meal}>
            <div className="block-head">
              <h2>{mealName(meal)}</h2>
              <span className={c.diff === 0 ? "ok" : "warn"}>{coverageLabel(c)}</span>
            </div>

            {picks.length ? (
              <ul className="picks">
                {picks.map((pick) => {
                  const recipe = recipeById(pick.recipeId);
                  const version = versionById(pick.versionId);
                  if (!recipe) return null;
                  return (
                    <li key={pick.id}>
                      <Link className="pick-name" href={`/recipes/${recipe.id}`}>
                        <span className="row-title">{recipe.name}</span>
                        <span className="row-meta">
                          <MacroLine macros={version} />
                        </span>
                      </Link>
                      <LabelledStepper
                        label={`portions of ${recipe.name}`}
                        display={String(pick.portions)}
                        onDown={() => void run(() => setPortions(pick.id, pick.portions - 1))}
                        onUp={() => void run(() => setPortions(pick.id, pick.portions + 1))}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="empty">No {mealPlural(meal)} picked yet.</p>
            )}

            <div className="inline-actions">
              <button className="link" onClick={() => setPicking(meal)} disabled={busy}>
                Add a recipe
              </button>
              {picks.length && c.diff !== 0 ? (
                <button
                  className="link"
                  disabled={busy}
                  onClick={() => void run(() => splitMealEvenly(week, members, meal))}
                >
                  {picks.length > 1 ? `Split ${c.total} evenly` : `Make it ${c.total}`}
                </button>
              ) : null}
            </div>
          </section>
        );
      })}

      {picking ? (
        <PickerSheet meal={picking} week={week} onClose={() => setPicking(null)} onPicked={refresh} />
      ) : null}
    </>
  );
}

function PickerSheet({
  meal,
  week,
  onClose,
  onPicked,
}: {
  meal: MealType;
  week: Week;
  onClose: () => void;
  onPicked: () => Promise<void>;
}) {
  const toast = useToast();
  const { recipes, members, currentVersion } = useHousehold();
  const [busy, setBusy] = useState(false);

  const already = new Set(picksFor(week, meal).map((p) => p.recipeId));
  const c = coverage(week, meal, members);

  // Any recipe can fill any meal. The ones usually eaten at this meal come
  // first so the common case stays a short scroll.
  const usual = recipes.filter((r) => r.type === meal);
  const rest = recipes.filter((r) => r.type !== meal);
  const groups = [
    { key: "usual", label: `Usually ${mealName(meal).toLowerCase()}`, items: usual },
    { key: "rest", label: "Anything else", items: rest },
  ].filter((g) => g.items.length);

  async function pick(recipeId: string, versionId: string, name: string) {
    setBusy(true);
    try {
      await addPick(week, members, meal, recipeId, versionId);
      await onPicked();
      onClose();
      toast(`Added ${name}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} label={`Add a ${mealName(meal).toLowerCase()}`}>
      <h2>Add a {mealName(meal).toLowerCase()}</h2>
      <p className="muted">
        {c.diff > 0
          ? `${c.diff} ${mealPlural(meal)} still to cover.`
          : "Everything is covered, so portions will be split evenly."}
      </p>

      {groups.length ? (
        groups.map((group) => (
          <div key={group.key}>
            <span className="flabel">{group.label}</span>
            <ul className="rows">
              {group.items.map((r) => {
                const version = currentVersion(r);
                const has = already.has(r.id);
                return (
                  <li key={r.id}>
                    <button
                      className="row"
                      disabled={has || busy || !version}
                      onClick={() => version && void pick(r.id, version.id, r.name)}
                    >
                      <span className="row-main">
                        <span className="row-title">{r.name}</span>
                        <span className="row-meta">
                          <MacroLine macros={version} />
                        </span>
                      </span>
                      <span className={`rate ${has ? "" : r.rating}`}>
                        {has ? "Added" : RATING_LABEL[r.rating]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      ) : (
        <p className="empty">No recipes in the library yet.</p>
      )}

      <Link className="btn ghost" href="/recipes">
        Go to recipes
      </Link>
    </Sheet>
  );
}
