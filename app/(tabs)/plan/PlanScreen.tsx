"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHousehold } from "@/lib/household/context";
import { weekRange } from "@/lib/domain";
import EatingGrid from "./EatingGrid";
import MenuView from "./MenuView";
import MacrosView from "./MacrosView";

const VIEWS = [
  ["eating", "Who's eating"],
  ["menu", "Menu"],
  ["macros", "Macros"],
] as const;

type View = (typeof VIEWS)[number][0];

function isView(v: string | null): v is View {
  return v === "eating" || v === "menu" || v === "macros";
}

export default function PlanScreen() {
  const { planningWeek } = useHousehold();
  const params = useSearchParams();
  const initial = params.get("view");
  const [view, setView] = useState<View>(isView(initial) ? initial : "eating");

  if (!planningWeek) {
    return (
      <>
        <header className="top">
          <h1>Next week</h1>
        </header>
        <p className="empty">
          Next week isn&apos;t set up yet. Reload the page and it will be created.
        </p>
      </>
    );
  }

  return (
    <>
      <header className="top">
        <h1>Next week</h1>
        <p className="sub">{weekRange(planningWeek.startDate)}</p>
      </header>

      <div className="segnav" role="tablist">
        {VIEWS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            className={view === key ? "on" : ""}
            aria-selected={view === key}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "eating" ? <EatingGrid week={planningWeek} /> : null}
      {view === "menu" ? <MenuView week={planningWeek} onOpenMacros={() => setView("macros")} /> : null}
      {view === "macros" ? <MacrosView week={planningWeek} onOpenMenu={() => setView("menu")} /> : null}
    </>
  );
}
