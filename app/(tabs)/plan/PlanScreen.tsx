"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StepBar, StepFooter, type Step } from "@/components/Steps";
import WeekPicker from "@/components/WeekPicker";
import { useHousehold } from "@/lib/household/context";
import { gapCount, macroWeek, relativeWeek, totals } from "@/lib/domain";
import EatingGrid from "./EatingGrid";
import MenuView from "./MenuView";
import MacrosView from "./MacrosView";

type View = "eating" | "menu" | "macros";

function isView(v: string | null): v is View {
  return v === "eating" || v === "menu" || v === "macros";
}

export default function PlanScreen() {
  const household = useHousehold();
  const { selectedWeek, selectedWeekStart, members, today } = household;
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<View>(isView(params.get("view")) ? (params.get("view") as View) : "eating");

  if (!selectedWeek) {
    return (
      <>
        <header className="top">
          <h1>Plan</h1>
        </header>
        <WeekPicker />
        <p className="empty">Setting up that week…</p>
      </>
    );
  }

  const count = totals(selectedWeek, members);
  const gaps = gapCount(selectedWeek, members);
  const planned = macroWeek(selectedWeek, household).tot.n > 0;

  const steps: Step<View>[] = [
    { key: "eating", label: "Who's eating", done: count.all > 0 },
    { key: "menu", label: "Menu", done: count.all > 0 && gaps === 0 },
    { key: "macros", label: "Balance", done: planned && gaps === 0 },
  ];

  return (
    <>
      <header className="top">
        <h1>Plan</h1>
        <p className="sub">{relativeWeek(selectedWeekStart, today)}</p>
      </header>

      <WeekPicker />
      <StepBar steps={steps} current={view} onSelect={setView} />

      {view === "eating" ? (
        <>
          <EatingGrid week={selectedWeek} />
          <StepFooter
            hint={
              count.all
                ? `${count.all} meals to cover. Now choose what fills them.`
                : "Nobody is eating at home this week. Tap the names above to add meals back."
            }
            action="Next: pick the menu"
            onAction={() => setView("menu")}
            tone={count.all ? "ok" : "warn"}
          />
        </>
      ) : null}

      {view === "menu" ? (
        <>
          <MenuView week={selectedWeek} onOpenMacros={() => setView("macros")} />
          <StepFooter
            hint={
              gaps
                ? `${gaps} ${gaps === 1 ? "meal still needs" : "meals still need"} a recipe. You can check the balance anyway.`
                : "Every meal has a recipe. See how the week is leaning."
            }
            action="Next: check the balance"
            onAction={() => setView("macros")}
            tone={gaps ? "warn" : "ok"}
          />
        </>
      ) : null}

      {view === "macros" ? (
        <>
          <MacrosView week={selectedWeek} onOpenMenu={() => setView("menu")} />
          <StepFooter
            hint={
              gaps
                ? `${gaps} ${gaps === 1 ? "meal" : "meals"} without a recipe will be missing from the list.`
                : "Happy with it? The shopping list is built from this menu."
            }
            action="Next: build the shopping list"
            onAction={() => router.push("/list")}
            tone={gaps ? "warn" : "ok"}
          />
        </>
      ) : null}
    </>
  );
}
