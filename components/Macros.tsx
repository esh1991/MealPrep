import { splitOf, type Split } from "@/lib/domain";

const n0 = (v: number) => Number(v || 0).toLocaleString("en-US");

export function MacroBar({ split }: { split: Split }) {
  return (
    <div className="mbar" aria-hidden="true">
      <span className="mp" style={{ width: `${split.p}%` }} />
      <span className="mc" style={{ width: `${split.c}%` }} />
      <span className="mf" style={{ width: `${split.f}%` }} />
    </div>
  );
}

interface Macros {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** The four-column per-serving strip with the split bar underneath. */
export function MacroStrip({ macros }: { macros: Macros }) {
  return (
    <>
      <div className="macros">
        <div>
          <strong>{n0(macros.cal)}</strong>
          <span>calories</span>
        </div>
        <div className="m-p">
          <strong>{macros.protein} g</strong>
          <span>protein</span>
        </div>
        <div className="m-c">
          <strong>{macros.carbs} g</strong>
          <span>carbs</span>
        </div>
        <div className="m-f">
          <strong>{macros.fat} g</strong>
          <span>fat</span>
        </div>
      </div>
      <MacroBar split={splitOf(macros)} />
    </>
  );
}

/** One-line summary used in lists: "470 cal P 42 C 52 F 10". */
export function MacroLine({ macros }: { macros: Macros | undefined }) {
  if (!macros || !macros.cal) return <>macros not set</>;
  return (
    <>
      {macros.cal} cal{" "}
      <span className="nowrap">
        <b className="tp">P</b> {macros.protein} <b className="tc">C</b> {macros.carbs}{" "}
        <b className="tf">F</b> {macros.fat}
      </span>
    </>
  );
}
