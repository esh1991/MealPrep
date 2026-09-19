import { isSupabaseConfigured, googleClientId } from "@/lib/supabase/env";
import SignIn from "./SignIn";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="signin">
      <span className="tape">MealPrep</span>
      <h1>Sign in</h1>
      <p className="sub">One household, two phones. Use the Google account that&apos;s on the list.</p>
      {isSupabaseConfigured() ? (
        <SignIn clientId={googleClientId()} />
      ) : (
        <p className="err">
          Supabase isn&apos;t configured yet. Copy .env.example to .env.local and fill in the anon key.
        </p>
      )}
      {error ? <p className="err">Sign-in didn&apos;t finish. Try again.</p> : null}
    </main>
  );
}
