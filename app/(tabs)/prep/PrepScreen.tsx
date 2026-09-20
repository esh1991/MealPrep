"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Check from "@/components/Check";
import { useHousehold } from "@/lib/household/context";
import { setPrepDone } from "@/lib/supabase/weekMutations";
import {
  DAYS,
  batches,
  mealName,
  prepDate,
  prepSummary,
  shortDate,
  weekRange,
  type Batch,
  type Method,
} from "@/lib/domain";

const METHODS: { k: Method; n: string; note: string }[] = [
  { k: "oven", n: "Oven", note: "Heat the oven first and run the sheet pans side by side." },
  { k: "stove", n: "Stovetop", note: "Start these once the oven is going." },
  { k: "nocook", n: "No-cook", note: "Assemble last, while everything else cools." },
];

export default function PrepScreen() {
  const household = useHousehold();
  const { planningWeek, settings, refresh } = household;
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const header = (
    <header className="top">
      <h1>Prep day</h1>
      {planningWeek ? (
        <p className="sub">
          {settings.prepDay} {shortDate(prepDate(planningWeek.startDate, settings.prepDay))}, for{" "}
          {weekRange(planningWeek.startDate)}
        </p>
      ) : null}
    </header>
  );

  if (!planningWeek) {
    return (
      <>
        {header}
        <p className="empty">Next week isn&apos;t set up yet. Open Plan first.</p>
      </>
    );
  }

  const all = batches(planningWeek, household);
  if (!all.length) {
    return (
      <>
        {header}
        <p className="empty">Nothing to prep yet.</p>
        <div className="actions">
          <button className="btn" onClick={() => router.push("/plan?view=menu")}>
            Pick the menu
          </button>
        </div>
      </>
    );
  }

  const summary = prepSummary(planningWeek, household);

  async function toggle(batch: Batch, done: boolean) {
    if (!planningWeek) return;
    setBusy(true);
    try {
      await setPrepDone(planningWeek.id, batch.pick.id, done);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {header}

      <div
        className="meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={summary.total}
        aria-valuenow={summary.done}
        aria-label="Batches done"
      >
        <span style={{ width: `${Math.round((summary.done / summary.total) * 100)}%` }} />
      </div>
      <div className="prep-facts">
        <span>
          <strong>
            {summary.done} of {summary.total}
          </strong>{" "}
          batches done
        </span>
        <span>
          <strong>{summary.containers}</strong> containers
        </span>
        <span>
          <strong>{summary.frozen}</strong> to freeze
        </span>
      </div>

      {METHODS.map((method) => {
        const list = all.filter((b) => b.recipe.method === method.k);
        if (!list.length) return null;
        return (
          <section className="method" key={method.k}>
            <h2>{method.n}</h2>
            <p>{method.note}</p>
            <ul className="batches">
              {list.map((b) => {
                const done = !!planningWeek.prepDone[b.pick.id];
                return (
                  <li className={`batch ${done ? "done" : ""}`} key={b.pick.id}>
                    <button
                      className="check"
                      aria-pressed={done}
                      aria-label={`Mark ${b.recipe.name} done`}
                      disabled={busy}
                      onClick={() => void toggle(b, !done)}
                    >
                      <Check />
                    </button>
                    <div className="batch-body">
                      <Link className="link-title" href={`/recipes/${b.recipe.id}`}>
                        {b.recipe.name}
                      </Link>
                      <p className="row-meta">
                        {mealName(b.meal)}, {b.portions} servings (recipe ×{b.multiple})
                      </p>
                      <div className="labels">
                        {DAYS.filter((d) => b.days[d]).map((d) =>
                          settings.freezeDays.includes(d) ? (
                            <span className="tape ice" key={d}>
                              {d} ×{b.days[d]}, freeze
                            </span>
                          ) : (
                            <span className="tape" key={d}>
                              {d} ×{b.days[d]}
                            </span>
                          ),
                        )}
                        {b.extra > 0 ? <span className="tape">Extra ×{b.extra}</span> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
