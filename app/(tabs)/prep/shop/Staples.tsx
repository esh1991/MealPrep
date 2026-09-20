"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { addToPantryList, setPantryStatus } from "@/lib/supabase/listMutations";
import type { PantryStatus } from "@/lib/domain";

type ListKind = Exclude<PantryStatus, "none">;

const LISTS: { kind: ListKind; title: string; note: string; placeholder: string }[] = [
  {
    kind: "staple",
    title: "Always have",
    note: "Never added to the list.",
    placeholder: "Add a staple",
  },
  {
    kind: "usual",
    title: "Usually have",
    note: "Asked about in the pantry check each week.",
    placeholder: "Add an item",
  },
];

export default function Staples() {
  const toast = useToast();
  const { householdId, ingredients, refresh } = useHousehold();
  const [drafts, setDrafts] = useState<Record<ListKind, string>>({ staple: "", usual: "" });
  const [busy, setBusy] = useState(false);

  async function add(kind: ListKind) {
    const name = drafts[kind].trim();
    if (!name) return;
    const already = ingredients.find(
      (i) => i.name.toLowerCase() === name.toLowerCase() && i.pantryStatus !== "none",
    );
    if (already) {
      toast("Already on a pantry list");
      return;
    }
    setBusy(true);
    try {
      const { matched } = await addToPantryList(householdId, name, kind);
      await refresh();
      setDrafts((prev) => ({ ...prev, [kind]: "" }));
      toast(matched ? `Linked ${name}` : `Added ${name}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(ingredientId: string) {
    setBusy(true);
    try {
      await setPantryStatus(ingredientId, "none");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="lede">These two lists decide what lands on the shopping list.</p>

      {LISTS.map((list) => {
        const items = ingredients.filter((i) => i.pantryStatus === list.kind);
        return (
          <section className="block" key={list.kind}>
            <h2>{list.title}</h2>
            <p className="muted">{list.note}</p>
            <div className="pchips">
              {items.length ? (
                items.map((i) => (
                  <span className="pchip" key={i.id}>
                    {i.name}
                    <button
                      onClick={() => void remove(i.id)}
                      aria-label={`Remove ${i.name}`}
                      disabled={busy}
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <p className="empty">Nothing here yet.</p>
              )}
            </div>
            <div className="padd">
              <input
                type="text"
                placeholder={list.placeholder}
                aria-label={list.placeholder}
                value={drafts[list.kind]}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [list.kind]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void add(list.kind);
                  }
                }}
              />
              <button className="btn small" onClick={() => void add(list.kind)} disabled={busy}>
                Add
              </button>
            </div>
          </section>
        );
      })}

      <p className="fine">
        Adding a name that matches an ingredient you already cook with links to it rather than
        creating a second copy, which is what keeps the list maths right.
      </p>
    </>
  );
}
