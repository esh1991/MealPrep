"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ByDayChart from "@/components/ByDayChart";
import { MacroBar } from "@/components/Macros";
import WeekPicker from "@/components/WeekPicker";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { createClient } from "@/lib/supabase/client";
import { loadWeekSummaries } from "@/lib/supabase/summaries";
import { swapPick } from "@/lib/supabase/weekMutations";
import {
  dailyAverage,
  macroWeek,
  ratingCounts,
  recipeUsage,
  relativeWeek,
  shortDate,
  sortedMembers,
  splitOf,
  swapTip,
  weekLabel,
  weekPoints,
  type WeekSummary,
} from "@/lib/domain";

const n0 = (v: number) => Number(v || 0).toLocaleString("en-US");

export default function InsightsScreen() {
  const household = useHousehold();
  const { members, settings, selectedWeek, selectedWeekStart, today, recipes, versions, refresh } =
    household;
  const toast = useToast();
  const [summaries, setSummaries] = useState<WeekSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Read across every planned week once, for the sections below the fold.
  useEffect(() => {
    let cancelled = false;
    void loadWeekSummaries(createClient()).then((rows) => {
      if (!cancelled) setSummaries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedWeek]);

  const mw = selectedWeek ? macroWeek(selectedWeek, household) : null;
  const split = mw ? splitOf(mw.tot) : { p: 0, c: 0, f: 0 };
  const label = weekLabel(split, settings.macroThresholds);
  const tip = selectedWeek ? swapTip(selectedWeek, household) : null;
  const people = sortedMembers(members);

  async function swap() {
    if (!tip) return;
    setBusy(true);
    try {
      await swapPick(tip.pickId, tip.to.recipe.id, tip.to.version.id);
      await refresh();
      toast(`Swapped in ${tip.to.recipe.name}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="top">
        <h1>Insights</h1>
        <p className="sub">How the weeks are balancing out</p>
      </header>

      <WeekPicker />

      {mw?.tot.n ? (
        <>
          <section className="section">
            <div className="balance">
              <h2>{label.title}</h2>
              <span>{relativeWeek(selectedWeekStart, today)}</span>
            </div>
            <p className="muted" style={{ marginBottom: 12 }}>
              {label.detail}
            </p>
            <div className="split-big" style={{ margin: "4px 0 12px" }}>
              <div className="bp">
                <strong>{split.p}%</strong>
                <span>protein</span>
              </div>
              <div className="bc">
                <strong>{split.c}%</strong>
                <span>carbs</span>
              </div>
              <div className="bf">
                <strong>{split.f}%</strong>
                <span>fat</span>
              </div>
            </div>
            <MacroBar split={split} />
            <p className="fine">Meals eaten out aren&apos;t counted.</p>
          </section>

          <section className="section">
            <h2>Daily average at home</h2>
            <div className="daytot">
              {people.map((p) => {
                const a = dailyAverage(mw.per[p.id]);
                return (
                  <div key={p.id}>
                    <span className="tape sm">{p.name}</span>
                    <strong>{n0(a.cal)} cal</strong>
                    <small>
                      <b className="tp">P</b> {a.protein} g <b className="tc">C</b> {a.carbs} g{" "}
                      <b className="tf">F</b> {a.fat} g
                    </small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="section">
            <h2>Calories by day</h2>
            <ByDayChart macros={mw} members={members} />
          </section>

          {tip ? (
            <section className="note ice">
              <h2>Want to lean more protein?</h2>
              <p>
                {tip.from.recipe.name} has the most carbs on this menu, {tip.from.version.carbs} g a
                serving. {tip.to.recipe.name} has {tip.to.version.carbs} g carbs and{" "}
                {tip.to.version.protein} g protein.
              </p>
              <button className="btn small" onClick={() => void swap()} disabled={busy}>
                Swap it in
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <section className="section">
          <p className="empty">Nothing on the menu for this week yet.</p>
          <div className="actions">
            <Link className="btn" href="/prep?step=menu">
              Pick the menu
            </Link>
          </div>
        </section>
      )}

      <ProteinTrend summaries={summaries} versions={versions} today={today} />
      <Library summaries={summaries} recipes={recipes} today={today} />
    </>
  );
}

/** Protein share of every week planned so far, so a drift is visible. */
function ProteinTrend({
  summaries,
  versions,
  today,
}: {
  summaries: WeekSummary[] | null;
  versions: ReturnType<typeof useHousehold>["versions"];
  today: string;
}) {
  if (!summaries) return null;
  const points = weekPoints(summaries, versions).filter((p) => p.portions > 0);
  if (points.length < 2) {
    return (
      <section className="section">
        <h2>Across weeks</h2>
        <p className="empty">
          Plan another week and the protein share starts charting here, so you can see which way it
          is drifting.
        </p>
      </section>
    );
  }

  const max = Math.max(...points.map((p) => p.split.p), 45);
  return (
    <section className="section">
      <h2>Protein share across weeks</h2>
      <ul className="trend">
        {points.map((p) => (
          <li key={p.startDate}>
            <span className="t-week">{shortDate(p.startDate)}</span>
            <span className="t-track">
              <span className="t-fill" style={{ width: `${Math.round((p.split.p / max) * 100)}%` }} />
            </span>
            <span className="t-val">{p.split.p}%</span>
          </li>
        ))}
      </ul>
      <p className="fine">
        Share of planned calories coming from protein. Today is {shortDate(today)}.
      </p>
    </section>
  );
}

/** What actually gets cooked, and what has been sitting unused. */
function Library({
  summaries,
  recipes,
  today,
}: {
  summaries: WeekSummary[] | null;
  recipes: ReturnType<typeof useHousehold>["recipes"];
  today: string;
}) {
  if (!summaries) return null;
  const usage = recipeUsage(summaries, recipes);
  const counts = ratingCounts(recipes);
  const cooked = usage.filter((u) => u.portions > 0).slice(0, 5);
  const idle = usage.filter((u) => u.portions === 0);

  return (
    <>
      <section className="section">
        <h2>Your library</h2>
        <ul className="fridge">
          <li>
            <strong>{recipes.length}</strong>
            <span>recipes</span>
          </li>
          <li>
            <strong>{counts.keeper}</strong>
            <span>keepers</span>
          </li>
          <li>
            <strong>{counts.good}</strong>
            <span>good</span>
          </li>
          <li>
            <strong>{counts.work}</strong>
            <span>need work</span>
          </li>
        </ul>
      </section>

      {cooked.length ? (
        <section className="section">
          <h2>Cooked most</h2>
          <ul className="wk">
            {cooked.map((u) => (
              <li key={u.recipe.id}>
                <span className="d">{u.portions}</span>
                <span className="dishes">
                  <Link href={`/recipes/${u.recipe.id}`}>{u.recipe.name}</Link>
                </span>
                <span className="cans">
                  <b>{u.weeks}</b>
                  {u.weeks === 1 ? "week" : "weeks"}
                </span>
              </li>
            ))}
          </ul>
          <p className="fine">Portions cooked since you started planning in the app.</p>
        </section>
      ) : null}

      {idle.length ? (
        <section className="section">
          <h2>Never cooked yet</h2>
          <p className="muted" style={{ marginBottom: 10 }}>
            {idle.length} {idle.length === 1 ? "recipe has" : "recipes have"} never made it onto a
            menu. As of {shortDate(today)}.
          </p>
          <ul className="rows">
            {idle.slice(0, 8).map((u) => (
              <li key={u.recipe.id}>
                <Link className="row" href={`/recipes/${u.recipe.id}`}>
                  <span className="row-main">
                    <span className="row-title">{u.recipe.name}</span>
                    <span className="row-meta">{u.recipe.rating === "work" ? "Needs work" : "Untried"}</span>
                  </span>
                  <span className="chev" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
