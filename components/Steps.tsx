"use client";

import Check from "./Check";

export interface Step<K extends string> {
  key: K;
  label: string;
  /** Ticked in the step bar once this step has what it needs. */
  done: boolean;
}

/**
 * A numbered bar across the top of a multi-step screen. Steps stay tappable
 * in any order, because planning rarely happens front to back, but the
 * numbering and the ticks say what the natural order is and how far along
 * you are.
 */
export function StepBar<K extends string>({
  steps,
  current,
  onSelect,
}: {
  steps: Step<K>[];
  current: K;
  onSelect: (key: K) => void;
}) {
  return (
    <ol className="steps-bar">
      {steps.map((step, i) => {
        const state = step.key === current ? "on" : step.done ? "done" : "";
        return (
          <li key={step.key}>
            <button className={`step ${state}`} onClick={() => onSelect(step.key)} aria-current={step.key === current}>
              <span className="step-no" aria-hidden="true">
                {step.done && step.key !== current ? <Check /> : i + 1}
              </span>
              <span className="step-label">{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The nudge at the bottom of a step. `hint` says where you stand; the button
 * moves you on whether or not the step is finished, because nothing here is
 * a gate.
 */
export function StepFooter({
  hint,
  action,
  onAction,
  tone = "ok",
}: {
  hint: string;
  action: string;
  onAction: () => void;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="step-footer">
      <p className={tone === "warn" ? "warn" : "ok"}>{hint}</p>
      <button className="btn" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
