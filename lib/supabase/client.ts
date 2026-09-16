"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Browser client. Safe to call on every render; the SSR package reuses one instance. */
export function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured. Copy .env.example to .env.local.");
  return createBrowserClient(env.url, env.key);
}
