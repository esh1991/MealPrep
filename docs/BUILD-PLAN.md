# MealPrep build plan

**For:** Shiva (building with Claude Code) and Doreen (testing on the second phone)
**Source documents:** `MealPrep-PRD.md` (v1 = every P0 requirement) and `mealprep-prototype.html` (reference for look, flow and business rules)
**Written:** September 15, 2026

This plan turns the PRD into nine build phases. Each phase ends with a check you can do on a phone. The order follows the household's own loop, because v1 is done only when one real week is planned, shopped and prepped inside the app.

**Change on September 15, 2026:** Instacart is out of v1. Copy list is the shopping handoff. Instacart may come back later, possibly through its MCP server (section 7).

---

## 1. Ground rules

1. **Port the prototype, don't redesign it.** Its CSS tokens, layout and copy are the spec for look and feel. Its functions (`roundQ`, `qty`, `aggregate`, `buyItems`, `assignments`, `batches`, `macroWeek`, `splitOf`, `weekLabel`, `splitEven`, `guessAisle`, `toRecipe`) are the reference implementation for the business rules in PRD section 7.
2. **Business rules live in pure TypeScript, tested, with no React or Supabase imports.** Every screen is `render(compute(data))`. This is what makes the rest of the app thin and keeps the math correct.
3. **One household, small data, computed on the client.** Load the household's recipes and the two relevant weeks into the browser once, compute everything from that (exactly as the prototype does), and write changes with supabase-js under row-level security. The one route handler is the Claude recipe structuring call, because that needs the API key.
4. **Realtime is a refetch, not a merge.** When Supabase reports a change on a week table or a recipe, refetch that slice. Two users editing at once is rare and last-write-wins is fine.
5. **Every phase ships to the Vercel URL.** Both phones test the live build, not localhost.

---

## 2. Decisions to lock before starting

These are the PRD's open questions plus a few build choices. Each has a recommended default so nothing blocks the build. Change any of them and the plan still holds.

| Decision | Recommended for v1 | Why |
|---|---|---|
| Portion assignment (PRD Q1) | Automatic, Monday first, Shiva then Doreen | Matches the prototype. Manual assignment can be added to the same `week_picks` model later. |
| Macro targets (Q2) | None in v1 | MAC-7 is P1. The thresholds in settings are enough to label the week. |
| Weekends and leftovers (Q3) | Extras are labeled "Extra" in Prep and otherwise ignored | Rolling into next week needs inventory, which is a non-goal. |
| Nutrition accuracy (Q4) | Claude's estimates | MAC-8 is P2. |
| Store choice (Q5) | Not relevant in v1 | Comes back with Instacart, if ever. |
| Instacart | Not in v1. Copy list is the handoff. | Revisit later, possibly through Instacart's MCP server. The list already carries name, quantity and unit for every item. |
| Freezer reminders (Q6) | In-app card only | Push notifications are P1. |
| Doreen's input (Q7) | Ask before Phase 4 | Plan and List are where her preferences most likely differ. |
| Prep day and freeze days | Sunday; Thursday and Friday | Stored in `households.settings` so they are editable without a deploy. |
| Which week is "next week" | The Monday strictly after today. "This week" is the Monday on or before today. | Simple and matches Thursday planning. |
| Sign-in | Google via Supabase Auth, with a `members` allowlist of two accounts | No sign-up flow. Anyone else sees "This app is for one household." |
| Styling | Plain CSS, ported from the prototype. No Tailwind, no component library. | The prototype's stylesheet is complete and about 300 lines. |
| Claude model | `claude-opus-5` through the official TypeScript SDK, with structured outputs | Reliable JSON without parsing tricks. See section 6. |
| Testing | Vitest for the domain core. Manual phone checks per phase. | Two users; the math is where bugs would hurt. |

---

## 3. Accounts and access

Do all of these in the first week, in parallel with Phase 0.

| Service | What to set up | Needed by |
|---|---|---|
| GitHub | Private repo `mealprep`. Commit the PRD, the prototype and this plan under `docs/`. | Phase 0 |
| Supabase | New project. Enable the Google provider. Note the project URL and anon key. | Phase 0 |
| Google Cloud | OAuth client ID for the Supabase callback URL. Add both Vercel and localhost redirect URLs in Supabase Auth settings. | Phase 0 |
| Vercel | Project linked to the repo. Environment variables for Supabase and Anthropic. | Phase 0 |
| Anthropic Console | API key with a monthly spend limit. | Phase 7 |

---

## 4. Repo layout

