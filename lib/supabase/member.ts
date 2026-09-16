import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";

export interface CurrentMember {
  id: string;
  householdId: string;
  displayName: string;
  initial: string;
}

export type Session =
  | { state: "unconfigured" }
  | { state: "signed-out" }
  | { state: "not-member"; user: User }
  | { state: "member"; user: User; member: CurrentMember };

/**
 * Who is signed in and whether they belong to the household. Membership is
 * by email, so the two accounts can be listed in the database before either
 * person has signed in for the first time.
 */
export async function getSession(): Promise<Session> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { state: "unconfigured" };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { state: "signed-out" };

  const { data } = await supabase
    .from("members")
    .select("id, household_id, display_name, initial, user_id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!data) return { state: "not-member", user };

  if (!data.user_id) {
    // First sign-in: remember which auth user this member is.
    await supabase.from("members").update({ user_id: user.id }).eq("id", data.id);
  }
  return {
    state: "member",
    user,
    member: { id: data.id, householdId: data.household_id, displayName: data.display_name, initial: data.initial },
  };
}
