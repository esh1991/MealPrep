"use client";

import { useState } from "react";
import { StepFooter } from "@/components/Steps";
import { useHousehold } from "@/lib/household/context";
import { buyItems, type Week } from "@/lib/domain";
import ShoppingList from "./shop/ShoppingList";
import PantryCheck from "./shop/PantryCheck";
import Staples from "./shop/Staples";

type Section = "buy" | "check" | "staples";

const SECTIONS: [Section, string][] = [
  ["buy", "Shopping list"],
  ["check", "Pantry check"],
  ["staples", "Staples"],
];

/**
 * Buying the week. The pantry check comes first in principle, but the list
 * is what you open at the shop, so that is what this lands on.
 */
export default function ShopStep({
  week,
  onOpenMenu,
  onDone,
}: {
  week: Week;
  onOpenMenu: () => void;
  onDone: () => void;
}) {
  const household = useHousehold();
  const [section, setSection] = useState<Section>("buy");
  const items = buyItems(week, household);
  const toBuy = items.filter((i) => !i.checked).length;

  return (
    <>
      <div className="segnav" role="tablist">
        {SECTIONS.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            className={section === key ? "on" : ""}
            aria-selected={section === key}
            onClick={() => setSection(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "buy" ? <ShoppingList week={week} onOpenMenu={onOpenMenu} /> : null}
      {section === "check" ? (
        <PantryCheck week={week} onOpenStaples={() => setSection("staples")} />
      ) : null}
      {section === "staples" ? <Staples /> : null}

      <StepFooter
        hint={
          toBuy
            ? `${toBuy} still to buy. Cross items off as they arrive.`
            : items.length
              ? "Everything is crossed off. Time to cook."
              : "Nothing on the list yet. Pick a menu first."
        }
        action="Next: cook it"
        onAction={onDone}
        tone={toBuy ? "warn" : "ok"}
      />
    </>
  );
}
