"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { updateRecipeDetails } from "@/lib/supabase/mutations";
import { MEALS, type MealType, type Recipe } from "@/lib/domain";

/**
 * The recipe's name, the meal it is usually eaten at, and where it came
 * from. None of this is versioned: it describes the recipe rather than the
 * version of it you cook, so changing it does not create a new version.
 */
export default function EditRecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const toast = useToast();
  const { refresh } = useHousehold();
  const [name, setName] = useState(recipe.name);
  const [type, setType] = useState<MealType>(recipe.type);
  const [source, setSource] = useState(recipe.sourceRef);
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
      await updateRecipeDetails(recipe.id, { name, type, sourceRef: source });
      await refresh();
      onClose();
      toast("Details saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the details.");
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose} label={`Edit ${recipe.name}`}>
      <h2>Recipe details</h2>
      <p className="muted">
        This does not create a new version. Quantities, steps and macros live under Save a tweak.
      </p>

      <div className="field">
        <label htmlFor="edit-name">Name</label>
        <input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
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
      <p className="fine">Only sorts the library and the menu picker. Any recipe can go in any meal.</p>

      <div className="field">
        <label htmlFor="edit-source">Where it came from</label>
        <input
          id="edit-source"
          type="text"
          placeholder="Your own recipe"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      {error ? <p className="err">{error}</p> : null}

      <div className="actions">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save details"}
        </button>
        <button className="link" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
