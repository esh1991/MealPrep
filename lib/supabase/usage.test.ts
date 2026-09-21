import { describe, expect, it } from "vitest";
import { summarise, type UsageRow } from "./usage";

const row = (over: Partial<UsageRow> = {}): UsageRow => ({
  kind: "notes",
  model: "claude-opus-5",
  inputTokens: 2_000,
  outputTokens: 1_000,
  ok: true,
  createdAt: "2026-09-20T10:00:00Z",
  ...over,
});

describe("summarising API usage", () => {
  it("costs a call at the model's input and output rates", () => {
    // 2k in at $5/M plus 1k out at $25/M.
    const s = summarise([row()]);
    expect(s.cost).toBeCloseTo(0.01 + 0.025, 6);
    expect(s.imports).toBe(1);
  });

  it("averages only over the imports that worked", () => {
    const s = summarise([row(), row({ ok: false })]);
    expect(s.imports).toBe(1);
    expect(s.failed).toBe(1);
    // A failed read still cost tokens, so the whole spend lands on the one
    // recipe that came out of it.
    expect(s.perImport).toBeCloseTo(s.cost, 6);
    expect(s.cost).toBeCloseTo(0.07, 6);
  });

  it("reports the newest timestamp, since rows arrive newest first", () => {
    const s = summarise([row({ createdAt: "2026-09-21T09:00:00Z" }), row()]);
    expect(s.lastAt).toBe("2026-09-21T09:00:00Z");
  });

  it("handles no usage at all", () => {
    const s = summarise([]);
    expect(s).toMatchObject({ imports: 0, cost: 0, perImport: 0, lastAt: null });
  });
});
