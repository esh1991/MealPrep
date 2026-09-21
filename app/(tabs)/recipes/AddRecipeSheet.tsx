"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Sheet from "@/components/Sheet";
import { MacroStrip } from "@/components/Macros";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { createRecipe, createRecipeFromDraft } from "@/lib/supabase/mutations";
import { prepareImage, type PreparedImage } from "@/lib/structure/image";
import type { NormalizedDraft } from "@/lib/structure/normalize";
import { MEALS, formatQty, type MealType } from "@/lib/domain";

const EXAMPLE =
  "turkey chili we liked last winter. 2.5 lb ground turkey, 1 onion, 2 peppers, a couple cans crushed tomatoes, 1 can black beans (went light on beans), chili powder like 2 tbsp, cumin 1 tbsp. brown turkey w onion + peppers, add spices, then tomatoes and beans, simmer 30 min. makes about 6";

type Mode = null | "photo" | "notes" | "manual" | "loading" | "review" | "error";

export default function AddRecipeSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const { householdId, memberId, refresh } = useHousehold();

  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Type it in
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("d");

  // Import
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [lastKind, setLastKind] = useState<"photo" | "notes">("notes");
  const [draft, setDraft] = useState<NormalizedDraft | null>(null);
  const abort = useRef<AbortController | null>(null);

  function back() {
    abort.current?.abort();
    setMode(null);
    setError("");
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      setPhoto(await prepareImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That photo couldn't be opened.");
    }
  }

  async function structure(kind: "photo" | "notes") {
    if (kind === "notes" && !notes.trim()) {
      setError("Paste some notes first.");
      return;
    }
    if (kind === "photo" && !photo) {
      setError("Choose a photo first.");
      return;
    }
    setLastKind(kind);
    setError("");
    setMode("loading");

    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(
          kind === "photo"
            ? { kind, image: { mediaType: photo!.mediaType, data: photo!.data } }
            : { kind, notes },
        ),
      });
      const payload = (await response.json()) as { draft?: NormalizedDraft; error?: string };
      if (!response.ok || !payload.draft) {
        setError(payload.error ?? "Couldn't structure that recipe. Try again.");
        setMode("error");
        return;
      }
      setDraft(payload.draft);
      setMode("review");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setMode(kind);
        return;
      }
      setError("Couldn't reach the server. Check your connection and try again.");
      setMode("error");
    } finally {
      abort.current = null;
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    setError("");
    try {
      const id = await createRecipeFromDraft({
        householdId,
        memberId,
        draft,
        sourceKind: lastKind,
      });
      await refresh();
      onClose();
      toast("Saved to recipes");
      router.push(`/recipes/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the recipe.");
      setSaving(false);
    }
  }

  async function saveManual() {
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

  // ---- the review screen ----------------------------------------------
  if (mode === "review" && draft) {
    return (
      <Sheet onClose={onClose} label="Check the recipe">
        <h2>Check it over</h2>
        <p className="muted">
          Makes {draft.baseServings} servings. Fix anything that looks off, then save.
        </p>

        <div className="field">
          <label htmlFor="draft-name">Name</label>
          <input
            id="draft-name"
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        <span className="flabel">Usually eaten at</span>
        <div className="segs">
          {MEALS.map((m) => (
            <button
              key={m.k}
              className={`seg ${draft.type === m.k ? "on" : ""}`}
              aria-pressed={draft.type === m.k}
              onClick={() => setDraft({ ...draft, type: m.k })}
            >
              {m.n}
            </button>
          ))}
        </div>

        <span className="flabel">Per serving</span>
        {draft.cal ? <MacroStrip macros={draft} /> : <p className="empty">No macro estimate.</p>}

        {draft.guesses.length ? (
          <>
            <span className="flabel">Guesses to check</span>
            <ul className="guesses">
              {draft.guesses.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </>
        ) : null}

        <span className="flabel">Ingredients</span>
        <ul className="ing">
          {draft.ingredients.map((x, i) => (
            <li key={`${x.name}-${i}`}>
              <span className="q">{formatQty(x.qty, x.unit)}</span>
              <span>{x.name}</span>
            </li>
          ))}
        </ul>

        {draft.steps.length ? (
          <>
            <span className="flabel">Steps</span>
            <ol className="steps" style={{ marginTop: 0 }}>
              {draft.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </>
        ) : null}

        {error ? <p className="err">{error}</p> : null}

        <div className="actions">
          <button className="btn" onClick={() => void saveDraft()} disabled={saving}>
            {saving ? "Saving…" : "Save to recipes"}
          </button>
          <button className="link" onClick={() => setMode(null)}>
            Start over
          </button>
        </div>
      </Sheet>
    );
  }

  if (mode === "loading") {
    return (
      <Sheet onClose={onClose} label="Reading the recipe">
        <div className="loading">
          <span className="spin" />
          <div>
            <strong>Reading your recipe</strong>
            <p className="muted">
              Working out ingredients, amounts and steps, then estimating the macros. This can take
              up to a minute.
            </p>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => abort.current?.abort()}>
            Stop
          </button>
        </div>
      </Sheet>
    );
  }

  if (mode === "error") {
    return (
      <Sheet onClose={onClose} label="That didn't work">
        <h2>That didn&apos;t work</h2>
        <p className="muted">{error}</p>
        <div className="actions">
          <button className="btn" onClick={() => void structure(lastKind)}>
            Try again
          </button>
          <button className="link" onClick={() => setMode(lastKind)}>
            Change the {lastKind === "photo" ? "photo" : "notes"}
          </button>
        </div>
      </Sheet>
    );
  }

  if (mode === "photo") {
    return (
      <Sheet onClose={onClose} label="Snap a photo">
        <h2>Snap a photo</h2>
        <p className="muted">
          Get the ingredient list and the steps in frame. Handwriting works if it is legible.
        </p>

        <label className="photo-drop" htmlFor="recipe-photo">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.previewUrl} alt="The photo you chose" />
          ) : (
            <span className="photo-empty">
              <strong>Take or choose a photo</strong>
              <small>Tap here</small>
            </span>
          )}
        </label>
        <input
          id="recipe-photo"
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />

        {error ? <p className="err">{error}</p> : null}

        <div className="actions">
          <button className="btn" onClick={() => void structure("photo")} disabled={!photo}>
            Turn it into a recipe
          </button>
          <button className="link" onClick={back}>
            Back
          </button>
        </div>
      </Sheet>
    );
  }

  if (mode === "notes") {
    return (
      <Sheet onClose={onClose} label="Paste a word dump">
        <h2>Paste a word dump</h2>
        <p className="muted">Ingredients, amounts and steps in any order. Shorthand is fine.</p>

        <div className="field">
          <label htmlFor="recipe-notes">Recipe notes</label>
          <textarea
            id="recipe-notes"
            rows={8}
            placeholder="2 lb chicken thighs, yogurt, garam masala, lots of garlic, roast 425 for 25 min…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button className="link" onClick={() => setNotes(EXAMPLE)}>
          Fill in an example
        </button>

        {error ? <p className="err">{error}</p> : null}

        <div className="actions">
          <button className="btn" onClick={() => void structure("notes")}>
            Turn it into a recipe
          </button>
          <button className="link" onClick={back}>
            Back
          </button>
        </div>
      </Sheet>
    );
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
          <button className="btn" onClick={() => void saveManual()} disabled={saving}>
            {saving ? "Creating…" : "Create recipe"}
          </button>
          <button className="link" onClick={back}>
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
        <button className="opt" onClick={() => setMode("photo")}>
          <span />
          <span>
            <strong>Snap a photo</strong>
            <small>A cookbook page, screenshot or recipe card.</small>
          </span>
        </button>
        <button className="opt" onClick={() => setMode("notes")}>
          <span />
          <span>
            <strong>Paste a word dump</strong>
            <small>Messy notes are fine. It gets structured for you.</small>
          </span>
        </button>
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
            <strong>Paste a link</strong>
            <small>Coming later.</small>
          </span>
        </button>
      </div>
    </Sheet>
  );
}
