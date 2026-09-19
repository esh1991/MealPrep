"use client";

export default function Stepper({
  value,
  onChange,
  label,
  min = 0,
  step = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  /** Used for the two buttons' accessible names, e.g. "servings". */
  label: string;
  min?: number;
  step?: number;
  children?: never;
}) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} aria-label={`Less ${label}`}>
        −
      </button>
      <span aria-live="polite">{typeof value === "number" ? value : ""}</span>
      <button onClick={() => onChange(value + step)} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}

/** Same control, but the caller renders the middle label itself. */
export function LabelledStepper({
  display,
  onDown,
  onUp,
  label,
}: {
  display: string;
  onDown: () => void;
  onUp: () => void;
  label: string;
}) {
  return (
    <div className="stepper">
      <button onClick={onDown} aria-label={`Less ${label}`}>
        −
      </button>
      <span aria-live="polite">{display}</span>
      <button onClick={onUp} aria-label={`More ${label}`}>
        +
      </button>
    </div>
  );
}
