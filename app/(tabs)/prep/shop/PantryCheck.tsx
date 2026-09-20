"use client";

import { useState } from "react";
import { useHousehold } from "@/lib/household/context";
import { setPantryCheck } from "@/lib/supabase/listMutations";
import { aggregate, formatQty, type Week } from "@/lib/domain";

export default function PantryCheck({ week, onOpenStaples }: { week: Week; onOpenStaples: () => void }) {
  const household = useHousehold();
  const { refresh } = household;
  const [busy, setBusy] = useState(false);

  const a = aggregate(week, household);
  const have = new Set(week.pantryChecks.filter((c) => c.have).map((c) => c.ingredientId));

  async function mark(ingredientId: string, value: boolean) {
    setBusy(true);
    try {
      await setPantryCheck(week.id, ingredientId, value);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="lede">
        Staples are skipped. Mark what&apos;s already in the kitchen so it stays off the list.
      </p>

      <section className="block">
        <div className="block-head">
          <h2>Do you have these?</h2>
        </div>
        {a.check.length ? (
          <ul className="checks">
            {a.check.map((x) => {
              const has = have.has(x.ingredientId);
              return (
                <li key={x.ingredientId}>
                  <span>
                    <span className="row-title">{x.name}</span>
                    <span className="row-meta">Need {formatQty(x.qty, x.unit)}</span>
                  </span>
                  <div className="segs">
                    <button
                      className={`seg ${has ? "on" : ""}`}
                      aria-pressed={has}
                      disabled={busy}
                      onClick={() => void mark(x.ingredientId, true)}
                    >
                      Have it
                    </button>
                    <button
                      className={`seg ${has ? "" : "on"}`}
                      aria-pressed={!has}
                      disabled={busy}
                      onClick={() => void mark(x.ingredientId, false)}
                    >
                      Buy
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">Nothing to check this week.</p>
        )}
      </section>

      <details className="block">
        <summary>Skipped staples ({a.staples.length})</summary>
        <p className="muted">
          {a.staples.map((x) => x.name).join(", ") || "None this week."}
        </p>
        <button className="link" onClick={onOpenStaples}>
          Edit staples
        </button>
      </details>
    </>
  );
}
