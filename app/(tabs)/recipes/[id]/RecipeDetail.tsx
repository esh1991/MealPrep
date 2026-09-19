"use client";

import Link from "next/link";
import { useState } from "react";
import { MacroStrip } from "@/components/Macros";
import { LabelledStepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { clearGuesses, setRating } from "@/lib/supabase/mutations";
import { formatQty, mealName, type Rating } from "@/lib/domain";
import TweakSheet from "./TweakSheet";

const RATINGS: [Rating, string][] = [
  ["keeper", "Keeper"],
  ["good", "Good"],
  ["work", "Needs work"],
];

export default function RecipeDetail({ recipeId }: { recipeId: string }) {
  const toast = useToast();
  const { recipeById, currentVersion, versionsOf, ingredients, refresh } = useHousehold();
  const [servings, setServings] = useState<number | null>(null);
  const [tweaking, setTweaking] = useState(false);

  const recipe = recipeById(recipeId);
  const version = recipe ? currentVersion(recipe) : undefined;

  if (!recipe || !version) {
    return (
      <>
        <div className="back">
          <Link className="link" href="/recipes">
            ‹ Recipes
          </Link>
        </div>
        <p className="empty">That recipe is no longer here.</p>
      </>
    );
  }

  const history = versionsOf(recipe.id).slice().reverse();
  const shownServings = servings ?? version.baseServings;
  const factor = shownServings / version.baseServings;
  const nameOf = (id: string) => ingredients.find((i) => i.id === id)?.name ?? "Ingredient";

  async function rate(next: Rating) {
    if (!recipe) return;
    await setRating(recipe.id, next);
    await refresh();
  }

  async function looksRight() {
    if (!recipe) return;
    await clearGuesses(recipe.id);
    await refresh();
    toast("Guesses cleared");
  }

  return (
    <>
      <div className="back">
        <Link className="link" href="/recipes">
          ‹ Recipes
        </Link>
      </div>

      <header className="top recipe-top">
        <span className="tape">{mealName(recipe.type)}</span>
        <h1>{recipe.name}</h1>
      </header>

      <div className="segs rating" role="group" aria-label="How it worked for us">
        {RATINGS.map(([key, label]) => (
          <button
            key={key}
            className={`seg ${recipe.rating === key ? "on" : ""}`}
            aria-pressed={recipe.rating === key}
            onClick={() => void rate(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="macro-block">
        {version.cal ? (
          <>
            <MacroStrip macros={version} />
            <p className="fine">Per serving</p>
          </>
        ) : (
          <p className="empty">Macros not set yet. Add them with Save a tweak.</p>
        )}
      </section>

      {recipe.openGuesses.length ? (
        <section className="note alert" style={{ display: "block" }}>
          <h2>Check these guesses</h2>
          <ul className="guesses">
            {recipe.openGuesses.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <button className="link" onClick={() => void looksRight()}>
            Looks right
          </button>
        </section>
      ) : null}

      <section className="block">
        <div className="block-head">
          <h2>
            Our version <span className="ver">v{version.versionNo}</span>
          </h2>
          <LabelledStepper
            label="servings"
            display={`${shownServings} servings`}
            onDown={() => setServings(Math.max(1, shownServings - 1))}
            onUp={() => setServings(shownServings + 1)}
          />
        </div>

        {version.ingredients.length ? (
          <ul className="ing">
            {version.ingredients.map((vi) => (
              <li key={`${vi.ingredientId}-${vi.unit}`}>
                <span className="q">{formatQty(vi.qty * factor, vi.unit)}</span>
                <span>{nameOf(vi.ingredientId)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty">No ingredients yet. Tap Save a tweak to add them.</p>
        )}

        {version.steps.length ? (
          <ol className="steps">
            {version.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        ) : null}
      </section>

      <section className="block">
        <h2>Tweaks</h2>
        <ul className="log">
          {history.map((v, i) => (
            <li key={v.id}>
              <span className="ver">v{v.versionNo}</span>
              <div>
                <p>{v.note}</p>
                {v.changes.length ? (
                  <ul>
                    {v.changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
                <small>
                  {new Date(v.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {i === 0 ? ", current" : ""}
                </small>
              </div>
            </li>
          ))}
        </ul>
        <p className="source">
          {recipe.sourceRef.startsWith("example.com") ? `Original: ${recipe.sourceRef}` : recipe.sourceRef}
        </p>
      </section>

      <div className="actions">
        <button className="btn" onClick={() => setTweaking(true)}>
          Save a tweak
        </button>
        <button className="btn ghost" disabled title="Comes with the Plan tab in Phase 4">
          Add to next week
        </button>
      </div>

      {tweaking ? (
        <TweakSheet
          recipe={recipe}
          version={version}
          nextVersionNo={Math.max(...versionsOf(recipe.id).map((v) => v.versionNo)) + 1}
          onClose={() => setTweaking(false)}
        />
      ) : null}
    </>
  );
}
