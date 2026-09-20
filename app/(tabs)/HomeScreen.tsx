"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ByDayChart from "@/components/ByDayChart";
import { MacroBar } from "@/components/Macros";
import MealIcon from "@/components/MealIcon";
import { useHousehold } from "@/lib/household/context";
import AddRecipeSheet from "./recipes/AddRecipeSheet";
import AddToListSheet from "./prep/shop/AddToListSheet";
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
  relativeWeek,
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
  const household = useHousehold();
  const { members, settings, currentWeek, selectedWeek, selectedWeekStart, today } = household;
  const router = useRouter();
  const [sheet, setSheet] = useState<null | "recipe" | "list">(null);

  // Show whichever week actually has food in it. This week is only a real
  // week once something was planned for it, which is never at the start.
  const thisWeekIsLive = !!currentWeek?.picks.length;
  const focus = thisWeekIsLive ? currentWeek : selectedWeek;
  const todayDay = dayOf(today);

  if (!focus) {
    return (
      <>
        <header className="top">
          <h1>This week</h1>
          <p className="sub">Nothing planned yet</p>
        </header>
        <p className="empty">Open Plan to set up next week.</p>
      </>
    );
  }

  // The day to lead with: today if it is a weekday in a live week,
  // otherwise the first day of the week being shown.
  const heroDay: Day = thisWeekIsLive && todayDay ? todayDay : "Mon";
  const heroIsToday = thisWeekIsLive && todayDay === heroDay;
  const mw = macroWeek(focus, household);
  const cans = containersByDay(focus, household);
  const prep = prepSummary(focus, household);
  const remaining = thisWeekIsLive && todayDay ? DAYS.slice(DAYS.indexOf(todayDay) + 1) : DAYS;

  return (
    <>
      <header className="top">
        <h1>{thisWeekIsLive ? "This week" : "Next week"}</h1>
        <p className="sub">
          {weekRange(focus.startDate)}
          {thisWeekIsLive ? `, prepped ${settings.prepDay}` : `, prep ${settings.prepDay}`}
        </p>
      </header>

      <div className="quick">
        <button className="btn" onClick={() => setSheet("recipe")}>
          Add a recipe
        </button>
        <button className="btn ghost" onClick={() => setSheet("list")} disabled={!selectedWeek}>
          Add to list
        </button>
      </div>

      <WeekStats week={focus} cans={cans} prep={prep} />

      <DayCard week={focus} day={heroDay} isToday={heroIsToday} />

      <WeekAhead week={focus} days={remaining} cans={cans} heading={thisWeekIsLive ? "Rest of the week" : "The week"} />

      {mw.tot.n ? (
        <>
          <Balance week={focus} />
          <section className="section">
            <h2>Calories by day</h2>
            <ByDayChart macros={mw} members={members} />
          </section>
        </>
      ) : (
        <section className="section">
          <h2>Macros</h2>
          <p className="empty">Pick a menu and the week&apos;s balance shows up here.</p>
          <div className="actions">
            <button className="btn" onClick={() => router.push("/prep?step=menu")}>
              Pick the menu
            </button>
          </div>
        </section>
      )}

      {thisWeekIsLive ? (
        <FreezerTonight week={focus} today={today} onOpenPrep={() => router.push("/prep")} />
      ) : null}

      {selectedWeek && thisWeekIsLive ? (
        <NextWeek week={selectedWeek} label={relativeWeek(selectedWeekStart, today)} />
      ) : null}
      {!thisWeekIsLive && selectedWeek ? <PlanningRows week={selectedWeek} /> : null}

      {sheet === "recipe" ? <AddRecipeSheet onClose={() => setSheet(null)} /> : null}
      {sheet === "list" && selectedWeek ? (
        <AddToListSheet week={selectedWeek} onClose={() => setSheet(null)} />
      ) : null}
    </>
  );
}

/** Four numbers that say how big the week is at a glance. */
function WeekStats({
  week,
  cans,
  prep,
}: {
  week: Week;
  cans: Record<Day, number>;
  prep: { done: number; total: number; containers: number; frozen: number };
}) {
  const household = useHousehold();
  const count = totals(week, household.members);
  const total = Object.values(cans).reduce((a, b) => a + b, 0);

  return (
    <ul className="fridge" style={{ marginBottom: 22 }}>
      <li>
        <strong>{count.all}</strong>
        <span>meals</span>
      </li>
      <li>
        <strong>{total}</strong>
        <span>containers</span>
      </li>
      <li>
        <strong>{prep.frozen}</strong>
        <span>frozen</span>
        {prep.frozen ? <em>Thu, Fri</em> : null}
      </li>
      <li>
        <strong>
          {prep.done}/{prep.total}
        </strong>
        <span>batches</span>
      </li>
    </ul>
  );
}

