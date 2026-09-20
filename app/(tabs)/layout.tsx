import { redirect } from "next/navigation";
import Tabs from "@/components/Tabs";
import { ToastProvider } from "@/components/Toast";
import { HouseholdProvider } from "@/lib/household/context";
import { getSession } from "@/lib/supabase/member";
import { createClient } from "@/lib/supabase/server";
import { loadAll } from "@/lib/supabase/all";

// Every screen under the tab bar shows one household's data and depends on
// who is signed in, so none of it can be prerendered at build time.
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="app">
        <main id="screen">{children}</main>
      </div>
      <Tabs />
    </>
  );
}

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session.state === "signed-out") redirect("/login");

  if (session.state === "unconfigured") {
    return (
      <Shell>
        <p className="fine" style={{ paddingTop: 12 }}>
          Supabase isn&apos;t configured, so this is the shell only. See README.md.
        </p>
        {children}
      </Shell>
    );
  }

  if (session.state === "not-member") {
    // Signing in with Google only proves who someone is. Membership of this
    // household is a separate list, so say exactly how to fix it.
    return (
      <main className="signin">
        <span className="tape">MealPrep</span>
        <h1>This app is for one household</h1>
        <p className="sub">
          Google signed you in as <strong>{session.user.email}</strong>, but that address is not on
          the household list.
        </p>
        <details className="block">
          <summary>If it should be</summary>
          <p>Run this in the Supabase SQL editor, replacing the address being corrected:</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
            {`update app_mealprep.members\nset email = '${session.user.email}'\nwhere display_name = 'Doreen';`}
          </pre>
          <p className="muted">
            Then sign in again. The household has exactly two seats, so this replaces an address
            rather than adding a third.
          </p>
        </details>
        <form action="/auth/signout" method="post">
          <button className="btn ghost" type="submit">
            Sign out
          </button>
        </form>
      </main>
    );
  }

  const data = await loadAll(await createClient());
  if (!data) {
    return (
      <main className="signin">
        <span className="tape">MealPrep</span>
        <h1>No household yet</h1>
        <p className="sub">
          The database has no household row. Run the migrations in supabase/migrations, then reload.
        </p>
      </main>
    );
  }

  return (
    <HouseholdProvider initial={data} memberId={session.member.id}>
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </HouseholdProvider>
  );
}
