# Setting up Google sign-in for MealPrep

MealPrep needs a Google Cloud project of its own so the sign-in screen says "MealPrep" rather than another app's name. That is the only reason for a separate project: the name and logo on the consent screen are set per project, not per client.

**What you are skipping.** The shared-plumbing runbook's Phase 2 assumes apps with public users, which is why it asks for a privacy policy, a terms page and brand verification. MealPrep has two users, both of them you. Leaving the project in **Testing** mode with the two of you as test users means none of that is required. Sign-in keeps working indefinitely, because MealPrep never reads or writes anything in your Google account. It only asks who you are.

---

## Status

| Step | State |
|---|---|
| Google Cloud project | Done |
| Client ID | `666322095804-h5u27otspcjprt5q05cnop30kl6f3b1u.apps.googleusercontent.com` |
| Client secret | Not used by MealPrep. Rotate the one that was pasted into chat. |
| In `.env.local` | Done |
| Authorized JavaScript origins | Check both URLs are listed, see step 4 |
| Test users | Check both emails are listed, see step 3 |
| Added to Supabase Client IDs | Done |
| Added to Vercel | Done |

---

## 1. Create the project

1. Go to https://console.cloud.google.com
2. Top left, click the project dropdown, then **New project**.
3. Name it `MealPrep`. Click **Create**.
4. Make sure the project dropdown then says MealPrep. Everything below applies to the selected project.

## 2. Fill in the sign-in screen

1. Go to https://console.cloud.google.com/auth/overview
2. Click **Get started**.
3. **App name:** `MealPrep`. This is the exact text you and Doreen will see.
4. **User support email:** your Gmail.
5. **Audience:** choose **External**.
6. **Contact information:** your Gmail again.
7. Agree and click **Create**.

## 3. Add the two of you as test users

1. Go to https://console.cloud.google.com/auth/audience
2. Under **Test users**, click **Add users**.
3. Add your Gmail and Doreen's Gmail. Save.
4. Leave **Publishing status** as **Testing**. Do not click "Publish app".

Only those two accounts can sign in, which is what MealPrep wants. If Doreen sees "access blocked" when she tries, her email is missing from this list.

## 4. The sign-in client

At https://console.cloud.google.com/auth/clients, open the MealPrep web client and check:

**Authorized JavaScript origins** has both of these:
- `http://localhost:3000`
- `https://meal-prep-dun-eta.vercel.app`

**Authorized redirect URIs** is empty. MealPrep signs in without a redirect, the same way the other apps do.

If you add or change an origin, Google can take a few minutes to apply it. A "redirect_uri_mismatch" or "origin is not allowed" error usually means an origin is missing or has a typo, and the URL must match exactly, including `https://` and no trailing slash.

### About the client secret

MealPrep's sign-in never uses it. The secret that was pasted into chat should be replaced: open the client, delete that secret, click **Add secret**. Nothing in MealPrep breaks, because nothing reads it.

## 5. Tell Supabase about the new client

1. Go to https://supabase.com/dashboard/project/rxwyuqcsifohiiyvyink/auth/providers and open **Google**.
2. Find the **Client IDs** field. It is a comma-separated list and already holds your other apps' client IDs.
3. Put the cursor at the very end, type a comma, then paste MealPrep's client ID. **Remove nothing.**
4. Leave **Client Secret (for OAuth)** exactly as it is. It belongs to another app.
5. Leave **Skip nonce checks** off. MealPrep sends a correct nonce.
6. Save.

That list is what lets one Supabase project accept sign-ins from several different apps.

## 6. Vercel

In the Vercel project serving meal-prep-dun-eta.vercel.app, open Settings then Environment Variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rxwyuqcsifohiiyvyink.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon key, same value as in .env.local |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `666322095804-h5u27otspcjprt5q05cnop30kl6f3b1u.apps.googleusercontent.com` |

If a `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is already there with a different value, it belongs to another app and you are looking at the wrong Vercel project. Environment variables do not leak between projects, so each app keeps its own.

Redeploy after changing these. Variables are baked in at build time, so an existing deployment will not pick them up.

---

## Two things worth knowing

**Ad blockers sometimes block Google's sign-in script.** MealPrep's login page also offers "Email me a link instead", which needs no Google setup at all. If the Google button never appears, that is why.

**Google Cloud's menus get rearranged fairly often.** If a link above lands somewhere unexpected, search the console for "Google Auth Platform".
