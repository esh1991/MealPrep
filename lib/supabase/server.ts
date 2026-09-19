import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv, APP_SCHEMA } from "./env";
import type { Database } from "./database.types";

/**
 * Server client for server components, route handlers and server actions.
 * Pinned to MealPrep's schema in the shared project.
 */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error("Supabase is not configured. Copy .env.example to .env.local.");
  const cookieStore = await cookies();
  return createServerClient<Database, typeof APP_SCHEMA>(env.url, env.key, {
    db: { schema: APP_SCHEMA },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a server component, where cookies are read-only. The
          // proxy refreshes sessions, so this is safe to ignore.
        }
      },
    },
  });
}
