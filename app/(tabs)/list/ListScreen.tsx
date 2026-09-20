"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WeekPicker from "@/components/WeekPicker";
import { useHousehold } from "@/lib/household/context";
import { weekRange } from "@/lib/domain";
import ShoppingList from "./ShoppingList";
import PantryCheck from "./PantryCheck";
import Staples from "./Staples";

const VIEWS = [
  ["buy", "Shopping list"],
  ["check", "Pantry check"],
  ["staples", "Staples"],
] as const;

type View = (typeof VIEWS)[number][0];

function isView(v: string | null): v is View {
  return v === "buy" || v === "check" || v === "staples";
}

export default function ListScreen() {
  const { selectedWeek } = useHousehold();
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<View>(isView(params.get("view")) ? (params.get("view") as View) : "buy");

  if (!selectedWeek) {
    return (
      <>
        <header className="top">
          <h1>List</h1>
        </header>
        <p className="empty">Setting up that week…</p>
      </>
    );
  }

  return (
    <>
      <header className="top">
        <h1>List</h1>
        <p className="sub">Groceries for {weekRange(selectedWeek.startDate)}</p>
      </header>

      <WeekPicker />

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

      {view === "buy" ? (
        <ShoppingList
          week={selectedWeek}
          onOpenMenu={() => router.push("/plan?view=menu")}
          onOpenPrep={() => router.push("/prep")}
        />
      ) : null}
      {view === "check" ? (
        <PantryCheck week={selectedWeek} onOpenStaples={() => setView("staples")} />
      ) : null}
      {view === "staples" ? <Staples /> : null}
    </>
  );
}
