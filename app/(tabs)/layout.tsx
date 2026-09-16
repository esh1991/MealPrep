import { redirect } from "next/navigation";
import Tabs from "@/components/Tabs";
import { getSession } from "@/lib/supabase/member";

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session.state === "signed-out") redirect("/login");

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

  return (
    <>
      <div className="app">
        {session.state === "unconfigured" ? (
          <p className="fine" style={{ paddingTop: 12 }}>
            Supabase isn&apos;t configured, so this is the shell only. See README.md.
          </p>
        ) : null}
        <main id="screen">{children}</main>
      </div>
      <Tabs />
    </>
  );
}