```
mealprep/
  app/
    (tabs)/                 layout with the bottom tab bar
      page.tsx              This week
      recipes/              library, [id] detail
      plan/                 who's eating, menu, macros
      list/                 shopping list, pantry check, staples
      prep/
    login/
    api/structure/route.ts  Claude recipe structuring (server only)
  components/               tape, stepper, sheet, tabs, toast
  lib/
    domain/                 pure business rules + tests (Phase 1)
    supabase/               browser client, server client, queries, realtime hook
    dates.ts                week boundaries, freeze days
  supabase/
    migrations/             schema, enums, RLS, functions
    seed.sql                the prototype's 11 recipes and pantry lists
  docs/                     PRD, prototype, this plan
  CLAUDE.md                 conventions for Claude Code sessions
```

---

## 5. Phases

Size key: **S** is one or two Claude Code sessions, **M** is three to five, **L** is more. These are rough.

### Phase 0. Scaffold, sign-in, deploy (S)

**Build**
- `create-next-app` with TypeScript and the App Router. No Tailwind.
- Global stylesheet: port the prototype's `:root` tokens, both dark-mode blocks, and the base rules for `.tape`, `.btn`, `.block`, `.rows`, `.stepper`, `.tabs`, `.panel` and `.toast`. Load Schibsted Grotesk and Kalam with `next/font/google`.
- App shell: five routes under a shared layout with the fixed bottom tab bar. Each route renders its header only.
- Supabase Auth: browser and server clients from `@supabase/ssr`, middleware that refreshes the session, a `/login` page with Google sign-in, and a membership check against `members`. Non-members see a one-line page.
- Vercel deploy with environment variables. Add the production URL to Supabase's redirect list.
- PWA basics: `manifest.webmanifest`, icons, `theme-color`, `viewport-fit=cover`. No service worker in v1.

**Reference:** PRD section 11.

**Done when** both of you sign in with Google on your phones at the Vercel URL, see the tab bar in the right colors in light and dark mode, and can add the app to the home screen.

### Phase 1. Domain core (M)

Pure TypeScript in `lib/domain/`, ported function by function from the prototype, with types shaped like the database rows rather than the prototype's flattened recipe object.

**Build**
- `units.ts`: the unit enum, stepper increments, `roundQ`, `frac`, `qty` formatting. (PRD 7.3)
- `slots.ts`: slot keys, `needed`, per-meal totals, active meal types when snacks are off. (7.1)
- `menu.ts`: `assigned`, gaps, `splitEven`, add-a-pick rule (cover the remainder, otherwise split), zero removes. (MENU-3 to MENU-5)
- `list.ts`: `aggregate` (scale by portions over base servings, merge on ingredient and unit), pantry classification, `buyItems` with extras and item keys. (7.3)
- `assign.ts`: `assignments` and `batches`, Monday first, Shiva then Doreen, extras labeled. (7.2)
- `macros.ts`: `macroWeek`, `splitOf`, `weekLabel` with thresholds passed in from settings, per-person daily average, swap tip. (7.4)
- `versions.ts`: diff two ingredient lists and macros into change strings such as "Garlic 3 cloves to 6 cloves". (REC-6)
- `aisle.ts`: `guessAisle` word table. (LIST-7)
- `dates.ts`: current week Monday, planning week Monday, freeze days from settings. (7.5)

**Tests (Vitest)** use the prototype's sample data as the fixture. Expected values to assert, taken from the prototype:

| Check | Expected |
|---|---|
| Meal totals with Wed dinner (S) and Tue lunch (D) off | 10 breakfasts, 9 lunches, 9 dinners, 10 snacks |
| Coverage for the sample menu | Every meal type fully covered |
| Greek yogurt on the list (three recipes, merged and rounded to ¼ cup) | 3¾ cups |
| Chicken breast (two recipes) | 4 lb |
| Garlic (usually-have, marked Have it) | Not on the list, shown in pantry check |
| Lemons (three recipes) | 6 |
| Quick-add "Paper towels" | Household aisle |
| Week label for the sample menu | Same label and percentages as the prototype's Macros tab |

**Done when** `npm test` passes and the fixture outputs match the prototype.

### Phase 2. Schema, security, seed, realtime (M)

**Build**
- Migrations for the tables in PRD section 10. Enums for meal type, unit, aisle, method, rating, pantry status and source kind. Unique constraints on (recipe, version number), (week, day, meal, member), (week, ingredient) for pantry checks, and (household, start date) for weeks.
- Row-level security on every table: the row's `household_id` must appear in `members` for `auth.uid()`. Insert the two `members` rows by hand.
- A Postgres function `ensure_week(start_date)` that creates the week row and its 40 slots (all eating) in one transaction, so a week appears the first time someone opens Plan.
- Seed: the prototype's 11 recipes as version 1 with their ingredients, the staples and usually-have lists as `ingredients.pantry_status`, and the household settings JSON (snacks on, freeze days, prep day, macro thresholds).
- Typed query layer in `lib/supabase/queries.ts`: load household, load recipes with current versions, load a week with slots, picks, pantry checks, extras, list checks and prep status.
- Realtime: enable the publication for the week tables, `recipes` and `recipe_versions`. A `useHousehold()` hook does the initial load and subscribes; on any event it refetches the affected slice, debounced.

