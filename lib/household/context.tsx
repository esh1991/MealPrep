"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadAll, type AppData } from "@/lib/supabase/all";
import { APP_SCHEMA } from "@/lib/supabase/env";
import type { Context, Recipe, RecipeVersion, Week } from "@/lib/domain";

interface HouseholdValue extends Context {
  householdId: string;
  householdName: string;
  /** The signed-in member, for stamping who made a change. */
  memberId: string;
  /** Next week. What the home screen points at. */
  planningWeek: Week | null;
  /** This week, for the home screen. */
  currentWeek: Week | null;
  /** The week being worked on in Plan, List and Prep. */
  selectedWeek: Week | null;
  selectedWeekStart: string;
  /** Switch which week Plan, List and Prep are working on. */
  selectWeek: (weekStart: string) => Promise<void>;
  today: string;
  /** Re-read everything from the database. */
  refresh: () => Promise<void>;
  refreshing: boolean;
  recipeById: (id: string) => Recipe | undefined;
  versionById: (id: string) => RecipeVersion | undefined;
  currentVersion: (recipe: Recipe) => RecipeVersion | undefined;
  versionsOf: (recipeId: string) => RecipeVersion[];
}

const Ctx = createContext<HouseholdValue | null>(null);

// Tables both phones should stay in sync on.
const WATCHED = [
  "recipes",
  "recipe_versions",
  "recipe_version_ingredients",
  "ingredients",
  "weeks",
  "week_slots",
  "week_picks",
  "week_pantry_checks",
  "week_extras",
  "week_list_checks",
  "week_prep_status",
];

export function HouseholdProvider({
  initial,
  memberId,
  children,
}: {
  initial: AppData;
  memberId: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Held in a ref so the realtime handler always refetches the week that is
  // on screen rather than the one that was selected when it subscribed.
  const selected = useRef(initial.selectedWeekStart);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const next = await loadAll(createClient(), undefined, selected.current);
      if (next) setData(next);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const selectWeek = useCallback(
    async (weekStart: string) => {
      selected.current = weekStart;
      await refresh();
    },
    [refresh],
  );

  // Realtime is a refetch, not a merge. Two people editing the same thing at
  // once is rare, and the whole household is a small read.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("household");
    for (const table of WATCHED) {
      channel.on("postgres_changes", { event: "*", schema: APP_SCHEMA, table }, () => {
        if (pending.current) clearTimeout(pending.current);
        pending.current = setTimeout(() => void refresh(), 300);
      });
    }
    channel.subscribe();
    return () => {
      if (pending.current) clearTimeout(pending.current);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Coming back to the app after it has been in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const value = useMemo<HouseholdValue>(() => {
    const { household } = data;
    const recipeById = (id: string) => household.recipes.find((r) => r.id === id);
    const versionById = (id: string) => household.versions.find((v) => v.id === id);
    return {
      ...household,
      memberId,
      planningWeek: data.planningWeek,
      currentWeek: data.currentWeek,
      selectedWeek: data.selectedWeek,
      selectedWeekStart: data.selectedWeekStart,
      selectWeek,
      today: data.today,
      refresh,
      refreshing,
      recipeById,
      versionById,
      currentVersion: (recipe: Recipe) => versionById(recipe.currentVersionId),
      versionsOf: (recipeId: string) =>
        household.versions
          .filter((v) => v.recipeId === recipeId)
          .sort((a, b) => a.versionNo - b.versionNo),
    };
  }, [data, memberId, refresh, refreshing, selectWeek]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHousehold(): HouseholdValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHousehold must be used inside HouseholdProvider");
  return v;
}
