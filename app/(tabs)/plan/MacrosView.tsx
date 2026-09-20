"use client";

import { useState } from "react";
import { MacroBar } from "@/components/Macros";
import ByDayChart from "@/components/ByDayChart";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { swapPick } from "@/lib/supabase/weekMutations";
import {
  dailyAverage,
  macroWeek,
  sortedMembers,
  splitOf,
  swapTip,
  weekLabel,
  type Week,
} from "@/lib/domain";

const n0 = (v: number) => Number(v || 0).toLocaleString("en-US");

export default function MacrosView({ week, onOpenMenu }: { week: Week; onOpenMenu: () => void }) {
  const household = useHousehold();
  const { members, settings, refresh } = household;
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const mw = macroWeek(week, household);
  if (!mw.tot.n) {
    return (
      <>
        <p className="empty">No meals on the menu yet.</p>
        <div className="actions">
          <button className="btn" onClick={onOpenMenu}>
            Pick the menu
          </button>
        </div>
      </>
    );
  }

  const split = splitOf(mw.tot);
  const label = weekLabel(split, settings.macroThresholds);
  const people = sortedMembers(members);
  const tip = swapTip(week, household);

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
      <section className="macro-hero">
        <h2>{label.title}</h2>
        <p className="muted">{label.detail}</p>
        <div className="split-big">
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
        <p className="fine">
          Share of calories from everything on next week&apos;s menu. Meals out aren&apos;t counted.
        </p>
      </section>

      <section className="block">
        <h2>Daily average at home</h2>
        <div className="avg" style={{ marginTop: 12 }}>
          {people.map((p) => {
            const a = dailyAverage(mw.per[p.id]);
            return (
              <div key={p.id}>
                <span className="tape sm">{p.name}</span>
                <strong>{n0(a.cal)} cal</strong>
                <span className="row-meta">
                  <b className="tp">P</b> {a.protein} g <b className="tc">C</b> {a.carbs} g{" "}
                  <b className="tf">F</b> {a.fat} g
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2>By day</h2>
        </div>
        <ByDayChart macros={mw} members={members} />
      </section>

      {tip ? (
        <section className="note ice">
          <h2>Want to lean more protein?</h2>
          <p>
            {tip.from.recipe.name} has the most carbs on the menu, {tip.from.version.carbs} g a
            serving. {tip.to.recipe.name} has {tip.to.version.carbs} g carbs and{" "}
            {tip.to.version.protein} g protein.
          </p>
          <button className="btn small" onClick={() => void swap()} disabled={busy}>
            Swap it in
          </button>
        </section>
      ) : null}
    </>
  );
}
