# MealPrep

Weekly meal prep for one household. See `docs/BUILD-PLAN.md` for the build phases and `docs/MealPrep-PRD.md` for the spec.

## Run it locally

```
npm install
npm run dev
```

Without Supabase configured you get the app shell (tabs and headers) at http://localhost:3000. With it configured you get Google sign-in and the household check.

## One-time setup (Phase 0)

### 1. Supabase project

1. Create a project at supabase.com. Note the **Project URL** and the **anon public key** under Settings, API.
2. Open the SQL editor and run `supabase/migrations/0001_household.sql`. Replace Doreen's email in the last statement first. This creates the household, the two members and the row-level security helper.
3. Under Authentication, Providers, enable **Google**. It shows you the callback URL you need for the next step.

### 2. Google OAuth client

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Add Supabase's callback URL (from the previous step) as an authorised redirect URI.
3. Paste the client ID and secret into the Supabase Google provider settings.
4. In Supabase, Authentication, URL Configuration, add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://<your-vercel-domain>/auth/callback`

### 3. Local environment

Copy `.env.example` to `.env.local` and fill in the Supabase URL and anon key. Restart `npm run dev`.

### 4. Vercel

1. Import the GitHub repo into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables. `ANTHROPIC_API_KEY` comes in Phase 7.
3. After the first deploy, add the production URL to Supabase's redirect list (step 2.4) and set it as the Site URL.

### Done when

Both of you sign in with Google on your phones at the Vercel URL, see the tab bar in light and dark mode, and can add the app to the home screen.

## Scripts

```
npm run dev         local server
npm test            domain tests
npm run typecheck   TypeScript
npm run lint        ESLint
npm run build       production build
npm run icons       regenerate placeholder icons in public/icons
```
