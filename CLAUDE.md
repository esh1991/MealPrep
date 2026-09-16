# MealPrep

Phone-first PWA for one household (Shiva and Doreen) that plans Monday-to-Friday meal prep. Two users, equal permissions, changes shared between phones.

## Read first

- `docs/BUILD-PLAN.md` is the phase plan. Each session builds one phase and checks it against its "Done when".
- `docs/MealPrep-PRD.md` is the spec. Requirement IDs (REC, EAT, MENU, LIST, MAC, PREP, HOME) are referenced from the plan and from code comments.
- `docs/mealprep-prototype.html` is the reference for look, copy and business rules. Port it; don't redesign it.

## Stack

Next.js 16 (App Router, TypeScript, plain CSS), Supabase (Postgres, Google sign-in, realtime) via `@supabase/ssr`, Vercel, the Anthropic TypeScript SDK for recipe structuring. No Tailwind, no component library.

## Rules

- **Business rules live in `lib/domain/` and are pure.** No React or Supabase imports there. Every screen renders from `compute(data)`. Tests in `lib/domain/domain.test.ts` assert the prototype's own numbers; keep them green (`npm test`).
- **Data is small and computed on the client.** Load the household and the relevant week, compute, write back with supabase-js under RLS. Realtime is a refetch, not a merge.
- **Versions are pinned.** A planned week references `week_picks.version_id`. Tweaking a recipe creates a new version and never changes a planned week's list or prep.
- **Design tokens live in `app/globals.css`**, ported from the prototype. Use the existing classes (`.tape`, `.block`, `.rows`, `.stepper`, `.btn`, `.panel`) before adding new ones. The masking-tape label is the one loud element.
- **Phone first.** Design at 380 px, check at 360 px. Visible focus states, `prefers-reduced-motion`, both color schemes.
- Route handlers only where a secret is involved (`app/api/structure` for Claude). Everything else goes through supabase-js.
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
