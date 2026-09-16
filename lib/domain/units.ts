import { UNITS, type Unit } from "./types";

// Rounding rules from PRD 7.3. Ported from the prototype's roundQ, frac and qty.

const COUNTISH: readonly Unit[] = ["count", "can", "pint", "head", "bunch", "scoop", "clove"];

/** Increment used by quantity steppers when editing a recipe. */
export const STEP: Record<Unit, number> = {
  count: 1,
  can: 1,
  pint: 1,
  head: 1,
  bunch: 1,
  scoop: 1,
  clove: 1,
  lb: 0.25,
  oz: 1,
  cup: 0.25,
  tbsp: 0.5,
  tsp: 0.5,
};

const EPS = 1e-6;

export function isUnit(x: unknown): x is Unit {
  return typeof x === "string" && (UNITS as readonly string[]).includes(x);
}

/** Round a merged quantity up to what you can actually buy or measure. */
export function roundQ(q: number, u: Unit): number {
  if (COUNTISH.includes(u)) return Math.max(1, Math.ceil(q - EPS));
  if (u === "lb" || u === "cup") return Math.ceil(q * 4 - EPS) / 4;
  if (u === "tbsp" || u === "tsp") return Math.ceil(q * 2 - EPS) / 2;
  return Math.ceil(q - EPS);
}

/** 3.75 becomes "3¾", 0.5 becomes "½", 2 becomes "2". */
export function frac(q: number): string {
  const w = Math.floor(q);
  const f = Math.round((q - w) * 100);
  const s = ({ 25: "¼", 50: "½", 75: "¾" } as Record<number, string>)[f] ?? "";
  return (w ? String(w) : "") + s || "0";
}

function unitLabel(u: Unit, many: boolean): string {
  switch (u) {
    case "count":
      return "";
    case "can":
      return many ? "cans" : "can";
    case "pint":
      return many ? "pints" : "pint";
    case "head":
      return many ? "heads" : "head";
    case "bunch":
      return many ? "bunches" : "bunch";
    case "scoop":
      return many ? "scoops" : "scoop";
    case "clove":
      return many ? "cloves" : "clove";
    case "cup":
      return many ? "cups" : "cup";
    case "lb":
    case "oz":
    case "tbsp":
    case "tsp":
      return u;
  }
}

/** Rounded, human quantity such as "3¾ cups", "2 cans", "6" or "½ tsp". */
export function formatQty(q: number, u: Unit): string {
  const r = roundQ(q, u);
  const n = frac(r);
  const lab = unitLabel(u, r > 1);
  return lab ? `${n} ${lab}` : n;
}
