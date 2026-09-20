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
    return (
      <main className="signin">
        <span className="tape">MealPrep</span>
        <h1>This app is for one household</h1>
        <p className="sub">
          {session.user.email} isn&apos;t on the list. If it should be, add it to the members table in Supabase.
        </p>
        <form action="/auth/signout" method="post">
          <button className="btn ghost" type="submit">Sign out</button>
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
