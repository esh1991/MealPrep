"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv, APP_SCHEMA } from "./env";

/**
 * Browser client, pinned to MealPrep's schema in the shared project.
 *
 * A Supabase client talks to one schema. MealPrep only needs its own, so
 * there is one client here rather than the app-plus-platform pair the other
 * apps use. Sign-in is unaffected by the schema setting: auth is shared
 * across every app in the project.
 */
export function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured. Copy .env.example to .env.local.");
  return createBrowserClient(env.url, env.key, { db: { schema: APP_SCHEMA } });
}
