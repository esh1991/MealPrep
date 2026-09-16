"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function signIn() {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setErr(error.message);
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn" onClick={signIn} disabled={busy}>
        {busy ? "Opening Google…" : "Continue with Google"}
      </button>
      {err ? <p className="err">{err}</p> : null}
    </>
  );
}
