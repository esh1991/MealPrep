/** MealPrep's schema in the shared Supabase project. */
export const APP_SCHEMA = "app_mealprep";

export function supabaseEnv(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** False until .env.local (or Vercel) has the Supabase URL and anon key. */
export function isSupabaseConfigured(): boolean {
  return supabaseEnv() !== null;
}

/** The Google client ID for MealPrep's own Cloud project. See docs/SETUP-GOOGLE.md. */
export function googleClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
}