/** One day in full: every meal, who is eating, and each person's totals. */
function DayCard({ week, day, isToday }: { week: Week; day: Day; isToday: boolean }) {
  const household = useHousehold();
  const people = sortedMembers(household.members);
  const asg = assignments(week, household);
  const mw = macroWeek(week, household);

  const meals = activeMeals(week)
    .map((meal) => {
      const eating = people.filter((p) => asg.has(slotKey(day, meal, p.id)));
      const away = people.filter((p) => !eating.some((e) => e.id === p.id));
      const entry = eating.length ? asg.get(slotKey(day, meal, eating[0].id)) : undefined;
      return { meal, entry, eating, away };
    })
    .filter((m) => m.entry);

  return (
    <section className="section">
      <h2>
        {isToday ? "Today, " : ""}
        {DAY_FULL[day]} {dayNumber(dayDate(week.startDate, day))}
      </h2>
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
                    <small>Nothing at home</small>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="empty">No meals on this day yet.</p>
      )}
    </section>
  );
}

/** The other days, with their dishes and how many containers are waiting. */
function WeekAhead({
  week,
  days,
  cans,
  heading,
}: {
  week: Week;
  days: readonly Day[];
  cans: Record<Day, number>;
  heading: string;
}) {
  const household = useHousehold();
  const asg = assignments(week, household);
  const people = sortedMembers(household.members);
  if (!days.length) return null;

  return (
    <section className="section">
      <h2>{heading}</h2>
      <ul className="wk">
        {days.map((day) => {
          const dishes: string[] = [];
          for (const meal of activeMeals(week)) {
            for (const p of people) {
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

/** How the week is leaning, and each person's daily average at home. */
function Balance({ week }: { week: Week }) {
  const household = useHousehold();
  const { members, settings } = household;
  const mw = macroWeek(week, household);
  const split = splitOf(mw.tot);
  const label = weekLabel(split, settings.macroThresholds);

  return (
    <section className="section">
      <div className="balance">
        <h2>{label.title}</h2>
      </div>
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

function rowsFor(week: Week, household: ReturnType<typeof useHousehold>) {
  const { members, settings } = household;
  const count = totals(week, members);
  const gaps = gapCount(week, members);
  const split = splitOf(macroWeek(week, household).tot);
  const label = weekLabel(split, settings.macroThresholds);
  const prep = prepSummary(week, household);
  const toBuy = buyItems(week, household).filter((i) => !i.checked).length;
  const meals = (["b", "l", "d"] as const).reduce((s, m) => s + count.byMeal[m], 0);

  return [
    {
      href: "/prep?step=eating",
      title: "Who's eating",
      status: `${meals} meals${week.snacksEnabled ? `, ${count.byMeal.s} snacks` : ""}`,
      warn: false,
    },
    {
      href: "/prep?step=menu",
      title: "Menu",
      status: gaps ? `${gaps} still need a recipe` : "Every meal has a recipe",
      warn: gaps > 0,
    },
    {
      href: "/insights",
      title: "Macros",
      status: label.title + (split.p ? `, ${split.p}% protein` : ""),
      warn: false,
    },
    { href: "/prep?step=shop", title: "Shopping list", status: `${toBuy} items to buy`, warn: false },
    {
      href: "/prep?step=cook",
      title: "Prep day",
      status: prep.total ? `${prep.done} of ${prep.total} batches done` : "Nothing to prep yet",
      warn: false,
    },
  ];
}

function HubRows({ rows }: { rows: ReturnType<typeof rowsFor> }) {
  return (
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
  );
}

/** The planning hub when this week is the one on screen. */
function NextWeek({ week, label }: { week: Week; label: string }) {
  const household = useHousehold();
  return (
    <section className="section">
      <h2>
        {label}, {weekRange(week.startDate)}
      </h2>
      <HubRows rows={rowsFor(week, household)} />
    </section>
  );
}

/** The same hub when next week is already the one on screen. */
function PlanningRows({ week }: { week: Week }) {
  const household = useHousehold();
  return (
    <section className="section">
      <h2>Still to do</h2>
      <HubRows rows={rowsFor(week, household)} />
    </section>
  );
}
