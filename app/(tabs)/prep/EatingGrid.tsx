"use client";

import { useState } from "react";
import { useHousehold } from "@/lib/household/context";
import { setDayEating, setSlotEating, setSnacks } from "@/lib/supabase/weekMutations";
import {
  DAYS,
  DAY_FULL,
  MEALS,
  activeMeals,
  dayNumber,
  dayDate,
  isEating,
  mealName,
  mealPlural,
  sortedMembers,
  totals,
  type Day,
  type MealType,
  type Week,
} from "@/lib/domain";

export default function EatingGrid({ week }: { week: Week }) {
  const { members, refresh } = useHousehold();

  // Taps feel instant and the realtime refetch reconciles a moment later.
  const [slots, setSlots] = useState(week.slots);
  const [snacks, setSnacksLocal] = useState(week.snacksEnabled);
  const [syncedTo, setSyncedTo] = useState(week);
  if (syncedTo !== week) {
    setSyncedTo(week);
    setSlots(week.slots);
    setSnacksLocal(week.snacksEnabled);
  }

  const local: Week = { ...week, slots, snacksEnabled: snacks };
  const meals = activeMeals(local);
  const people = sortedMembers(members);
  const count = totals(local, members);

  function toggleSlot(day: Day, meal: MealType, memberId: string, el: HTMLButtonElement) {
    const now = !isEating(local, day, meal, memberId);
    setSlots((prev) =>
      prev.map((s) =>
        s.day === day && s.meal === meal && s.memberId === memberId ? { ...s, eating: now } : s,
      ),
    );
    el.classList.remove("peel", "stick");
    void el.offsetWidth;
    el.classList.add(now ? "stick" : "peel");
    void setSlotEating(week.id, day, meal, memberId, now).then(refresh);
  }

  function toggleDay(day: Day) {
    const anyOn = slots.some((s) => s.day === day && meals.includes(s.meal) && s.eating);
    setSlots((prev) =>
      prev.map((s) => (s.day === day && meals.includes(s.meal) ? { ...s, eating: !anyOn } : s)),
    );
    void setDayEating(local, day, !anyOn).then(refresh);
  }

  function toggleSnacks() {
    const next = !snacks;
    setSnacksLocal(next);
    void setSnacks(week.id, next).then(refresh);
  }

  return (
    <>
      <p className="lede">
        Tap a name to take off a meal someone won&apos;t eat at home. Tap a day to clear the whole day.
      </p>

      <div className="switchrow">
        <div>
          <strong>Snacks</strong>
          <small>Plan one snack a day for each of you</small>
        </div>
        <button
          className={`switch ${snacks ? "on" : ""}`}
          role="switch"
          aria-checked={snacks}
          aria-label="Plan snacks"
          onClick={toggleSnacks}
        >
          <span />
        </button>
      </div>

      <div className="grid" style={{ "--cols": meals.length } as React.CSSProperties}>
        <div className="gh" />
        {meals.map((m) => (
          <div className="gh" key={m}>
            {mealName(m)}
          </div>
        ))}
        {DAYS.map((day) => (
          <GridRow
            key={day}
            day={day}
            date={dayNumber(dayDate(week.startDate, day))}
            meals={meals}
            people={people}
            week={local}
            onToggleDay={() => toggleDay(day)}
            onToggleSlot={toggleSlot}
          />
        ))}
      </div>

      <p className="legend">
        {people.map((p) => (
          <span key={p.id} style={{ display: "contents" }}>
            <span className="tape sm">{p.initial}</span>
            <span>{p.name}</span>
          </span>
        ))}
      </p>

      <div className="totals" style={{ "--cols": meals.length + 1 } as React.CSSProperties}>
        {meals.map((m) => (
          <div key={m}>
            <strong>{count.byMeal[m]}</strong>
            <span>{mealPlural(m)}</span>
          </div>
        ))}
        <div className="sum">
          <strong>{count.all}</strong>
          <span>total</span>
        </div>
      </div>
    </>
  );
}

function GridRow({
  day,
  date,
  meals,
  people,
  week,
  onToggleDay,
  onToggleSlot,
}: {
  day: Day;
  date: string;
  meals: MealType[];
  people: { id: string; name: string; initial: string }[];
  week: Week;
  onToggleDay: () => void;
  onToggleSlot: (day: Day, meal: MealType, memberId: string, el: HTMLButtonElement) => void;
}) {
  return (
    <>
      <button className="gday" onClick={onToggleDay} aria-label={`Toggle all meals on ${DAY_FULL[day]}`}>
        {day}
        <small>{date}</small>
      </button>
      {meals.map((meal) => (
        <div className="gcell" key={meal}>
          {people.map((p) => {
            const on = isEating(week, day, meal, p.id);
            return (
              <button
                key={p.id}
                className={`slot ${on ? "" : "off"}`}
                aria-pressed={on}
                aria-label={`${p.name}, ${DAY_FULL[day]} ${mealName(meal).toLowerCase()}${on ? "" : ", taken off"}`}
                onClick={(e) => onToggleSlot(day, meal, p.id, e.currentTarget)}
              >
                {p.initial}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

export { MEALS };
