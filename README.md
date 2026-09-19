# MealPrep

Weekly meal prep for one household. See `docs/BUILD-PLAN.md` for the build phases and `docs/MealPrep-PRD.md` for the spec.

## Run it locally

```
npm install
npm run dev
```

Without Supabase configured you get the app shell (tabs and headers) at http://localhost:3000. With it configured you get Google sign-in and the household check.

## One-time setup (Phase 0)

MealPrep lives in the shared Supabase project alongside the other apps, in its own `app_mealprep` schema. It shares sign-in with them and touches nothing they own.

### 1. Create the schema

**Run the migration.** Open the SQL editor (left sidebar, the terminal icon). Paste in `supabase/migrations/0001_mealprep_schema.sql`, replace Doreen's placeholder email near the bottom, and run it.

**Expose the schema.** Go to https://supabase.com/dashboard/project/rxwyuqcsifohiiyvyink/settings/api

In the left sidebar this page is called **Data API**, under the INTEGRATIONS heading. Find **Exposed schemas**, add `app_mealprep` to the list, and save.

Skip this and every query fails with a schema-not-found error, even though the tables look fine in the table editor. It is the one step with no other symptom.

**Check it.** Run `npm run check`. It uses the anon key to confirm the schema is exposed, that all 13 tables and the `ensure_week` function exist, and that anonymous visitors are refused. If something is off it prints the exact value to paste.

The migration creates the schema, tables, row-level security, the `ensure_week` function, table grants, and adds the week tables to the realtime publication. It is safe to re-run.

### 2. Google sign-in

Follow `docs/SETUP-GOOGLE.md`. About 10 minutes: a Google Cloud project of MealPrep's own so the sign-in screen says MealPrep, kept in Testing mode with the two of you as test users, then its client ID appended to the **Client IDs** list on Supabase's Google provider.

### 3. Local environment

Copy `.env.example` to `.env.local` and fill in the Supabase anon key and the Google client ID. Restart `npm run dev`.

### 4. Vercel

1. Import the GitHub repo into Vercel as its own project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. `ANTHROPIC_API_KEY` comes in Phase 7.
3. After the first deploy, add the Vercel URL to the Google client's **Authorized JavaScript origins**.

### Done when

Both of you sign in with Google on your phones at the Vercel URL, see the tab bar in light and dark mode, and can add the app to the home screen.

## Reading the database from Claude Code

`.mcp.json` points at the shared project in read-only mode. To authenticate, run `claude` in a normal terminal (not the VS Code extension), then `/mcp`, pick `supabase`, and choose Authenticate. It opens a browser and uses your Supabase login. No access token to paste, and read-only means nothing can be changed by accident.

## Scripts

```
npm run dev         local server
npm run check       verify the Supabase setup with the anon key
npm test            domain tests
npm run typecheck   TypeScript
npm run lint        ESLint
npm run build       production build
npm run icons       regenerate placeholder icons in public/icons
```
