# Setting up Google sign-in for MealPrep

About 10 minutes. You need a Google Cloud project of MealPrep's own so the sign-in screen says "MealPrep" rather than another app's name. That is the only reason for a separate project: the name and logo on the consent screen are set per project, not per app.

**The short version of what you are skipping.** Your runbook's Phase 2 assumes apps with public users, which is why it asks for a privacy policy, a terms page and brand verification. MealPrep has two users, both of them you. Leaving the project in **Testing** mode with the two of you as test users means none of that is required. Sign-in keeps working indefinitely, because MealPrep never reads or writes anything in your Google account. It only asks who you are.

---

## 1. Create the project

1. Go to https://console.cloud.google.com
2. Top left, click the project dropdown, then **New project**.
3. Name it `MealPrep`. Leave the organization as-is. Click **Create**.
4. Wait for the notification, then make sure the project dropdown now says MealPrep. Everything below applies to the selected project, so this matters.

## 2. Fill in the sign-in screen

1. Go to https://console.cloud.google.com/auth/overview
2. Click **Get started**.
3. **App name:** `MealPrep`. This is the exact text you and Doreen will see on the sign-in screen.
4. **User support email:** your Gmail.
5. **Audience:** choose **External**.
6. **Contact information:** your Gmail again.
7. Agree to the policy and click **Create**.

## 3. Add the two of you as test users

1. Go to https://console.cloud.google.com/auth/audience
2. Under **Test users**, click **Add users**.
3. Add your Gmail and Doreen's Gmail. Save.
4. Leave **Publishing status** as **Testing**. Do not click "Publish app".

Only these two accounts can sign in, which is exactly what MealPrep wants.

## 4. Create the sign-in client

1. Go to https://console.cloud.google.com/auth/clients
2. Click **Create client**.
3. **Application type:** Web application.
4. **Name:** `MealPrep web`.
5. Under **Authorized JavaScript origins**, click Add URI and add these two:
   - `http://localhost:3000`
   - your Vercel URL once you have it, for example `https://mealprep-xyz.vercel.app`
6. Leave **Authorized redirect URIs** completely empty. MealPrep signs in without a redirect, the same way your other apps do.
7. Click **Create**.
8. A panel shows **Client ID** and **Client secret**. Copy the **Client ID**. It looks like `1234567890-abc123def456.apps.googleusercontent.com`.

You do not need the client secret. This sign-in method never uses it.

## 5. Tell Supabase about the new client

1. Supabase dashboard, your project, then **Authentication** in the sidebar, then **Sign In / Providers**, then **Google**.
2. Leave the main **Client ID** and **Client Secret** fields exactly as they are. Another app owns those and changing them would break it.
3. Find the **Authorized Client IDs** field. It already has your other apps' client IDs, separated by commas. Add MealPrep's client ID to the end of that list, after a comma. Do not remove anything.
4. Save.

That field is what lets one Supabase project accept sign-ins from several different apps.

## 6. Give me the client ID

Paste MealPrep's client ID into the chat. It is not a secret, it is visible in the app's page source by design. I will put it in `.env.local` and in Vercel as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, and wire up the sign-in button.

---

## Two things worth knowing

**Ad blockers sometimes block Google's sign-in script.** MealPrep also offers a magic-link sign-in that emails you a link, so there is always a way in if the Google button does not appear.

**Google Cloud's menus get rearranged fairly often.** If a link above lands somewhere unexpected, search the console for "Google Auth Platform" and you will find the same pages.
