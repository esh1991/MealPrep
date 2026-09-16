import { AISLES, type Aisle, type Context, type Unit, type Week } from "./types";
import { activeMeals } from "./slots";
import { picksFor } from "./menu";
import { recipeById, versionById } from "./assign";
import { formatQty } from "./units";

// Building the list, PRD 7.3.

export interface AggregatedItem {
  ingredientId: string;
  name: string;
  aisle: Aisle;
  unit: Unit;
  /** Unrounded merged quantity. */
  qty: number;
  /** Recipe names that need it. */
  from: string[];
}

export interface Aggregate {
  /** Always-have items, removed from the list. */
  staples: AggregatedItem[];
  /** Usually-have items, asked about in Pantry check. */
  check: AggregatedItem[];
  /** Everything else. */
  buy: AggregatedItem[];
}

/** Scale each pick's ingredients and merge on ingredient and unit. */
export function aggregate(week: Week, ctx: Context): Aggregate {
  const map = new Map<string, AggregatedItem>();
  for (const meal of activeMeals(week)) {
    for (const pick of picksFor(week, meal)) {
      const recipe = recipeById(ctx, pick.recipeId);
      const version = versionById(ctx, pick.versionId);
      if (!recipe || !version || !pick.portions) continue;
      const factor = pick.portions / version.baseServings;
      for (const vi of version.ingredients) {
        const ing = ctx.ingredients.find((i) => i.id === vi.ingredientId);
        if (!ing) continue;
        const key = `${ing.id}|${vi.unit}`;
        let item = map.get(key);
        if (!item) {
          item = { ingredientId: ing.id, name: ing.name, aisle: ing.defaultAisle, unit: vi.unit, qty: 0, from: [] };
          map.set(key, item);
        }
        item.qty += vi.qty * factor;
        if (!item.from.includes(recipe.name)) item.from.push(recipe.name);
      }
    }
  }
  const all = [...map.values()];
  const status = (id: string) => ctx.ingredients.find((i) => i.id === id)?.pantryStatus ?? "none";
  return {
    staples: all.filter((x) => status(x.ingredientId) === "staple"),
    check: all.filter((x) => status(x.ingredientId) === "usual"),
    buy: all.filter((x) => status(x.ingredientId) === "none"),
  };
}

export interface ListItem {
  /** "ingredientId|unit" for recipe items, "x:<extraId>" for extras. */
  key: string;
  name: string;
  /** Rounded label such as "3¾ cups". Empty for free-text extras. */
  qtyLabel: string;
  aisle: Aisle;
  from: string;
  extra: boolean;
  extraId?: string;
  checked: boolean;
}

/** The shopping list: buy items, usually-have items not marked Have it, then extras. */
export function buyItems(week: Week, ctx: Context): ListItem[] {
  const a = aggregate(week, ctx);
  const have = new Set(week.pantryChecks.filter((c) => c.have).map((c) => c.ingredientId));
  const items: ListItem[] = a.buy
    .concat(a.check.filter((x) => !have.has(x.ingredientId)))
    .map((x) => {
      const key = `${x.ingredientId}|${x.unit}`;
      return {
        key,
        name: x.name,
        qtyLabel: formatQty(x.qty, x.unit),
        aisle: x.aisle,
        from: x.from.join(", "),
        extra: false,
        checked: !!week.listChecks[key],
      };
    });
  for (const e of week.extras) {
    const key = `x:${e.id}`;
    items.push({
      key,
      name: e.name,
      qtyLabel: "",
      aisle: e.aisle,
      from: "Added by you",
      extra: true,
      extraId: e.id,
      checked: !!week.listChecks[key],
    });
  }
  return items;
}

export function toBuyCount(week: Week, ctx: Context): number {
  return buyItems(week, ctx).filter((i) => !i.checked).length;
}

/** Aisle groups in the fixed aisle order, skipping empty aisles. */
export function groupByAisle(items: ListItem[]): { aisle: Aisle; items: ListItem[] }[] {
  return AISLES.map((aisle) => ({ aisle, items: items.filter((i) => i.aisle === aisle) })).filter(
    (g) => g.items.length,
  );
}

/** Plain-text list for Copy list (LIST-12). Crossed-off items are left out. */
export function listAsText(items: ListItem[]): string {
  const lines: string[] = [];
  for (const g of groupByAisle(items.filter((i) => !i.checked))) {
    lines.push(g.aisle);
    for (const i of g.items) lines.push(i.qtyLabel ? `- ${i.qtyLabel} ${i.name}` : `- ${i.name}`);
    lines.push("");
  }
  return lines.join("\n").trim();
}