**Done when** both accounts read the seed under RLS, a third Google account is refused, and flipping a slot in the Supabase table editor shows on a phone without a refresh.

### Phase 3. Recipes (M)

**Build**
- Library with search across names and ingredients, meal-type chips, ratings and version badges. (REC-1 to REC-3)
- Detail with macros, ingredients, steps, tweak history, source, and the servings stepper that rescales for viewing only. (REC-4, REC-5, REC-7)
- Save a tweak sheet: quantity steppers, add and remove ingredients, macro fields, note. Saving inserts a new version and its ingredients, sets `current_version`, and stores the generated change list. New ingredient names are matched case-insensitively against `ingredients` or created. (REC-6)
- "Check these guesses" banner with Looks right, backed by `open_guesses`. (REC-11)
- Type it in: name and meal type, then Save a tweak fills the rest. (REC-12)
- Add to next week: adds a pick to the planning week's matching meal, covering uncovered portions. Wired fully in Phase 4. (REC-14)

**Done when** a tweak saved on one phone appears on the other with the new version number and change list within a few seconds, and searching "chicken" matches by ingredient.

**Checkpoint M1:** recipes are shared between the two phones.

### Phase 4. Plan (L)

**Build**
- Who's eating: the grid from `week_slots`, tap to toggle with the prototype's peel and stick animation, day tap clears or restores, snacks switch on `weeks.snacks_enabled`, live totals. (EAT-1 to EAT-5)
- Menu: picks with portion steppers, coverage line, add-a-recipe picker sheet, split evenly, zero removes, macro strip that opens Macros. Adding a pick stores `version_id = recipes.current_version`, which pins the version. (MENU-1 to MENU-7)
- Macros: week label from settings thresholds, three big shares and bar, daily average per person, by-day stacked bars with "out", swap tip, meals-out note. Swapping updates the pick's recipe and version. (MAC-1 to MAC-6)

Ask Doreen to try Who's eating and Menu before calling this phase done (PRD Q7).

**Done when** opening Plan for a new week creates 40 slots, the sample menu reads "All N covered" for each meal, and tweaking a planned recipe afterward leaves the week's picks unchanged.

### Phase 5. List (M)

**Build**
- Shopping list generated from the planning week's pinned versions, grouped by aisle, with quantity, name and source recipes. Quick-add field and the Add to list sheet with quick picks. Tap to cross off, stored in `week_list_checks` by item key. Warning row when a meal still needs a recipe. (LIST-1, LIST-2, LIST-7 to LIST-10)
- Pantry check: usually-have items with Have it or Buy, default Buy, stored per week. Collapsed skipped-staples section. (LIST-4, LIST-5)
- Staples: add and remove on both lists, matching known ingredient names. (LIST-3, LIST-6)
- Copy list: plain text grouped by aisle through the Clipboard API, with a toast. This is the shopping handoff in v1. (LIST-12; LIST-11 is parked)

**Done when** the sample menu's list matches the Phase 1 fixtures on the phone, "Paper towels" lands under Household, and Copy list pastes cleanly into Notes.

### Phase 6. Prep and This week (M)

**Build**
- Prep: one batch per pick grouped by Oven, Stovetop and No-cook with the group notes; servings and multiple; container labels by day with freeze marks from settings; done checkbox in `week_prep_status`; progress bar and totals; tapping opens the recipe at the batch's servings; empty state links to Menu. (PREP-1 to PREP-6)
- This week: quick actions, today's meals from the current week's assignments with who is eating and out notes, the Next week status rows, and the freezer card computed for the night before the first frozen day. (HOME-1 to HOME-4 card)
- Containers left (HOME-5) is deferred to v1.1.

**Done when** Prep's batch, container and freeze counts match the menu, the home rows show live statuses, and you can run a made-up week end to end with Copy list.

**Checkpoint M2:** the whole loop works.

### Phase 7. Add a recipe with Claude (M)

**Build**
- Route handler `app/api/structure/route.ts`. Verifies the session and membership, accepts either a base64 image or notes text, calls Claude with structured outputs, normalizes the draft (section 6) and returns it. The API key stays on the server.
- Client: photo picker that downscales on a canvas before upload (longest side about 1600 px, JPEG), word-dump textarea with the example filler, loading state with Stop through `AbortController`, error states with the PRD's messages, and the review screen with name, meal type, macros, ingredients, steps and Guesses to check. (REC-8 to REC-10)
- Saving creates the recipe with `source_kind`, version 1 and `open_guesses`.
- Paste a link shows "Coming in v1.1". (REC-13)

