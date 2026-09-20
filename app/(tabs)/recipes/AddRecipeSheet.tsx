"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Sheet from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { createRecipe } from "@/lib/supabase/mutations";
import { MEALS, type MealType } from "@/lib/domain";

type Mode = null | "manual";

export default function AddRecipeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { householdId, memberId, refresh } = useHousehold();
  const [mode, setMode] = useState<Mode>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("d");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError("Give the recipe a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const id = await createRecipe({ householdId, memberId, name, type });
      await refresh();
      onClose();
      toast("Recipe created");
      router.push(`/recipes/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the recipe.");
      setSaving(false);
    }
  }

  if (mode === "manual") {
    return (
      <Sheet onClose={onClose} label="Type in a recipe">
        <h2>Type it in</h2>
        <div className="field">
          <label htmlFor="r-name">Recipe name</label>
          <input
            id="r-name"
            type="text"
            placeholder="Sunday lentil soup"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <span className="flabel">Usually eaten at</span>
        <div className="segs">
          {MEALS.map((m) => (
            <button
              key={m.k}
              className={`seg ${type === m.k ? "on" : ""}`}
              aria-pressed={type === m.k}
              onClick={() => setType(m.k)}
            >
              {m.n}
            </button>
          ))}
        </div>
        <p className="fine">
          Just a starting point for sorting and searching. Any recipe can go in any meal.
        </p>
        <p className="fine">Ingredients and macros come next, with Save a tweak.</p>
        {error ? <p className="err">{error}</p> : null}
        <div className="actions">
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? "Creating…" : "Create recipe"}
          </button>
          <button className="link" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose} label="Add a recipe">
      <h2>Add a recipe</h2>
      <div className="opts">
        <button className="opt" onClick={() => setMode("manual")}>
          <span />
          <span>
            <strong>Type it in</strong>
            <small>Start from a blank recipe.</small>
          </span>
        </button>
        <button className="opt" disabled>
          <span />
          <span>
            <strong>Snap a photo</strong>
            <small>Coming in Phase 7.</small>
          </span>
        </button>
        <button className="opt" disabled>
          <span />
          <span>
            <strong>Paste a word dump</strong>
            <small>Coming in Phase 7.</small>
          </span>
        </button>
        <button className="opt" disabled>
          <span />
          <span>
            <strong>Paste a link</strong>
            <small>Coming in v1.1.</small>
          </span>
        </button>
      </div>
    </Sheet>
  );
}
