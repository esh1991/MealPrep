"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MacroLine } from "@/components/Macros";
import { useHousehold } from "@/lib/household/context";
import { MEALS, mealName, type MealType } from "@/lib/domain";
import AddRecipeSheet from "./AddRecipeSheet";

const RATING_LABEL = { keeper: "Keeper", good: "Good", work: "Needs work" } as const;

type Filter = MealType | "all";

export default function RecipeLibrary() {
  const { recipes, versions, ingredients, currentVersion } = useHousehold();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);

  const tweaked = useMemo(
    () => recipes.filter((r) => versions.filter((v) => v.recipeId === r.id).length > 1).length,
    [recipes, versions],
  );

  // Search matches recipe names and ingredient names (REC-2).
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nameById = new Map(ingredients.map((i) => [i.id, i.name.toLowerCase()]));
    return recipes.filter((r) => {
      if (filter !== "all" && r.type !== filter) return false;
      if (!q) return true;
      if (r.name.toLowerCase().includes(q)) return true;
      const version = currentVersion(r);
      return !!version?.ingredients.some((vi) => nameById.get(vi.ingredientId)?.includes(q));
    });
  }, [recipes, ingredients, filter, query, currentVersion]);

  return (
    <>
      <header className="top">
        <h1>Recipes</h1>
        <p className="sub">
          {recipes.length} saved{tweaked ? `, ${tweaked} with your tweaks` : ""}
        </p>
      </header>

      <div className="search">
        <input
          type="search"
          placeholder="Search recipes or ingredients"
          aria-label="Search recipes or ingredients"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chips" role="group" aria-label="Filter by the meal a recipe is usually eaten at">
        {([["all", "All"], ...MEALS.map((m) => [m.k, m.n] as const)] as [Filter, string][]).map(
          ([k, label]) => (
            <button
              key={k}
              className={`chip ${filter === k ? "on" : ""}`}
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {shown.length ? (
        <ul className="rows">
          {shown.map((r) => {
            const version = currentVersion(r);
            const count = versions.filter((v) => v.recipeId === r.id).length;
            return (
              <li key={r.id}>
                <Link className="row" href={`/recipes/${r.id}`}>
                  <span className="row-main">
                    <span className="row-title">
                      {r.name}
                      {count > 1 ? <span className="ver">v{version?.versionNo ?? count}</span> : null}
                    </span>
                    <span className="row-meta">
                      {mealName(r.type)}, <MacroLine macros={version} />
                    </span>
                  </span>
                  <span className={`rate ${r.rating}`}>{RATING_LABEL[r.rating]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">
          {query
            ? `No recipes match "${query}". Try an ingredient, like chicken.`
            : "No recipes yet. Add one below."}
        </p>
      )}

      <button className="btn" onClick={() => setAdding(true)}>
        Add a recipe
      </button>

      {adding ? <AddRecipeSheet onClose={() => setAdding(false)} /> : null}
    </>
  );
}
