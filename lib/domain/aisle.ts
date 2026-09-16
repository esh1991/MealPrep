import type { Aisle } from "./types";

// Aisle guessing for free-text list items (LIST-7).

const AISLE_WORDS: [Aisle, string[]][] = [
  ["Household", ["paper", "towel", "toilet", "soap", "detergent", "foil", "plastic wrap", "bags", "trash", "sponge", "napkin", "tissue", "dish", "cleaner", "wipes"]],
  ["Meat & fish", ["chicken", "beef", "pork", "turkey", "salmon", "fish", "shrimp", "bacon", "sausage", "steak", "tuna"]],
  ["Dairy & eggs", ["milk", "cheese", "yogurt", "egg", "butter", "cream", "cottage"]],
  ["Bakery", ["bread", "bagel", "tortilla", "bun", "pita", "rolls"]],
  ["Produce", ["apple", "banana", "avocado", "berr", "lemon", "lime", "orange", "tomato", "onion", "potato", "pepper", "spinach", "lettuce", "kale", "herb", "cilantro", "parsley", "basil", "garlic", "ginger", "carrot", "celery", "cucumber", "zucchini", "broccoli", "mushroom", "grape", "fruit", "salad"]],
  ["Pantry", ["coffee", "tea", "rice", "pasta", "oil", "sauce", "spice", "flour", "sugar", "cereal", "oats", "nuts", "chips", "beans", "broth", "stock", "peanut", "granola"]],
];

export function guessAisle(name: string): Aisle {
  const s = name.toLowerCase();
  for (const [aisle, words] of AISLE_WORDS) {
    if (words.some((w) => s.includes(w))) return aisle;
  }
  return "Other";
}

/** Recipe ingredients only live in food aisles. Household and Other become Pantry. */
export function guessFoodAisle(name: string): Aisle {
  const a = guessAisle(name);
  return a === "Household" || a === "Other" ? "Pantry" : a;
}
