// The prototype's sample data, reshaped into domain rows. Used by the unit
// tests as the reference fixture and by the Phase 2 seed.

import type {
  Aisle,
  Context,
  Ingredient,
  MealType,
  Method,
  PantryStatus,
  Rating,
  Recipe,
  RecipeVersion,
  Unit,
  Week,
} from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { freshSlots } from "../slots";

const P: Aisle = "Produce";
const M: Aisle = "Meat & fish";
const DY: Aisle = "Dairy & eggs";
const BK: Aisle = "Bakery";
const PN: Aisle = "Pantry";

export const SHIVA = { id: "m-shiva", name: "Shiva", initial: "S", sortOrder: 0 };
export const DOREEN = { id: "m-doreen", name: "Doreen", initial: "D", sortOrder: 1 };

const STAPLES = ["olive-oil", "salt", "pepper", "cumin", "chili-powder", "garam-masala", "fajita", "honey", "cinnamon", "smoked-paprika"];
const USUAL = ["garlic", "oats", "protein-powder", "chia", "rice-basmati", "rice-jasmine", "quinoa", "soy", "salsa", "peanut-butter"];

const ING: [string, string, Aisle][] = [
  ["eggs", "Eggs", DY],
  ["egg-whites", "Liquid egg whites", DY],
  ["spinach", "Baby spinach", P],
  ["feta", "Feta", DY],
  ["red-onion", "Red onion", P],
  ["olive-oil", "Olive oil", PN],
  ["salt", "Salt", PN],
  ["pepper", "Black pepper", PN],
  ["oats", "Rolled oats", PN],
  ["protein-powder", "Vanilla protein powder", PN],
  ["chia", "Chia seeds", PN],
  ["milk", "2% milk", DY],
  ["greek-yogurt", "Nonfat Greek yogurt", DY],
  ["blueberries", "Blueberries", P],
  ["honey", "Honey", PN],
  ["turkey-sausage", "Turkey breakfast sausage", M],
  ["tortillas", "Low-carb tortillas", BK],
  ["cheddar", "Reduced-fat cheddar", DY],
  ["bell-pepper", "Bell peppers", P],
  ["salsa", "Salsa", PN],
  ["chicken-thighs", "Boneless chicken thighs", M],
  ["garam-masala", "Garam masala", PN],
  ["garlic", "Garlic", P],
  ["lemon", "Lemons", P],
  ["rice-basmati", "Basmati rice", PN],
  ["cucumber", "Cucumbers", P],
  ["cilantro", "Cilantro", P],
  ["ground-turkey", "93% lean ground turkey", M],
  ["black-beans", "Black beans", PN],
  ["romaine", "Romaine", P],
  ["lime", "Limes", P],
  ["cumin", "Cumin", PN],
  ["chili-powder", "Chili powder", PN],
  ["chicken-breast", "Chicken breast", M],
  ["chickpeas", "Chickpeas", PN],
  ["cherry-tomatoes", "Cherry tomatoes", P],
  ["onion", "Yellow onions", P],
  ["fajita", "Fajita seasoning", PN],
  ["salmon", "Salmon fillets", M],
  ["broccoli", "Broccoli", P],
  ["quinoa", "Quinoa", PN],
  ["flank-steak", "Flank steak", M],
  ["soy", "Low-sodium soy sauce", PN],
  ["ginger", "Fresh ginger", P],
  ["rice-jasmine", "Jasmine rice", PN],
  ["cottage-cheese", "Low-fat cottage cheese", DY],
  ["raspberries", "Raspberries", P],
  ["cinnamon", "Cinnamon", PN],
  ["smoked-paprika", "Smoked paprika", PN],
  ["peanut-butter", "Natural peanut butter", PN],
  ["dark-chocolate", "Dark chocolate chips", PN],
];

export const sampleIngredients: Ingredient[] = ING.map(([id, name, defaultAisle]) => ({
  id,
  name,
  defaultAisle,
  pantryStatus: (STAPLES.includes(id) ? "staple" : USUAL.includes(id) ? "usual" : "none") as PantryStatus,
}));

type Ing = [string, number, Unit];

interface Def {
  id: string;
  type: MealType;
  name: string;
  base: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  rating: Rating;
  method: Method;
  source: string;
  ing: Ing[];
  steps: string[];
  versionNo: number;
  note: string;
  changes?: string[];
}

