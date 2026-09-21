import { describe, expect, it } from "vitest";
import { draftIsUsable, normalizeDraft } from "./normalize";

const known = [
  { id: "ing-garlic", name: "Garlic" },
  { id: "ing-chicken", name: "Chicken breast" },
];

const good = {
  name: "Lemon herb chicken",
  type: "d",
  servings: 4,
  method: "oven",
  perServing: { cal: 470, protein: 42, carbs: 46, fat: 13 },
  ingredients: [
    { name: "Chicken breast", qty: 2, unit: "lb", aisle: "Meat & fish" },
    { name: "Garlic", qty: 4, unit: "clove", aisle: "Produce" },
  ],
  steps: ["Sear the chicken.", "Roast 20 minutes."],
  notes: ["Macros are estimated."],
};

describe("normalising a structured draft", () => {
  it("keeps a well-formed answer intact", () => {
    const d = normalizeDraft(good, known);
    expect(d.name).toBe("Lemon herb chicken");
    expect(d.baseServings).toBe(4);
    expect(d.cal).toBe(470);
    expect(d.steps).toHaveLength(2);
    expect(d.guesses).toEqual(["Macros are estimated."]);
    expect(draftIsUsable(d)).toBe(true);
  });

  it("links names the household already cooks with, whatever the casing", () => {
    const d = normalizeDraft(
      { ...good, ingredients: [{ name: "  chicken BREAST ", qty: 1, unit: "lb", aisle: "Meat & fish" }] },
      known,
    );
    expect(d.ingredients[0].ingredientId).toBe("ing-chicken");
    // The canonical spelling wins, so the shopping list still merges.
    expect(d.ingredients[0].name).toBe("Chicken breast");
  });

  it("leaves an unknown ingredient unlinked and guesses its aisle", () => {
    const d = normalizeDraft(
      { ...good, ingredients: [{ name: "Rolled oats", qty: 1, unit: "cup", aisle: "Pantry" }] },
      known,
    );
    expect(d.ingredients[0].ingredientId).toBeNull();
    expect(d.ingredients[0].aisle).toBe("Pantry");
  });

  it("falls back on an unusable unit, aisle or quantity rather than failing", () => {
    const d = normalizeDraft(
      {
        ...good,
        ingredients: [{ name: "Mystery", qty: "lots", unit: "gram", aisle: "Freezer" }],
      },
      known,
    );
    expect(d.ingredients[0].unit).toBe("count");
    expect(d.ingredients[0].qty).toBe(1);
    expect(d.ingredients[0].aisle).toBe("Pantry");
  });

  it("refuses a zero or negative quantity, which the column would reject", () => {
    const d = normalizeDraft(
      { ...good, ingredients: [{ name: "Salt", qty: 0, unit: "tsp", aisle: "Pantry" }] },
      known,
    );
    expect(d.ingredients[0].qty).toBe(1);
  });

  it("drops a repeat of the same ingredient in the same unit", () => {
    const d = normalizeDraft(
      {
        ...good,
        ingredients: [
          { name: "Garlic", qty: 4, unit: "clove", aisle: "Produce" },
          { name: "garlic", qty: 2, unit: "clove", aisle: "Produce" },
          { name: "Garlic", qty: 1, unit: "tbsp", aisle: "Produce" },
        ],
      },
      known,
    );
    expect(d.ingredients).toHaveLength(2);
    expect(d.ingredients.map((i) => i.unit)).toEqual(["clove", "tbsp"]);
  });

  it("substitutes defaults for a missing meal type, method and servings", () => {
    const d = normalizeDraft({ ...good, type: "brunch", method: "airfryer", servings: 0 }, known);
    expect(d.type).toBe("d");
    expect(d.method).toBe("stove");
    expect(d.baseServings).toBe(1);
  });

  it("treats an answer with no ingredients as a failed read", () => {
    const d = normalizeDraft({ ...good, ingredients: [] }, known);
    expect(draftIsUsable(d)).toBe(false);
  });

  it("survives junk without throwing", () => {
    expect(draftIsUsable(normalizeDraft(null, known))).toBe(false);
    expect(normalizeDraft({}, known).name).toBe("New recipe");
    expect(normalizeDraft({ ingredients: "nope", steps: 7 }, known).steps).toEqual([]);
  });
});
