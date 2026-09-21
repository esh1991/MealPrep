# MealPrep

Phone-first PWA for one household (Shiva and Doreen) that plans Monday-to-Friday meal prep. Two users, equal permissions, changes shared between phones.

## Read first

- `docs/BUILD-PLAN.md` is the phase plan. Each session builds one phase and checks it against its "Done when".
- `docs/MealPrep-PRD.md` is the spec. Requirement IDs (REC, EAT, MENU, LIST, MAC, PREP, HOME) are referenced from the plan and from code comments.
- `docs/mealprep-prototype.html` is the reference for look, copy and business rules. Port it; don't redesign it.

## Stack

Next.js 16 (App Router, TypeScript, plain CSS), Supabase (Postgres, Google sign-in, realtime) via `@supabase/ssr`, Vercel, the Anthropic TypeScript SDK for recipe structuring. No Tailwind, no component library.

## Shared Supabase project

MealPrep is one app in a shared Supabase project that hosts several of Shiva's apps, one schema each.

- **MealPrep's tables live in `app_mealprep`,** never `public`. The clients in `lib/supabase/` are pinned to it via `db: { schema: APP_SCHEMA }`. A new table needs no client change, but a new *schema* would.
- **Never touch `public`, `platform`, or another `app_*` schema.** `platform` holds shared profiles and entitlements; a trigger there already creates a profile row for every new user, so MealPrep must not add one. MealPrep has no paid plan and no entitlements row.
- **Sign-in is the Google ID-token flow** (`signInWithIdToken` with Google Identity Services), not the OAuth redirect flow. Each app has its own Google Cloud project so the consent screen carries its own name, and every client ID is listed in Supabase's **Authorized Client IDs**. The main Client ID and Secret fields in the Supabase Google provider belong to another app: leave them alone. Magic link stays available as a fallback for when ad blockers eat Google's script.
- **Exposed schemas.** `app_mealprep` must be listed under Project Settings, API, Exposed schemas, or every query returns a schema-not-found error.
- `.mcp.json` gives read-only database access; authenticate with `/mcp` in a normal terminal. Use it to check a pattern against the other apps rather than guessing.

Shiva keeps a separate "shared plumbing" runbook covering the whole project. It is deliberately not in this repo. Ask for it if a question comes up that the conventions above do not answer.

## Rules

- **Business rules live in `lib/domain/` and are pure.** No React or Supabase imports there. Every screen renders from `compute(data)`. Tests in `lib/domain/domain.test.ts` assert the prototype's own numbers; keep them green (`npm test`).
- **Data is small and computed on the client.** Load the household and the relevant week, compute, write back with supabase-js under RLS. Realtime is a refetch, not a merge.
- **Versions are pinned.** A planned week references `week_picks.version_id`. Tweaking a recipe creates a new version and never changes a planned week's list or prep.
- **Design tokens live in `app/globals.css`**, ported from the prototype. Use the existing classes (`.tape`, `.block`, `.rows`, `.stepper`, `.btn`, `.panel`) before adding new ones. The masking-tape label is the one loud element.
- **Phone first.** Design at 380 px, check at 360 px. Visible focus states, `prefers-reduced-motion`, both color schemes.
- Route handlers only where a secret is involved (`app/api/structure` calls Claude with `claude-opus-5` and structured outputs). Everything else goes through supabase-js. The proxy skips `/api/*` so handlers can answer with a real status rather than a redirect to the login page.
- Next.js 16: the request hook file is `proxy.ts`, `cookies()` and `params` are async.

## Commands

```
npm run dev        # local server
npm test           # domain tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

## Setup state

See README.md for the Supabase, Google and Vercel steps. Until `.env.local` has the Supabase keys, the app renders the shell without sign-in.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