const DEFS: Def[] = [
  {
    id: "b1", type: "b", name: "Egg bite muffins", base: 4, cal: 220, protein: 24, carbs: 6, fat: 11, rating: "keeper", method: "oven", source: "example.com/spinach-egg-bites",
    ing: [["eggs", 6, "count"], ["egg-whites", 2, "cup"], ["spinach", 5, "oz"], ["feta", 3, "oz"], ["red-onion", 1, "count"], ["olive-oil", 1, "tbsp"], ["salt", 0.5, "tsp"], ["pepper", 0.5, "tsp"]],
    steps: ["Heat the oven to 350°F and oil a 12-cup muffin tin.", "Sauté the spinach and onion for 3 minutes, then divide into the cups.", "Whisk the eggs, egg whites, salt and pepper, and pour over.", "Top with feta and bake 22 to 25 minutes.", "Cool completely, then pack 3 per container."],
    versionNo: 2, note: "Swapped 4 eggs for egg whites and cheddar for feta. Lighter, same protein.",
  },
  {
    id: "b2", type: "b", name: "Protein overnight oats", base: 4, cal: 370, protein: 31, carbs: 44, fat: 8, rating: "good", method: "nocook", source: "example.com/overnight-oats",
    ing: [["oats", 2, "cup"], ["protein-powder", 4, "scoop"], ["chia", 3, "tbsp"], ["milk", 2, "cup"], ["greek-yogurt", 1.5, "cup"], ["blueberries", 12, "oz"], ["honey", 2, "tbsp"]],
    steps: ["Stir the oats, protein powder and chia together.", "Whisk in the milk and yogurt until smooth.", "Divide into jars and top with blueberries and a drizzle of honey.", "Refrigerate overnight. Keeps 4 days."],
    versionNo: 2, note: "Added protein powder and halved the honey.",
  },
  {
    id: "b3", type: "b", name: "Turkey sausage breakfast burritos", base: 4, cal: 395, protein: 34, carbs: 24, fat: 18, rating: "good", method: "stove", source: "example.com/freezer-burritos",
    ing: [["turkey-sausage", 1, "lb"], ["eggs", 8, "count"], ["tortillas", 4, "count"], ["cheddar", 3, "oz"], ["bell-pepper", 1, "count"], ["salsa", 0.5, "cup"]],
    steps: ["Brown the sausage with the diced pepper, then set aside.", "Soft-scramble the eggs in the same pan.", "Fill the tortillas with egg, sausage, cheddar and salsa, and roll tight.", "Wrap in foil. Reheat 90 seconds from the fridge or 3 minutes from frozen."],
    versionNo: 1, note: "Original recipe.",
  },
  {
    id: "l1", type: "l", name: "Chicken tikka rice bowls", base: 4, cal: 470, protein: 42, carbs: 52, fat: 10, rating: "keeper", method: "oven", source: "example.com/chicken-tikka-bowls",
    ing: [["chicken-thighs", 2, "lb"], ["greek-yogurt", 1, "cup"], ["garam-masala", 2, "tbsp"], ["garlic", 6, "clove"], ["lemon", 2, "count"], ["rice-basmati", 1.5, "cup"], ["cucumber", 1, "count"], ["red-onion", 1, "count"], ["cilantro", 1, "bunch"]],
    steps: ["Marinate the chicken in yogurt, garam masala, garlic, lemon juice and salt for at least 30 minutes.", "Roast at 425°F on a sheet pan for 22 to 25 minutes. Rest, then slice.", "Cook the rice.", "Toss the cucumber and onion with lemon and cilantro.", "Pack rice, chicken and salad in separate sections."],
    versionNo: 3, note: "Less rice per bowl and double the garlic.", changes: ["Basmati rice 2 cups to 1½ cups", "Garlic 3 cloves to 6 cloves"],
  },
  {
    id: "l2", type: "l", name: "Turkey taco bowls", base: 4, cal: 395, protein: 39, carbs: 28, fat: 14, rating: "good", method: "stove", source: "example.com/taco-bowls",
    ing: [["ground-turkey", 2, "lb"], ["black-beans", 2, "can"], ["romaine", 1, "head"], ["salsa", 1, "cup"], ["cheddar", 3, "oz"], ["lime", 2, "count"], ["cumin", 1, "tbsp"], ["chili-powder", 1, "tbsp"]],
    steps: ["Brown the turkey with cumin, chili powder and salt.", "Rinse and warm the beans.", "Chop the romaine and pack it separately so it stays crisp.", "Top with turkey, beans, salsa, cheddar and a lime wedge."],
    versionNo: 2, note: "Turkey instead of beef. Romaine base, no rice.",
  },
  {
    id: "l3", type: "l", name: "Greek chicken chickpea salad", base: 4, cal: 450, protein: 40, carbs: 36, fat: 16, rating: "keeper", method: "oven", source: "example.com/greek-chickpea-salad",
    ing: [["chicken-breast", 1.5, "lb"], ["chickpeas", 2, "can"], ["cucumber", 2, "count"], ["cherry-tomatoes", 1, "pint"], ["feta", 4, "oz"], ["lemon", 1, "count"], ["olive-oil", 3, "tbsp"]],
    steps: ["Season the chicken and roast at 425°F for 20 minutes. Rest, then dice.", "Rinse the chickpeas. Halve the tomatoes and chop the cucumber.", "Whisk lemon juice and olive oil for the dressing.", "Pack the salad and chicken together, dressing on the side."],
    versionNo: 2, note: "Dressing on the side so it is not soggy by Thursday.",
  },
  {
    id: "d1", type: "d", name: "Sheet-pan chicken fajitas", base: 4, cal: 390, protein: 41, carbs: 30, fat: 12, rating: "keeper", method: "oven", source: "example.com/sheet-pan-fajitas",
    ing: [["chicken-breast", 2, "lb"], ["bell-pepper", 4, "count"], ["onion", 2, "count"], ["lime", 2, "count"], ["tortillas", 8, "count"], ["greek-yogurt", 0.5, "cup"], ["fajita", 2, "tbsp"], ["olive-oil", 2, "tbsp"]],
    steps: ["Slice the chicken, peppers and onions into strips.", "Toss with oil and fajita seasoning and spread over two sheet pans.", "Roast at 425°F for 20 minutes, stirring once.", "Squeeze lime over the top. Pack tortillas and yogurt separately."],
    versionNo: 2, note: "Greek yogurt instead of sour cream, and two extra peppers.",
  },
  {
    id: "d2", type: "d", name: "Lemon garlic salmon and broccoli", base: 4, cal: 460, protein: 38, carbs: 32, fat: 20, rating: "good", method: "oven", source: "example.com/lemon-salmon",
    ing: [["salmon", 1.5, "lb"], ["broccoli", 2, "lb"], ["lemon", 2, "count"], ["garlic", 4, "clove"], ["quinoa", 1, "cup"], ["olive-oil", 2, "tbsp"]],
    steps: ["Cook the quinoa.", "Toss the broccoli with oil and salt and roast at 425°F for 10 minutes.", "Add the salmon with garlic and lemon slices and roast 12 more minutes.", "Pack with quinoa."],
    versionNo: 1, note: "Original recipe.",
  },
  {
    id: "d3", type: "d", name: "Beef and broccoli stir-fry", base: 4, cal: 460, protein: 36, carbs: 48, fat: 14, rating: "work", method: "stove", source: "example.com/beef-broccoli",
    ing: [["flank-steak", 1.5, "lb"], ["broccoli", 1.5, "lb"], ["soy", 0.25, "cup"], ["ginger", 1, "count"], ["garlic", 3, "clove"], ["rice-jasmine", 1.5, "cup"], ["honey", 1, "tbsp"]],
    steps: ["Slice the steak thin against the grain.", "Sear in batches over high heat and set aside.", "Stir-fry the broccoli with ginger and garlic, then add soy and honey.", "Return the beef, toss, and pack over rice."],
    versionNo: 1, note: "Original recipe. Beef went tough on reheating, so slice thinner next time.",
  },
  {
    id: "s1", type: "s", name: "Cottage cheese berry cups", base: 4, cal: 160, protein: 20, carbs: 14, fat: 3, rating: "keeper", method: "nocook", source: "Your own recipe",
    ing: [["cottage-cheese", 3, "cup"], ["raspberries", 6, "oz"], ["honey", 1, "tbsp"], ["cinnamon", 0.5, "tsp"]],
    steps: ["Divide the cottage cheese into small containers.", "Top with berries, a little honey and cinnamon.", "Keep the berries on top so they stay firm. Eat within 4 days."],
    versionNo: 2, note: "Raspberries instead of strawberries. They hold up better in the fridge.",
  },
  {
    id: "s2", type: "s", name: "Crispy roasted chickpeas", base: 4, cal: 180, protein: 8, carbs: 24, fat: 6, rating: "good", method: "oven", source: "example.com/roasted-chickpeas",
    ing: [["chickpeas", 2, "can"], ["olive-oil", 1, "tbsp"], ["smoked-paprika", 1, "tsp"], ["salt", 0.5, "tsp"]],
    steps: ["Rinse the chickpeas and dry them very well.", "Toss with oil, paprika and salt.", "Roast at 425°F for 30 to 35 minutes, shaking the pan twice.", "Cool completely before packing or they go soft."],
    versionNo: 1, note: "Original recipe.",
  },
  {
    id: "s3", type: "s", name: "Peanut butter protein bites", base: 4, cal: 190, protein: 12, carbs: 18, fat: 8, rating: "keeper", method: "nocook", source: "example.com/protein-bites",
    ing: [["oats", 1, "cup"], ["protein-powder", 2, "scoop"], ["peanut-butter", 0.5, "cup"], ["honey", 2, "tbsp"], ["dark-chocolate", 2, "tbsp"]],
    steps: ["Stir everything together until it holds when pressed.", "Roll into 12 bites.", "Chill 30 minutes, then pack 3 per container."],
    versionNo: 2, note: "Swapped half the honey for protein powder.",
  },
];

