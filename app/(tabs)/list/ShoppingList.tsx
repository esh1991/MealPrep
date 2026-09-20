"use client";

import { useState } from "react";
import Check from "@/components/Check";
import { useToast } from "@/components/Toast";
import { useHousehold } from "@/lib/household/context";
import { addExtra, removeExtra, setListChecked } from "@/lib/supabase/listMutations";
import {
  buyItems,
  gaps,
  groupByAisle,
  listAsText,
  mealPlural,
  type ListItem,
  type Week,
} from "@/lib/domain";

export default function ShoppingList({ week, onOpenMenu }: { week: Week; onOpenMenu: () => void }) {
  const household = useHousehold();
  const { members, memberId, refresh } = household;
  const toast = useToast();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  // Crossing off feels instant; the refetch reconciles a moment later.
  const [checks, setChecks] = useState(week.listChecks);
  const [syncedTo, setSyncedTo] = useState(week);
  if (syncedTo !== week) {
    setSyncedTo(week);
    setChecks(week.listChecks);
  }

  const items = buyItems({ ...week, listChecks: checks }, household);
  const missing = gaps(week, members);
  const got = items.filter((i) => i.checked).length;
  const toBuy = items.length - got;

  function toggle(item: ListItem) {
    const next = !checks[item.key];
    setChecks((prev) => ({ ...prev, [item.key]: next }));
    void setListChecked(week.id, item.key, next).then(refresh);
  }

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (week.extras.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) {
      toast("Already on the list");
      return;
    }
    setBusy(true);
    try {
      const aisle = await addExtra(week.id, memberId, trimmed);
      await refresh();
      setName("");
      toast(`Added ${trimmed} to ${aisle}`);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ListItem) {
    if (!item.extraId) return;
    setBusy(true);
    try {
      await removeExtra(item.extraId, week.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    const text = listAsText(items);
    if (!text) {
      toast("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("List copied");
    } catch {
      toast("Couldn't copy. Select the list and copy by hand.");
    }
  }

  return (
    <>
      {missing.length ? (
        <div className="note alert">
          <p>
            {missing.map((g) => `${g.missing} ${mealPlural(g.meal)}`).join(" and ")} still need a recipe.
          </p>
          <button className="link" onClick={onOpenMenu}>
            Open menu
          </button>
        </div>
      ) : null}

      <div className="padd quickadd">
        <input
          type="text"
          placeholder="Add anything, like bananas"
          aria-label="Add an item to the list"
          enterKeyHint="done"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
        />
        <button className="btn small" onClick={() => void add()} disabled={busy}>
          Add
        </button>
      </div>

      {items.length ? (
        <>
          <p className="lede">
            {toBuy} to buy{got ? `, ${got} crossed off` : ""}. Tap an item to cross it off.
          </p>

          {groupByAisle(items).map((group) => (
            <section className="block" key={group.aisle}>
              <h2 className="aisle">{group.aisle}</h2>
              <ul className="shop">
                {group.items.map((item) => (
                  <li className={`sitem ${item.checked ? "got" : ""}`} key={item.key}>
                    <button
                      className={`sbtn ${item.qtyLabel ? "" : "noq"}`}
                      aria-pressed={item.checked}
                      onClick={() => toggle(item)}
                    >
                      <span className="sbox">
                        <Check />
                      </span>
                      {item.qtyLabel ? <span className="sq">{item.qtyLabel}</span> : null}
                      <span className="sname">
                        {item.name}
                        <small>{item.from}</small>
                      </span>
                    </button>
                    {item.extra ? (
                      <button
                        className="xbtn"
                        onClick={() => void remove(item)}
                        aria-label={`Remove ${item.name}`}
                        disabled={busy}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      ) : (
        <p className="empty">The list is empty. Pick a menu or add something above.</p>
      )}

      <div className="actions">
        <button className="btn" onClick={() => void copy()} disabled={!toBuy}>
          Copy {toBuy} items
        </button>
      </div>
      <p className="fine">
        Copy pastes the list grouped by aisle, leaving out anything crossed off. Sending straight to
        Instacart is parked for now.
      </p>
    </>
  );
}
