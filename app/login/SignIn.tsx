"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Google Identity Services, loaded from accounts.google.com. Only the small
// part of its surface that MealPrep uses.
interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleIdApi {
  initialize(config: {
    client_id: string;
    nonce: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

/**
 * Google wants the hashed nonce, Supabase wants the raw one. Swapping them
 * fails with an unhelpful message, so they are produced together here.
 */
async function makeNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = crypto.randomUUID();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { raw, hashed };
}

type Status = "loading" | "ready" | "unavailable" | "signing-in";

export default function SignIn({ clientId }: { clientId: string | null }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>(clientId ? "loading" : "unavailable");
  const [error, setError] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const signInWithGoogle = useCallback(
    async (credential: string, nonce: string) => {
      setStatus("signing-in");
      setError("");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
        nonce,
      });
      if (error) {
        setError(error.message);
        setStatus("ready");
        return;
      }
      router.refresh();
      router.push("/");
    },
    [router],
  );

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    async function start() {
      const { raw, hashed } = await makeNonce();
      if (cancelled) return;
      const api = window.google?.accounts.id;
      if (!api || !buttonRef.current) {
        setStatus("unavailable");
        return;
      }
      api.initialize({
        client_id: clientId!,
        nonce: hashed,
        callback: (response) => void signInWithGoogle(response.credential, raw),
        cancel_on_tap_outside: true,
      });
      api.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 280,
      });
      setStatus("ready");
    }

    // Ad blockers and strict privacy settings sometimes block this script.
    // Give it a moment, then fall back to the email link.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing && window.google) {
      void start();
      return;
    }
    const script = existing ?? document.createElement("script");
    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = () => void start();
    const onError = () => !cancelled && setStatus("unavailable");
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    const timer = setTimeout(() => {
      if (!cancelled && !window.google) setStatus("unavailable");
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
  }, [clientId, signInWithGoogle]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setEmailSent(true);
  }

  return (
    <>
      {clientId ? (
        <div>
          <div ref={buttonRef} />
          {status === "loading" ? <p className="fine">Loading the Google button…</p> : null}
          {status === "signing-in" ? <p className="fine">Signing you in…</p> : null}
          {status === "unavailable" ? (
            <p className="fine">
              The Google button didn&apos;t load. An ad blocker is the usual reason. Use the email link below.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="err">
          No Google client ID configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local. See docs/SETUP-GOOGLE.md.
        </p>
      )}

      {emailSent ? (
        <p className="ok">Check {email} for a sign-in link.</p>
      ) : showEmail ? (
        <form onSubmit={sendLink} className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            autoComplete="email"
            required
          />
          <button className="btn ghost" type="submit">Email me a link</button>
        </form>
      ) : (
        <button className="link" onClick={() => setShowEmail(true)}>
          Email me a link instead
        </button>
      )}

      {error ? <p className="err">{error}</p> : null}
    </>
  );
}
