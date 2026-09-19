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

// 3. Do all the tables exist? The OpenAPI description lists them even when
//    the anon role cannot read their rows.
console.log("\nTables");
const spec = await rest("", { "Accept-Profile": SCHEMA });
const expected = [
  "households", "members", "ingredients", "recipes", "recipe_versions",
  "recipe_version_ingredients", "weeks", "week_slots", "week_picks",
  "week_pantry_checks", "week_extras", "week_list_checks", "week_prep_status",
];
const paths = Object.keys(spec.body?.paths ?? {}).map((p) => p.replace(/^\//, ""));
if (!paths.length) {
  info("could not read the API description; skipping this check");
} else {
  const missing = expected.filter((t) => !paths.includes(t));
  if (missing.length) fail(`missing: ${missing.join(", ")}`);
  else pass(`all ${expected.length} tables present`);
  if (paths.includes("rpc/ensure_week")) pass("ensure_week function present");
  else fail("ensure_week function missing");
}

console.log(
  process.exitCode
    ? "\nSomething needs attention. See the FAIL lines above.\n"
    : "\nSupabase side looks right. Sign in to test the rest.\n",
);
