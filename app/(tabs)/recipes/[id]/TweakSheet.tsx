"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { LabelledStepper } from "@/components/Stepper";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { copySteps, saveTweak, type TweakIngredient } from "@/lib/supabase/mutations";
import {
  STEP,
  diffVersions,
  formatQty,
  guessFoodAisle,
  type Recipe,
  type RecipeVersion,
  type Unit,
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

  const [draft, setDraft] = useState<TweakIngredient[]>(() =>
    version.ingredients.map((vi) => ({
      ingredientId: vi.ingredientId,
      name: nameOf(vi.ingredientId),
      qty: vi.qty,
      unit: vi.unit,
    })),
  );
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

  const before = {
    ingredients: version.ingredients.map((vi) => ({
      ingredientId: vi.ingredientId,
      name: nameOf(vi.ingredientId),
      qty: vi.qty,
      unit: vi.unit,
    })),
    cal: version.cal,
    protein: version.protein,
    carbs: version.carbs,
    fat: version.fat,
  };
  const changes = diffVersions(before, { ingredients: draft, ...macros });

  function stepQty(index: number, direction: 1 | -1) {
    setDraft((prev) =>
      prev.map((x, i) => {
        if (i !== index) return x;
        const step = STEP[x.unit] ?? 1;
        return { ...x, qty: Math.max(0, Math.round((x.qty + direction * step) * 100) / 100) };
      }),
    );
    setError("");
  }

  function addIngredient() {
    const name = newName.trim();
    if (!name) return;
    const existing = ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase());
    setDraft((prev) => [
      ...prev,
      {
        ingredientId: existing?.id ?? "",
        name: existing?.name ?? name,
        qty: 1,
        unit: "count" as Unit,
      },
    ]);
    setNewName("");
    // The aisle is guessed when the ingredient is created on save.
    void guessFoodAisle(name);
  }

  async function save() {
    if (!changes.length && !note.trim()) {
      setError("Change a quantity, a macro or write a note first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const newVersionId = await saveTweak({
        householdId,
        recipeId: recipe.id,
        memberId,
        nextVersionNo,
        baseServings: version.baseServings,
        ingredients: draft,
        ...macros,
        note: note.trim() || "Adjusted the recipe.",
        changes,
      });
      await copySteps(version.id, newVersionId);
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

      {draft.length ? (
        <ul className="edit">
          {draft.map((x, i) => {
            const original = version.ingredients.find(
              (vi) => vi.ingredientId === x.ingredientId && vi.unit === x.unit,
            );
            const changed = !original || original.qty !== x.qty;
            return (
              <li key={`${x.ingredientId || x.name}-${i}`} className={`${changed ? "changed" : ""} ${x.qty === 0 ? "gone" : ""}`}>
                <span>{x.name}</span>
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
                setMacros((prev) => ({ ...prev, [key]: Math.max(0, Math.round(Number(e.target.value) || 0)) }))
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
