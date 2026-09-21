import * as z from "zod";
import { UNITS } from "@/lib/domain";

// The shape Claude must return, and the instructions that produce it.
// Mirrors PRD section 8.

export const FOOD_AISLE_NAMES = ["Produce", "Meat & fish", "Dairy & eggs", "Bakery", "Pantry"] as const;

export const RecipeDraftSchema = z.object({
  name: z.string(),
  type: z.enum(["b", "l", "d", "s"]),
  servings: z.number(),
  method: z.enum(["oven", "stove", "nocook"]),
  perServing: z.object({
    cal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  ingredients: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      unit: z.enum(UNITS),
      aisle: z.enum(FOOD_AISLE_NAMES),
    }),
  ),
  steps: z.array(z.string()),
  notes: z.array(z.string()),
});

export type RecipeDraft = z.infer<typeof RecipeDraftSchema>;

export const PROMPT = `You turn a recipe into structured data for a meal-prep app used by a couple who batch-cook on weekends.

Rules:
- type: b breakfast, l lunch, d dinner, s snack. Pick the most likely. It is only a hint for sorting; any recipe can be eaten at any meal.
- Keep the recipe's own quantities. Write fractions as decimals. Use "count" for whole items like onions or eggs.
- Ingredient names are short grocery names with a capital first letter, like "Chicken breast" or "Baby spinach". Put prep words (diced, minced) in the steps, not the names.
- Units must come from the fixed list. If something is measured in a unit that is not on the list, such as grams or millilitres, convert it to the closest listed unit.
- If servings are missing, estimate them from the quantity of the main ingredient.
- Estimate calories, protein, carbs and fat per serving from the ingredients, as whole numbers.
- method is the main cooking method for the batch. Pressure cookers and slow cookers count as stove.
- steps are short imperative sentences, at most 8. Keep any warning that stops the dish going wrong.
- notes list, in plain short sentences, anything you guessed or could not read: servings, unclear amounts, estimated macros, converted units. Empty list if nothing was guessed.`;

export const PHOTO_INSTRUCTION =
  "The attached image is a photo of a recipe, such as a cookbook page, a screenshot or a handwritten card. Read it and structure it.";

export const NOTES_INSTRUCTION = "Recipe notes:";
