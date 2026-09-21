import type { Db } from "./queries";

// What recipe imports have cost so far.

export interface UsageRow {
  kind: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  ok: boolean;
  createdAt: string;
}

/** Dollars per million tokens, by model. Update when Anthropic's prices move. */
const RATES: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
};

export interface UsageSummary {
  imports: number;
  failed: number;
  inputTokens: number;
  outputTokens: number;
  /** Total spend in US dollars. */
  cost: number;
  /** Average cost of an import that worked. */
  perImport: number;
  lastAt: string | null;
}

export function summarise(rows: UsageRow[]): UsageSummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let cost = 0;
  let imports = 0;
  let failed = 0;

  for (const row of rows) {
    const rate = RATES[row.model] ?? RATES["claude-opus-5"];
    inputTokens += row.inputTokens;
    outputTokens += row.outputTokens;
    cost += (row.inputTokens / 1_000_000) * rate.input + (row.outputTokens / 1_000_000) * rate.output;
    if (row.ok) imports++;
    else failed++;
  }

  return {
    imports,
    failed,
    inputTokens,
    outputTokens,
    cost,
    perImport: imports ? cost / imports : 0,
    lastAt: rows.length ? rows[0].createdAt : null,
  };
}

/**
 * Reads the usage log. Returns null when the table is not there yet, so the
 * panel can stay quiet until migration 0004 has been run.
 */
export async function loadUsage(supabase: Db): Promise<UsageRow[] | null> {
  const query = supabase.from("api_usage" as never) as unknown as {
    select: (cols: string) => {
      order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: unknown }>;
    };
  };
  const { data, error } = await query
    .select("kind, model, input_tokens, output_tokens, ok, created_at")
    .order("created_at", { ascending: false });
  if (error) return null;

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    kind: String(r.kind),
    model: String(r.model),
    inputTokens: Number(r.input_tokens ?? 0),
    outputTokens: Number(r.output_tokens ?? 0),
    ok: Boolean(r.ok),
    createdAt: String(r.created_at),
  }));
}