export const sampleRecipes: Recipe[] = DEFS.map((d) => ({
  id: d.id,
  type: d.type,
  name: d.name,
  method: d.method,
  rating: d.rating,
  sourceKind: "seed",
  sourceRef: d.source,
  openGuesses: [],
  currentVersionId: `v-${d.id}`,
}));

export const sampleVersions: RecipeVersion[] = DEFS.map((d) => ({
  id: `v-${d.id}`,
  recipeId: d.id,
  versionNo: d.versionNo,
  baseServings: d.base,
  cal: d.cal,
  protein: d.protein,
  carbs: d.carbs,
  fat: d.fat,
  steps: d.steps,
  note: d.note,
  changes: d.changes ?? [],
  createdAt: "2026-09-01",
  ingredients: d.ing.map(([ingredientId, qty, unit], i) => ({ ingredientId, qty, unit, sortOrder: i })),
}));

export const sampleContext: Context = {
  members: [SHIVA, DOREEN],
  ingredients: sampleIngredients,
  recipes: sampleRecipes,
  versions: sampleVersions,
  settings: DEFAULT_SETTINGS,
};

/** The prototype's default week: everyone eating except Shiva's Wednesday dinner and Doreen's Tuesday lunch. */
export function sampleWeek(): Week {
  const slots = freshSlots([SHIVA, DOREEN]).map((s) => {
    if (s.day === "Wed" && s.meal === "d" && s.memberId === SHIVA.id) return { ...s, eating: false };
    if (s.day === "Tue" && s.meal === "l" && s.memberId === DOREEN.id) return { ...s, eating: false };
    return s;
  });
  const pick = (id: string, meal: MealType, recipeId: string, portions: number, sortOrder: number) => ({
    id,
    meal,
    recipeId,
    versionId: `v-${recipeId}`,
    portions,
    sortOrder,
  });
  return {
    id: "w-2026-09-21",
    startDate: "2026-09-21",
    snacksEnabled: true,
    slots,
    picks: [
      pick("p1", "b", "b1", 5, 0),
      pick("p2", "b", "b2", 5, 1),
      pick("p3", "l", "l1", 5, 0),
      pick("p4", "l", "l3", 4, 1),
      pick("p5", "d", "d1", 5, 0),
      pick("p6", "d", "d2", 4, 1),
      pick("p7", "s", "s1", 5, 0),
      pick("p8", "s", "s3", 5, 1),
    ],
    pantryChecks: [
      { ingredientId: "garlic", have: true },
      { ingredientId: "oats", have: true },
      { ingredientId: "protein-powder", have: true },
      { ingredientId: "chia", have: true },
    ],
    extras: [
      { id: "x1", name: "Sparkling water", aisle: "Other" },
      { id: "x2", name: "Paper towels", aisle: "Household" },
    ],
    listChecks: {},
    prepDone: {},
  };
}
