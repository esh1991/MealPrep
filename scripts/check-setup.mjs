// Checks the Supabase side of the setup without needing a database login.
// Uses only the anon key from .env.local, which is a browser-safe key.
//
//   npm run check
//
// Answers: is app_mealprep exposed through the API, are the tables there,
// and is anonymous access correctly locked out.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");

function readEnv() {
  const out = {};
  for (const file of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(path.join(root, file), "utf8").split("\n")) {
        const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && !out[m[1]]) out[m[1]] = m[2].trim();
      }
    } catch {
      // file is optional
    }
  }
  return out;
}

const env = readEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SCHEMA = "app_mealprep";

const pass = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  console.log(`  FAIL  ${m}`);
  process.exitCode = 1;
};
const info = (m) => console.log(`        ${m}`);

if (!url || !key) {
  fail("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local");
  process.exit(1);
}

async function rest(pathname, headers = {}) {
  const res = await fetch(`${url}/rest/v1/${pathname}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...headers },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // some responses have no body
  }
  return { status: res.status, body };
}

console.log(`\nChecking ${url}\n`);

// 1. Is the schema reachable through the API at all?
console.log("Exposed schemas");
const probe = await rest("households?select=id&limit=1", { "Accept-Profile": SCHEMA });

if (probe.body?.code === "PGRST106") {
  fail(`${SCHEMA} is not exposed through the API, so every query will fail`);
  info("Supabase dashboard > Project Settings > API > Exposed schemas");
  const current = String(probe.body.hint ?? "").match(/exposed:\s*(.+?)\.?$/i)?.[1];
  if (current) {
    info(`Currently: ${current}`);
    info(`Change to: ${current}, ${SCHEMA}`);
  } else {
    info(`Add ${SCHEMA} to the list.`);
  }
  info("Then run this again.");
  process.exit(1);
}
pass(`${SCHEMA} is exposed`);

// 2. Anonymous visitors must not be able to read anything.
console.log("\nAnonymous access");
if (probe.status === 200) {
  fail("anonymous users can query households; they should be refused");
  info("Re-run the grants section of supabase/migrations/0001_mealprep_schema.sql");
} else if (probe.body?.code === "42501" || probe.status === 401 || probe.status === 403) {
  pass("anonymous users are refused, as intended");
} else {
  info(`unexpected response ${probe.status}: ${JSON.stringify(probe.body)}`);
}

// 3. Do all the tables exist? The anon role is refused before it can read a
//    row, but "permission denied" and "no such table" are different errors,
//    so asking for each one still tells us whether it is there.
console.log("\nTables");
const expected = [
  "households", "members", "ingredients", "recipes", "recipe_versions",
  "recipe_version_ingredients", "weeks", "week_slots", "week_picks",
  "week_pantry_checks", "week_extras", "week_list_checks", "week_prep_status",
];

const EXISTS = new Set(["42501"]); // permission denied: the table is there
const ABSENT = new Set(["PGRST205", "42P01"]); // unknown table

const results = await Promise.all(
  expected.map(async (t) => {
    const r = await rest(`${t}?select=*&limit=1`, { "Accept-Profile": SCHEMA });
    if (r.status === 200 || EXISTS.has(r.body?.code)) return { t, ok: true };
    if (ABSENT.has(r.body?.code)) return { t, ok: false, why: "not found" };
    return { t, ok: false, why: `${r.status} ${r.body?.code ?? ""}`.trim() };
  }),
);
const missing = results.filter((r) => !r.ok);
if (missing.length) missing.forEach((m) => fail(`${m.t}: ${m.why}`));
else pass(`all ${expected.length} tables present`);

const rpc = await fetch(`${url}/rest/v1/rpc/ensure_week`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "Content-Profile": SCHEMA,
  },
  body: JSON.stringify({ p_start_date: "2026-01-05" }),
});
const rpcBody = await rpc.json().catch(() => null);
if (ABSENT.has(rpcBody?.code) || rpc.status === 404) fail("ensure_week function missing");
else pass("ensure_week function present");

console.log(
  process.exitCode
    ? "\nSomething needs attention. See the FAIL lines above.\n"
    : "\nSupabase side looks right. Sign in to test the rest.\n",
);
