"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useHousehold } from "@/lib/household/context";
import AddRecipeSheet from "./recipes/AddRecipeSheet";
import AddToListSheet from "./list/AddToListSheet";
import {
  DAY_FULL,
  activeMeals,
  addDays,
  assignments,
  batches,
  buyItems,
  dayOf,
  gapCount,
  macroWeek,
  mealName,
  mealPlural,
  prepSummary,
  shortDate,
  slotKey,
  sortedMembers,
  splitOf,
  totals,
  weekRange,
  weekLabel,
  type MealType,
} from "@/lib/domain";

export default function HomeScreen() {
  const household = useHousehold();
  const { members, settings, currentWeek, planningWeek, today } = household;
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "recipe" | "list">(null);

  const todayDay = dayOf(today);
  const people = sortedMembers(members);

  // Today's meals, with a note when someone is eating out (HOME-2).
  const todayMeals =
    currentWeek && todayDay
      ? activeMeals(currentWeek).map((meal) => {
          const asg = assignments(currentWeek, household);
          const eating = people.filter((p) => asg.has(slotKey(todayDay, meal, p.id)));
          const away = people.filter((p) => !eating.some((e) => e.id === p.id));
          const recipe = eating.length
            ? asg.get(slotKey(todayDay, meal, eating[0].id))?.recipe
            : undefined;
          return { meal, recipe, eating, away };
        })
      : [];

  // The night before a frozen meal is due (HOME-4), counted per meal type.
  const tomorrow = dayOf(addDays(today, 1));
  const freezerDue: { meal: MealType; n: number }[] = [];
  if (currentWeek && tomorrow && settings.freezeDays.includes(tomorrow)) {
    const byMeal = new Map<MealType, number>();
    for (const b of batches(currentWeek, household)) {
      const n = b.days[tomorrow] ?? 0;
      if (n) byMeal.set(b.meal, (byMeal.get(b.meal) ?? 0) + n);
    }
    for (const meal of activeMeals(currentWeek)) {
      const n = byMeal.get(meal);
      if (n) freezerDue.push({ meal, n });
    }
  }

  const rows = planningWeek
    ? (() => {
        const count = totals(planningWeek, members);
        const gaps = gapCount(planningWeek, members);
        const split = splitOf(macroWeek(planningWeek, household).tot);
        const label = weekLabel(split, settings.macroThresholds);
        const prep = prepSummary(planningWeek, household);
        const toBuy = buyItems(planningWeek, household).filter((i) => !i.checked).length;
        const meals = (["b", "l", "d"] as const).reduce((s, m) => s + count.byMeal[m], 0);
        return [
          {
            href: "/plan?view=eating",
            title: "Who's eating",
            status: `${meals} meals${planningWeek.snacksEnabled ? `, ${count.byMeal.s} snacks` : ""}`,
            warn: false,
          },
          {
            href: "/plan?view=menu",
            title: "Menu",
            status: gaps ? `${gaps} still need a recipe` : "Every meal has a recipe",
            warn: gaps > 0,
          },
          {
            href: "/plan?view=macros",
            title: "Macros",
            status: label.title + (split.p ? `, ${split.p}% protein` : ""),
            warn: false,
          },
          { href: "/list", title: "Shopping list", status: `${toBuy} items`, warn: false },
          {
            href: "/prep",
            title: "Prep day",
            status: `${prep.done} of ${prep.total} batches done`,
            warn: false,
          },
        ];
      })()
    : [];

  return (
    <>
      <header className="top">
        <h1>This week</h1>
        <p className="sub">
          {currentWeek
            ? `${weekRange(currentWeek.startDate)}, prepped ${settings.prepDay}`
            : "Nothing planned for this week"}
        </p>
      </header>

      <div className="quick">
        <button className="btn" onClick={() => setSheet("recipe")}>
          Add a recipe
        </button>
        <button className="btn ghost" onClick={() => setSheet("list")} disabled={!planningWeek}>
          Add to list
        </button>
      </div>

      <section className="section">
        <h2>{todayDay ? `Today, ${DAY_FULL[todayDay]}` : `Today, ${shortDate(today)}`}</h2>
        {!todayDay ? (
          <p className="empty">It&apos;s the weekend. MealPrep plans Monday to Friday.</p>
        ) : !currentWeek ? (
          <p className="empty">This week was never planned in the app.</p>
        ) : todayMeals.every((m) => !m.recipe) ? (
          <p className="empty">No meals assigned for today.</p>
        ) : (
          <ul className="menu">
            {todayMeals
              .filter((m) => m.recipe)
              .map((m) => (
                <li key={m.meal}>
                  <span className="menu-meal">{mealName(m.meal)}</span>
                  <span className="menu-dish">
                    {m.recipe?.name}
                    {m.away.length ? (
                      <small>
                        {m.away.map((p) => p.name).join(" and ")} {m.away.length > 1 ? "are" : "is"} out
                      </small>
                    ) : null}
                  </span>
                  <span className="who">
                    {m.eating.map((p) => (
                      <span className="tape sm" key={p.id}>
                        {p.initial}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>

      {planningWeek ? (
        <section className="section">
          <h2>Next week, {weekRange(planningWeek.startDate)}</h2>
          <ul className="rows">
            {rows.map((row) => (
              <li key={row.href}>
                <Link className="row" href={row.href}>
                  <span className="row-main">
                    <span className="row-title">{row.title}</span>
                    <span className={`row-meta ${row.warn ? "warn" : ""}`}>{row.status}</span>
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

      {freezerDue.length ? (
        <section className="note ice">
          <h2>Tonight</h2>
          <p>
            Move {freezerDue.map((f) => `${f.n} ${mealPlural(f.meal)}`).join(" and ")} from the
            freezer to the fridge for tomorrow.
          </p>
          <button className="btn small" onClick={() => router.push("/prep")}>
            See the batches
          </button>
        </section>
      ) : null}

      {sheet === "recipe" ? <AddRecipeSheet onClose={() => setSheet(null)} /> : null}
      {sheet === "list" && planningWeek ? (
        <AddToListSheet week={planningWeek} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}
