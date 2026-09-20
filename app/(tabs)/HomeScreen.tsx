"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MacroBar } from "@/components/Macros";
import MealIcon from "@/components/MealIcon";
import { useHousehold } from "@/lib/household/context";
import AddRecipeSheet from "./recipes/AddRecipeSheet";
import AddToListSheet from "./list/AddToListSheet";
import {
  DAYS,
  DAY_FULL,
  activeMeals,
  addDays,
  assignments,
  batches,
  buyItems,
  containersByDay,
  dailyAverage,
  dayDate,
  dayNumber,
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
  weekLabel,
  weekRange,
  type Day,
  type MealType,
  type Week,
} from "@/lib/domain";

const n0 = (v: number) => Number(v || 0).toLocaleString("en-US");

export default function HomeScreen() {
  const { settings, currentWeek, planningWeek, today } = useHousehold();
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "recipe" | "list">(null);

  const todayDay = dayOf(today);

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

      {currentWeek ? (
        <>
          <Today week={currentWeek} day={todayDay} />
          <RestOfWeek week={currentWeek} today={todayDay} />
          <Balance week={currentWeek} />
          <FreezerTonight week={currentWeek} today={today} onOpenPrep={() => router.push("/prep")} />
        </>
      ) : (
        <section className="section">
          <h2>{todayDay ? `Today, ${DAY_FULL[todayDay]}` : shortDate(today)}</h2>
          <p className="empty">
            This week was never planned in the app. Next week is where the planning happens.
          </p>
        </section>
      )}

      {planningWeek ? <NextWeek week={planningWeek} /> : null}

      {sheet === "recipe" ? <AddRecipeSheet onClose={() => setSheet(null)} /> : null}
      {sheet === "list" && planningWeek ? (
        <AddToListSheet week={planningWeek} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

/** Today's meals with who is eating, then each person's totals (HOME-2). */
function Today({ week, day }: { week: Week; day: Day | null }) {
  const household = useHousehold();
  const { members } = household;
  const people = sortedMembers(members);

  if (!day) {
    return (
      <section className="section">
        <h2>The weekend</h2>
        <p className="empty">MealPrep plans Monday to Friday. Next week is ready when you are.</p>
      </section>
    );
  }

  const asg = assignments(week, household);
  const meals = activeMeals(week)
    .map((meal) => {
      const eating = people.filter((p) => asg.has(slotKey(day, meal, p.id)));
      const away = people.filter((p) => !eating.some((e) => e.id === p.id));
      const entry = eating.length ? asg.get(slotKey(day, meal, eating[0].id)) : undefined;
      return { meal, entry, eating, away };
    })
    .filter((m) => m.entry);

  const mw = macroWeek(week, household);

  return (
    <section className="section">
      <h2>Today, {DAY_FULL[day]}</h2>
      {meals.length ? (
        <>
          <ul className="today">
            {meals.map((m) => (
              <li key={m.meal} className={m.away.length ? "out" : ""}>
                <MealIcon meal={m.meal} className="mealico" />
                <span className="dish">
                  <strong>{m.entry!.recipe.name}</strong>
                  <small>
                    {mealName(m.meal)}
                    {m.entry!.version.cal ? ` · ${n0(m.entry!.version.cal)} cal` : ""}
                    {m.away.length ? ` · ${m.away.map((p) => p.name).join(" and ")} out` : ""}
                  </small>
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

          <div className="daytot">
            {people.map((p) => {
              const v = mw.per[p.id][day];
              return (
                <div key={p.id}>
                  <span className="tape sm">{p.name}</span>
                  {v.cal ? (
                    <>
                      <strong>{n0(v.cal)} cal</strong>
                      <MacroBar split={splitOf(v)} />
                      <small>
                        <b className="tp">P</b> {v.protein} <b className="tc">C</b> {v.carbs}{" "}
                        <b className="tf">F</b> {v.fat}
                      </small>
                    </>
                  ) : (
                    <small>Eating out today</small>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="empty">No meals assigned for today.</p>
      )}
    </section>
  );
}

/** The days still to come, so you know what is in the fridge (HOME-5). */
function RestOfWeek({ week, today }: { week: Week; today: Day | null }) {
  const household = useHousehold();
  const asg = assignments(week, household);
  const cans = containersByDay(week, household);
  const from = today ? DAYS.indexOf(today) + 1 : 0;
  const days = DAYS.slice(from);

  if (!days.length) {
    return (
      <section className="section">
        <h2>Rest of the week</h2>
        <p className="empty">Friday is the last planned day. Next week is below.</p>
      </section>
    );
  }

  return (
    <section className="section">
      <h2>Rest of the week</h2>
      <ul className="wk">
        {days.map((day) => {
          // One line per day, listing each distinct dish once.
          const dishes: string[] = [];
          for (const meal of activeMeals(week)) {
            for (const p of sortedMembers(household.members)) {
              const entry = asg.get(slotKey(day, meal as MealType, p.id));
              if (entry && !dishes.includes(entry.recipe.name)) dishes.push(entry.recipe.name);
            }
          }
          const frozen = household.settings.freezeDays.includes(day);
          return (
            <li key={day} className={frozen ? "chill" : ""}>
              <span className="d">
                {day}
                <small>{dayNumber(dayDate(week.startDate, day))}</small>
              </span>
              <span className="dishes">
                {dishes.length ? dishes.join(", ") : <em>Nothing planned</em>}
              </span>
              <span className="cans">
                <b>{cans[day]}</b>
                {frozen ? "frozen" : "in fridge"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** How the week is leaning, and what each of you averages a day (MAC-2, MAC-3). */
function Balance({ week }: { week: Week }) {
  const household = useHousehold();
  const { members, settings } = household;
  const mw = macroWeek(week, household);
  if (!mw.tot.n) return null;

  const split = splitOf(mw.tot);
  const label = weekLabel(split, settings.macroThresholds);

  return (
    <section className="section">
      <div className="balance">
        <h2>{label.title}</h2>
        <span>
          {split.p}% protein · {split.c}% carbs · {split.f}% fat
        </span>
      </div>
      <MacroBar split={split} />
      <div className="daytot">
        {sortedMembers(members).map((p) => {
          const a = dailyAverage(mw.per[p.id]);
          return (
            <div key={p.id}>
              <span className="tape sm">{p.name}</span>
              <strong>{n0(a.cal)} cal</strong>
              <small>
                a day at home · <b className="tp">P</b> {a.protein} <b className="tc">C</b> {a.carbs}{" "}
                <b className="tf">F</b> {a.fat}
              </small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Move tomorrow's frozen containers to the fridge tonight (HOME-4). */
function FreezerTonight({
  week,
  today,
  onOpenPrep,
}: {
  week: Week;
  today: string;
  onOpenPrep: () => void;
}) {
  const household = useHousehold();
  const tomorrow = dayOf(addDays(today, 1));
  if (!tomorrow || !household.settings.freezeDays.includes(tomorrow)) return null;

  const byMeal = new Map<MealType, number>();
  for (const b of batches(week, household)) {
    const n = b.days[tomorrow] ?? 0;
    if (n) byMeal.set(b.meal, (byMeal.get(b.meal) ?? 0) + n);
  }
  const due = activeMeals(week)
    .filter((m) => byMeal.get(m))
    .map((m) => `${byMeal.get(m)} ${mealPlural(m)}`);
  if (!due.length) return null;

  return (
    <section className="note ice">
      <h2>Tonight</h2>
      <p>
        Move {due.join(" and ")} from the freezer to the fridge for {DAY_FULL[tomorrow]}.
      </p>
      <button className="btn small" onClick={onOpenPrep}>
        See the batches
      </button>
    </section>
  );
}

/** The planning hub: one row per section, each with a live status (HOME-3). */
function NextWeek({ week }: { week: Week }) {
  const household = useHousehold();
  const { members, settings } = household;

  const count = totals(week, members);
  const gaps = gapCount(week, members);
  const split = splitOf(macroWeek(week, household).tot);
  const label = weekLabel(split, settings.macroThresholds);
  const prep = prepSummary(week, household);
  const toBuy = buyItems(week, household).filter((i) => !i.checked).length;
  const meals = (["b", "l", "d"] as const).reduce((s, m) => s + count.byMeal[m], 0);

  const rows = [
    {
      href: "/plan?view=eating",
      title: "Who's eating",
      status: `${meals} meals${week.snacksEnabled ? `, ${count.byMeal.s} snacks` : ""}`,
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
    { href: "/list", title: "Shopping list", status: `${toBuy} items to buy`, warn: false },
    {
      href: "/prep",
      title: "Prep day",
      status: prep.total
        ? `${prep.done} of ${prep.total} batches done`
        : "Nothing to prep yet",
      warn: false,
    },
  ];

  return (
    <section className="section">
      <h2>Next week, {weekRange(week.startDate)}</h2>
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
  );
}
