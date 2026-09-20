"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { LabelledStepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { saveTweak, type TweakIngredient } from "@/lib/supabase/mutations";
import {
  STEP,
  UNITS,
  diffVersions,
  formatQty,
  type Recipe,
  type RecipeVersion,
  type Unit,
  type VersionDraft,
} from "@/lib/domain";

const MACRO_FIELDS = [
  ["cal", "Calories"],
  ["protein", "Protein g"],
  ["carbs", "Carbs g"],
  ["fat", "Fat g"],
] as const;

type MacroKey = (typeof MACRO_FIELDS)[number][0];

export default function TweakSheet({
  recipe,
  version,
  nextVersionNo,
  onClose,
}: {
  recipe: Recipe;
  version: RecipeVersion;
  nextVersionNo: number;
  onClose: () => void;
}) {
  const toast = useToast();
  const { householdId, memberId, ingredients, refresh } = useHousehold();

  const nameOf = (id: string) => ingredients.find((i) => i.id === id)?.name ?? "Ingredient";

  const before: VersionDraft = {
    baseServings: version.baseServings,
    ingredients: version.ingredients.map((vi) => ({
      ingredientId: vi.ingredientId,
      name: nameOf(vi.ingredientId),
      qty: vi.qty,
      unit: vi.unit,
    })),
    steps: version.steps,
    cal: version.cal,
    protein: version.protein,
    carbs: version.carbs,
    fat: version.fat,
  };

  const [servings, setServings] = useState(version.baseServings);
  const [draft, setDraft] = useState<TweakIngredient[]>(before.ingredients);
  const [stepsText, setStepsText] = useState(version.steps.join("\n"));
  const [macros, setMacros] = useState<Record<MacroKey, number>>({
    cal: version.cal,
    protein: version.protein,
    carbs: version.carbs,
    fat: version.fat,
  });
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // One step per line keeps editing usable on a phone.
  const steps = stepsText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const after: VersionDraft = { baseServings: servings, ingredients: draft, steps, ...macros };
  const changes = diffVersions(before, after);

  function stepQty(index: number, direction: 1 | -1) {
    setDraft((prev) =>
      prev.map((x, i) => {
        if (i !== index) return x;
        const size = STEP[x.unit] ?? 1;
        return { ...x, qty: Math.max(0, Math.round((x.qty + direction * size) * 100) / 100) };
      }),
    );
    setError("");
  }

  function changeUnit(index: number, unit: Unit) {
    setDraft((prev) => prev.map((x, i) => (i === index ? { ...x, unit } : x)));
    setError("");
  }

  function addIngredient() {
    const name = newName.trim();
    if (!name) return;
    const existing = ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase());
    setDraft((prev) => [
      ...prev,
      { ingredientId: existing?.id ?? "", name: existing?.name ?? name, qty: 1, unit: "count" },
    ]);
    setNewName("");
  }

  async function save() {
    if (!changes.length && !note.trim()) {
      setError("Change something, or write a note about why this version exists.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveTweak({
        householdId,
        recipeId: recipe.id,
        memberId,
        nextVersionNo,
        baseServings: servings,
        ingredients: draft,
        steps,
        ...macros,
        note: note.trim() || "Adjusted the recipe.",
        changes,
      });
      await refresh();
      onClose();
      toast(`Saved as version ${nextVersionNo}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the tweak.");
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose} label={`Tweak ${recipe.name}`}>
      <h2>Tweak {recipe.name}</h2>
      <p className="muted">
        Saves as version {nextVersionNo}. Older versions stay in the history, and any week already
        planned keeps the version it picked.
      </p>

      <div className="switchrow" style={{ marginTop: 14 }}>
        <div>
          <strong>Makes</strong>
          <small>What one batch of these quantities yields</small>
        </div>
        <LabelledStepper
          label="servings the recipe makes"
          display={`${servings}`}
          onDown={() => setServings(Math.max(1, servings - 1))}
          onUp={() => setServings(servings + 1)}
        />
      </div>

      <span className="flabel">Ingredients</span>
      {draft.length ? (
        <ul className="edit">
          {draft.map((x, i) => {
            const original = before.ingredients.find((o) => o.ingredientId === x.ingredientId);
            const changed = !original || original.qty !== x.qty || original.unit !== x.unit;
            return (
              <li
                key={`${x.ingredientId || x.name}-${i}`}
                className={`${changed ? "changed" : ""} ${x.qty === 0 ? "gone" : ""}`}
              >
                <span>
                  {x.name}
                  <select
                    value={x.unit}
                    onChange={(e) => changeUnit(i, e.target.value as Unit)}
                    aria-label={`Unit for ${x.name}`}
                    style={{ marginTop: 4, font: "inherit", fontSize: 13 }}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </span>
                <LabelledStepper
                  label={x.name}
                  display={x.qty === 0 ? "none" : formatQty(x.qty, x.unit)}
                  onDown={() => stepQty(i, -1)}
                  onUp={() => stepQty(i, 1)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">No ingredients yet. Add the first one below.</p>
      )}

      <div className="padd" style={{ marginTop: 12 }}>
        <input
          type="text"
          placeholder="Add an ingredient"
          aria-label="Add an ingredient"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addIngredient();
            }
          }}
        />
        <button className="btn small ghost" onClick={addIngredient}>
          Add
        </button>
      </div>
      <p className="fine">Step an ingredient down to none to take it out.</p>

      <div className="field">
        <label htmlFor="tweak-steps">Steps</label>
        <textarea
          id="tweak-steps"
          rows={8}
          placeholder={"One step per line.\nHeat the oven to 425°F.\nRoast 20 minutes."}
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
        />
      </div>
      <p className="fine">One step per line. Blank lines are ignored.</p>

      <span className="flabel">Macros per serving</span>
      <div className="mgrid">
        {MACRO_FIELDS.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={macros[key]}
              onChange={(e) =>
                setMacros((prev) => ({
                  ...prev,
                  [key]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="field">
        <label htmlFor="tweak-note">What changed and why</label>
        <textarea
          id="tweak-note"
          placeholder="Less oil, more garlic. Came out dry last time."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {changes.length ? (
        <>
          <span className="flabel">This will record</span>
          <ul className="guesses">
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </>
      ) : null}

      {error ? <p className="err">{error}</p> : null}

      <div className="actions">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : `Save as version ${nextVersionNo}`}
        </button>
        <button className="link" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
