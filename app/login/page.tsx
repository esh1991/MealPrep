import { isSupabaseConfigured } from "@/lib/supabase/env";
import SignInButton from "./SignInButton";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <main className="signin">
      <span className="tape">MealPrep</span>
      <h1>Sign in</h1>
      <p className="sub">One household, two phones. Use the Google account that&apos;s on the list.</p>
      {configured ? (
        <SignInButton />
      ) : (
        <p className="err">Supabase isn&apos;t configured yet. Copy .env.example to .env.local and fill in the project URL and anon key.</p>
      )}
      {error ? <p className="err">Sign-in didn&apos;t finish. Try again.</p> : null}
    </main>
  );
}
