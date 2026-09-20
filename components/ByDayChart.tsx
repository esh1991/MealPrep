"use client";

import { DAYS, sortedMembers, splitOf, type MacroWeek, type Member } from "@/lib/domain";

const n0 = (v: number) => Number(v || 0).toLocaleString("en-US");

/**
 * One stacked bar per person per day, scaled to the biggest day so the
 * shape of the week reads at a glance. Days someone is out read "out".
 */
export default function ByDayChart({
  macros,
  members,
  showKey = true,
}: {
  macros: MacroWeek;
  members: Member[];
  showKey?: boolean;
}) {
  const people = sortedMembers(members);
  const maxCal = Math.max(1, ...DAYS.flatMap((d) => people.map((p) => macros.per[p.id]?.[d].cal ?? 0)));

  return (
    <>
      {showKey ? (
        <span className="key" style={{ marginBottom: 6 }}>
          <span>
            <i className="mp" />
            Protein
          </span>
          <span>
            <i className="mc" />
            Carbs
          </span>
          <span>
            <i className="mf" />
            Fat
          </span>
        </span>
      ) : null}
      <ul className="days">
        {DAYS.map((day) => (
          <li key={day}>
            <span className="dname">{day}</span>
            <div>
              {people.map((p) => {
                const v = macros.per[p.id]?.[day];
                const s = v ? splitOf(v) : { p: 0, c: 0, f: 0 };
                return (
                  <div className="drow" key={p.id}>
                    <span className="dwho">{p.initial}</span>
                    <div className="dtrack">
                      {v?.cal ? (
                        <div
                          className="dbar"
                          style={{ width: `${Math.max(4, Math.round((v.cal / maxCal) * 100))}%` }}
                        >
                          <span className="mp" style={{ width: `${s.p}%` }} />
                          <span className="mc" style={{ width: `${s.c}%` }} />
                          <span className="mf" style={{ width: `${s.f}%` }} />
                        </div>
                      ) : null}
                    </div>
                    <span className="dcal">{v?.cal ? n0(v.cal) : "out"}</span>
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
