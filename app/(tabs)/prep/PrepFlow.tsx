"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmSheet from "@/components/ConfirmSheet";
import { StepBar, StepFooter, type Step } from "@/components/Steps";
import WeekPicker from "@/components/WeekPicker";
import { useHousehold } from "@/lib/household/context";
import { resetWeek } from "@/lib/supabase/weekMutations";
import {
  batches,
  buyItems,
  gapCount,
  prepSummary,
  relativeWeek,
  totals,
  weekRange,
} from "@/lib/domain";
import EatingGrid from "./EatingGrid";
import MenuView from "./MenuView";
import ShopStep from "./ShopStep";
import CookStep from "./CookStep";

// The whole ritual, in the order it happens: work out how many meals,
// choose what fills them, buy it, cook it.
type StepKey = "eating" | "menu" | "shop" | "cook";

function isStep(v: string | null): v is StepKey {
  return v === "eating" || v === "menu" || v === "shop" || v === "cook";
}

export default function PrepFlow() {
  const household = useHousehold();
  const { selectedWeek, selectedWeekStart, members, today, refresh } = household;
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<StepKey>(isStep(params.get("step")) ? (params.get("step") as StepKey) : "eating");
  const [resetting, setResetting] = useState(false);

  if (!selectedWeek) {
    return (
      <>
        <header className="top">
          <h1>Prep</h1>
        </header>
        <WeekPicker />
        <p className="empty">Setting up that week…</p>
      </>
    );
  }

  const count = totals(selectedWeek, members);
  const gaps = gapCount(selectedWeek, members);
  const items = buyItems(selectedWeek, household);
  const toBuy = items.filter((i) => !i.checked).length;
  const cooking = prepSummary(selectedWeek, household);
  const hasBatches = batches(selectedWeek, household).length > 0;

  const steps: Step<StepKey>[] = [
    { key: "eating", label: "Eating", done: count.all > 0 },
    { key: "menu", label: "Menu", done: count.all > 0 && gaps === 0 },
    { key: "shop", label: "Shop", done: items.length > 0 && toBuy === 0 },
    { key: "cook", label: "Cook", done: hasBatches && cooking.done === cooking.total },
  ];

  const offSlots = selectedWeek.slots.filter((slot) => !slot.eating).length;
  const willClear = [
    selectedWeek.picks.length ? `${selectedWeek.picks.length} recipes on the menu` : "",
    offSlots ? `${offSlots} meals you switched off` : "",
    selectedWeek.extras.length ? `${selectedWeek.extras.length} added to the list` : "",
    selectedWeek.pantryChecks.length ? `${selectedWeek.pantryChecks.length} pantry answers` : "",
    Object.values(selectedWeek.prepDone).filter(Boolean).length
      ? `${Object.values(selectedWeek.prepDone).filter(Boolean).length} prepped batches`
      : "",
  ].filter(Boolean);

  return (
    <>
      <header className="top">
        <h1>Prep</h1>
        <p className="sub">{relativeWeek(selectedWeekStart, today)}</p>
      </header>

      <WeekPicker />
      <StepBar steps={steps} current={step} onSelect={setStep} />

      {step === "eating" ? (
        <>
          <EatingGrid week={selectedWeek} />
          <StepFooter
            hint={
              count.all
                ? `${count.all} meals to cover. Now choose what fills them.`
                : "Nobody is eating at home this week. Tap the names above to add meals back."
            }
            action="Next: pick the menu"
            onAction={() => setStep("menu")}
            tone={count.all ? "ok" : "warn"}
          />
        </>
      ) : null}

      {step === "menu" ? (
        <>
          <MenuView week={selectedWeek} onOpenMacros={() => router.push("/insights")} />
          <StepFooter
            hint={
              gaps
                ? `${gaps} ${gaps === 1 ? "meal still needs" : "meals still need"} a recipe. The list will be short without them.`
                : "Every meal has a recipe. The shopping list is built from this."
            }
            action="Next: the shopping list"
            onAction={() => setStep("shop")}
            tone={gaps ? "warn" : "ok"}
          />
        </>
      ) : null}

      {step === "shop" ? (
        <ShopStep week={selectedWeek} onOpenMenu={() => setStep("menu")} onDone={() => setStep("cook")} />
      ) : null}

      {step === "cook" ? <CookStep week={selectedWeek} onOpenMenu={() => setStep("menu")} /> : null}

      <div className="reset">
        <button onClick={() => setResetting(true)}>Reset this week</button>
      </div>

      {resetting ? (
        <ConfirmSheet
          title={`Reset ${relativeWeek(selectedWeekStart, today).toLowerCase()}?`}
          confirmLabel="Reset the week"
          onClose={() => setResetting(false)}
          onConfirm={async () => {
            await resetWeek(selectedWeek.id, selectedWeek.startDate);
            await refresh();
          }}
          body={
            <>
              <p className="muted">
                {weekRange(selectedWeekStart)} goes back to everyone eating every meal, with nothing
                picked.
              </p>
              {willClear.length ? (
                <>
                  <span className="flabel">This clears</span>
                  <ul className="guesses">
                    {willClear.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="fine">There is nothing in this week yet, so nothing will be lost.</p>
              )}
              <p className="fine">
                Your recipes and both pantry lists are household data and are left alone. Other weeks
                are untouched.
              </p>
            </>
          }
        />
      ) : null}
    </>
  );
}