**Done when** a phone photo of a cookbook page and the prototype's example word dump each produce a draft with the right units and the guesses listed, and the guesses stay on the saved recipe until Looks right.

### Phase 8. Hardening and the v1 week (M)

**Build**
- Layout check at 360 px, visible focus states, `prefers-reduced-motion`, dark mode on both phones.
- Undo toasts for removing a pick, an extra or a pantry item. Confirmation on anything that clears a week.
- Loading, empty and error states on every screen. An offline banner. Refetch when the app returns to the foreground.
- Confirm Supabase backups are on.
- Run the acceptance week: plan on Thursday, shop, prep on Sunday, eat the week. Write down every point of friction as the v1.1 backlog.

**Done when** the PRD's v1 criterion is met: one real week planned, shopped and prepped entirely in the app.

---

## 6. Recipe structuring with Claude

| Item | Choice |
|---|---|
| SDK | `@anthropic-ai/sdk`, called only from the route handler |
| Model | `claude-opus-5` |
| Output | `client.messages.parse` with `zodOutputFormat(RecipeDraftSchema)` so the response is validated JSON in the PRD section 8 shape. No JSON parsing of free text. |
| Input | Photo as a base64 `image` block plus the instruction text; notes as text, cut at 8,000 characters with a message if longer |
| Prompt | The prototype's `PROMPT` constant as the system prompt, unchanged |
| Timeout | `export const maxDuration = 60` on the route. Check the Vercel plan's limit. |
| Cancel | Client aborts the fetch; the handler passes the signal to the SDK |
| Normalization | Unknown unit becomes `count`, unknown aisle becomes `Pantry`, non-numeric quantity becomes 1, ingredient names matched case-insensitively to `ingredients`, no ingredients is a failure |
| Errors | 429 → "Too many requests right now. Try again in a minute." Image rejected → "That photo couldn't be read. Try a clearer or smaller one." `stop_reason` of `refusal` → "Claude couldn't turn that into a recipe. Try different notes." Anything else → "Couldn't structure that recipe. Try again." |
| Cost | About 2,500 input and 800 output tokens per import, which is 3 to 4 cents at current Opus 5 rates |

---

## 7. Parked: Instacart

Not in v1. When it comes back, there are two routes: the Developer Platform REST endpoint (`POST /idp/v1/products/products_link`, which takes line items with a name and measurements and returns a shopping-list link, and needs API approval), or Instacart's MCP server with its create-shopping-list tool. Either way the shopping list already has what they need: a name, a quantity and a unit for every item, and free-text extras as single items. Nothing in the v1 schema needs to change; the `instacart_url`, `instacart_items_hash` and `sent_at` columns on `weeks` can be left out until then.

---

## 8. Working with Claude Code

- Commit `docs/MealPrep-PRD.md`, `docs/mealprep-prototype.html` and `docs/BUILD-PLAN.md` first. Some copies of the prototype have mangled characters (for example "Â°F" for "°F"); commit the clean UTF-8 original.
- Add a short `CLAUDE.md`: the stack, the "domain core is pure and tested" rule, where the tokens live, and the phone-first viewport.
- One phase per branch and pull request. Start each session with "Build Phase N from docs/BUILD-PLAN.md" and name the PRD IDs it covers.
- Run `npm test` before every merge. Deploy previews from Vercel are the review surface.

---

## 9. Milestones

| Milestone | After | What you can do |
|---|---|---|
| M1 | Phase 3 | Keep and tweak recipes together on two phones |
| M2 | Phase 6 | Plan, shop with Copy list and prep a week in the app |
| v1 | Phase 8 | One real week through the app, with Copy list as the shopping handoff |
| v1.1 | Later | Link import, restore a version, copy last week, macro targets, push reminders, containers left, Instacart if wanted |

---

## 10. Risks

| Risk | Effect | Plan |
|---|---|---|
| Photos that Claude can't read | Import fails on real cookbook pages | Downscale on the client, map errors to plain messages, keep Type it in as the manual path. |
| Two phones editing the same week | Confusing flicker | Refetch on change, optimistic updates only for slot toggles and cross-offs. |
| Version pinning missed somewhere | A tweak silently changes a planned list | Only `week_picks.version_id` feeds the list and prep. Phase 4's done check covers it. |
| Google OAuth and redirect setup | Sign-in fails on the phone | Do it in Phase 0 with both localhost and production URLs. |
| Route timeouts on Vercel | Photo imports fail | Set `maxDuration`, downscale images, show Stop. |
