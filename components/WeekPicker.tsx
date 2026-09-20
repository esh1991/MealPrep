"use client";

import { useState } from "react";
import { useHousehold } from "@/lib/household/context";
import { addDays, relativeWeek, weekRange } from "@/lib/domain";

/**
 * Which week Plan, List and Prep are working on. Defaults to next week,
 * which is what Thursday planning is for, but any week can be opened.
 */
export default function WeekPicker() {
  const { selectedWeekStart, selectWeek, today, refreshing } = useHousehold();
  const [moving, setMoving] = useState(false);

  async function go(weeks: number) {
    setMoving(true);
    try {
      await selectWeek(addDays(selectedWeekStart, weeks * 7));
    } finally {
      setMoving(false);
    }
  }

  const busy = moving || refreshing;
  const relative = relativeWeek(selectedWeekStart, today);

  return (
    <div className="weekpick">
      <button onClick={() => void go(-1)} disabled={busy} aria-label="Previous week">
        ‹
      </button>
      <span>
        <strong>{relative}</strong>
        <small>{weekRange(selectedWeekStart)}</small>
      </span>
      <button onClick={() => void go(1)} disabled={busy} aria-label="Next week">
        ›
      </button>
    </div>
  );
}
