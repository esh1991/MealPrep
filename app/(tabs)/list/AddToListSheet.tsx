"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { addExtra, removeExtra } from "@/lib/supabase/listMutations";
import type { Week } from "@/lib/domain";

const QUICK_PICKS = ["Bananas", "Coffee", "Avocados", "Sparkling water", "Freezer bags", "Dish soap"];

/** The Add to list sheet (LIST-8), reached from the list and from home. */
export default function AddToListSheet({ week, onClose }: { week: Week; onClose: () => void }) {
  const toast = useToast();
  const { memberId, refresh } = useHousehold();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (week.extras.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
      toast("Already on the list");
      return;
    }
    setBusy(true);
    try {
      await addExtra(week.id, memberId, trimmed);
      await refresh();
      setName("");
      toast(`Added ${trimmed}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await removeExtra(id, week.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet onClose={onClose} label="Add to the list">
      <h2>Add to the list</h2>
      <p className="muted">Anything you think of. It shows up on next week&apos;s shopping list.</p>

      <div className="padd" style={{ marginTop: 14 }}>
        <input
          type="text"
          placeholder="Bananas, dish soap…"
          aria-label="Add an item to the list"
          enterKeyHint="done"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add(name);
            }
          }}
          autoFocus
        />
        <button className="btn small" onClick={() => void add(name)} disabled={busy}>
          Add
        </button>
      </div>

      <span className="flabel">Quick picks</span>
      <div className="pchips" style={{ marginTop: 0 }}>
        {QUICK_PICKS.map((p) => (
          <button key={p} className="chip" onClick={() => void add(p)} disabled={busy}>
            {p}
          </button>
        ))}
      </div>

      {week.extras.length ? (
        <>
          <span className="flabel">Added so far</span>
          <ul className="shop">
            {week.extras.map((e) => (
              <li className="sitem" key={e.id}>
                <span className="sname" style={{ flex: 1, padding: "9px 0" }}>
                  {e.name}
                  <small>{e.aisle}</small>
                </span>
                <button
                  className="xbtn"
                  onClick={() => void remove(e.id)}
                  aria-label={`Remove ${e.name}`}
                  disabled={busy}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Sheet>
  );
}
