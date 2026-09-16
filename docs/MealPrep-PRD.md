# MealPrep — Product Requirements Document

**Owner:** Shiva
**Users:** Shiva and Doreen
**Status:** Prototype approved for look and flow; this document defines v1 for the build
**Prototype:** https://claude.ai/artifact/HewoWEqgVXWmsituB13Beq (file: `mealprep-prototype.html`)
**Last updated:** September 15, 2026

> Build note (September 15, 2026): Instacart (LIST-11, section 9) is parked and not part of v1. Copy list (LIST-12) is the shopping handoff. See `docs/BUILD-PLAN.md`.

---

## 1. Summary

MealPrep is a personal, phone-first web app that organizes one household's weekly meal-prep routine. Each Thursday or Friday, Shiva and Doreen work out how many meals they need for the coming Monday through Friday, choose recipes, build a grocery list that accounts for what is already in the kitchen, buy it on Instacart, and batch-cook on the weekend. Today that process lives in their heads and in scattered notes. MealPrep turns it into one place that stores their recipes, including their own modified versions, and does the counting, scaling, list-making and prep organization for them.

This is not a product for other people. There is no onboarding, pricing, marketing or multi-tenant polish. Every decision should favor speed of use for two people who already know how they want to cook.

## 2. Goals and non-goals

### Goals

1. Store every recipe that has worked, in the version the couple actually cooks, with a history of tweaks.
2. Make Thursday planning take under 10 minutes, from "who's eating when" to a sent grocery list.
3. Produce a grocery list that is correct without manual math: scaled to portions, merged across recipes, and minus pantry items.
4. Show whether a week leans protein-heavy, carb-heavy or balanced before anything is bought.
5. Make weekend prep feel organized: what to cook in what order, how many containers, and what goes in the freezer.
6. Make adding a new recipe nearly effortless: a photo or a messy text dump becomes a structured recipe.

### Non-goals for v1

1. Precise nutrition tracking or daily calorie logging. Macros are estimates for planning.
2. Planning Saturday and Sunday meals.
3. Fully automated purchasing. The app hands off to Instacart and a person checks out.
4. Inventory tracking with quantities. Pantry awareness stays deliberately lightweight (see section 6.4).
5. Sharing recipes outside the household, social features, or support for more than one household.

## 3. Users and context

There are two users with equal permissions: Shiva and Doreen. Both need to see and edit the same household data from their own phones, and changes should show up for the other person without a manual refresh.

Their weekly rhythm drives the design:

| When | What happens | Where in the app |
|---|---|---|
| Thursday or Friday | Count meals for next week, pick recipes, check pantry, build and send the list | Plan, List |
| Friday or Saturday | Groceries arrive through Instacart | Outside the app |
| Weekend | Batch-cook, portion into containers, freeze late-week meals | Prep |
| Weeknights | Move frozen meals to the fridge the night before | This week reminder |
| Any time | Save a recipe they came across, add a random item to the list | Recipes, List |

Shiva prefers meals that are high in protein and lower in calories, which is why macros show up in planning rather than as a separate tracker.

## 4. Design principles

**Sections, not a wizard.** Planning follows a natural order, but no screen depends on finishing the one before it. Every section is reachable directly from the tab bar or the home screen, and each one shows what is incomplete elsewhere (for example, the shopping list warns when lunches still need a recipe).

**Our version is the recipe.** The current saved version is what gets scaled, shopped and cooked. The original source is kept for reference only. Editing never overwrites; it creates a new version.

**Structure over free text.** Every ingredient has a quantity, a unit from a fixed list, and an aisle. That structure is what makes list math, pantry matching, macros and Instacart work, so the app does the structuring for the user rather than asking them to type it.

**Low upkeep beats precision.** The pantry uses two simple lists instead of tracking quantities. Macros are estimates. Portions are assigned to days automatically. Each of these trades a little accuracy for a lot less maintenance.

**One loud element.** The masking-tape label is the visual signature, used for meal slots and container labels. Everything else stays quiet. The prototype is the reference for look and feel.

## 5. Information architecture

The app has five tabs. Plan and List each contain three sections that can be opened in any order.

| Tab | Sections | Purpose |
|---|---|---|
| This week | None | Today's meals, freezer reminder, containers left, quick actions, and a status list linking to every planning section |
| Recipes | Library and recipe detail | Browse, search, rate, tweak and add recipes |
| Plan | Who's eating, Menu, Macros | Decide next week's meals and check the macro balance |
| List | Shopping list, Pantry check, Staples | Build, adjust and send the grocery list |
| Prep | None | Weekend batch-cooking checklist with container labels |

Two actions are available from anywhere a user is likely to want them: **Add a recipe** (home and Recipes) and **Add to list** (home and the top of the shopping list).

## 6. Functional requirements

Priority key: **P0** is required for v1. **P1** is planned for the first update after v1. **P2** is later.

### 6.1 Recipes

| ID | Requirement | Priority |
|---|---|---|
| REC-1 | Library lists all recipes with name, meal type, calories and protein, carbs and fat per serving, rating, and version number when a recipe has been tweaked. | P0 |
| REC-2 | Search matches recipe names and ingredient names. Filter chips narrow by meal type: breakfast, lunch, dinner, snack. | P0 |
| REC-3 | Each recipe has a rating from three options: Keeper, Good, Needs work. Either user can change it. | P0 |
| REC-4 | Recipe detail shows per-serving macros, ingredients, steps, the tweak history, and the original source. | P0 |
| REC-5 | A servings stepper on the detail screen rescales ingredient quantities for viewing without changing the saved recipe. | P0 |
| REC-6 | **Save a tweak** lets the user adjust ingredient quantities, remove or add ingredients, edit macros, and write a note. Saving creates a new version. The change list is generated automatically (for example, "Garlic 3 cloves to 6 cloves"). | P0 |
| REC-7 | Tweak history lists every version newest first, with date, note and changes, and marks the current version. | P0 |
| REC-8 | **Snap a photo:** the user takes or picks a photo of a recipe (cookbook page, screenshot, handwritten card) and the app returns a structured draft. | P0 |
| REC-9 | **Paste a word dump:** the user pastes unstructured notes and the app returns a structured draft. | P0 |
| REC-10 | Every structured draft opens on a review screen showing name, meal type, servings, macros, ingredients, steps, and a "Guesses to check" list. The user can change name and meal type before saving. | P0 |
| REC-11 | Guesses stay visible on the saved recipe as "Check these guesses" until someone taps **Looks right**. | P0 |
| REC-12 | **Type it in:** create a recipe with a name and meal type, then fill in ingredients and macros through Save a tweak. | P0 |
| REC-13 | **Paste a link:** import from a recipe URL. | P1 |
| REC-14 | **Add to next week** from recipe detail adds the recipe to the matching meal in next week's menu, covering any uncovered portions. | P0 |
| REC-15 | Restore an earlier version as a new current version. | P1 |
| REC-16 | Keep the original photo attached to recipes created from a photo. | P2 |

### 6.2 Plan: Who's eating

| ID | Requirement | Priority |
|---|---|---|
| EAT-1 | A grid shows Monday through Friday as rows and meals as columns. Each cell holds one tag per person (S and D). All tags start on. | P0 |
| EAT-2 | Tapping a person's tag takes that meal off (for example, Shiva has dinner out Wednesday). Tapping again puts it back. | P0 |
| EAT-3 | Tapping a day label clears the whole day, or restores it if it is already fully cleared. | P0 |
| EAT-4 | A Snacks switch adds or removes a snack column. When off, snacks are excluded from the menu, list, macros and prep. | P0 |
| EAT-5 | Totals below the grid show the count per meal type and the overall total, and update immediately. | P0 |
| EAT-6 | Copy last week's who's-eating pattern as a starting point. | P1 |

### 6.3 Plan: Menu

| ID | Requirement | Priority |
|---|---|---|
| MENU-1 | One section per active meal type lists the chosen recipes, each with a portion stepper. | P0 |
| MENU-2 | Each section shows coverage: "All 9 covered", "2 still to cover", or "1 extra". | P0 |
| MENU-3 | **Add a recipe** opens a picker of recipes for that meal type, with ratings and macros. Adding a recipe covers any remaining portions; if all portions are covered, portions are split evenly. | P0 |
| MENU-4 | **Split evenly** distributes the meal's total across its chosen recipes. With one recipe, the action reads "Make it 9". | P0 |
| MENU-5 | Reducing a recipe's portions to zero removes it from the menu. | P0 |
| MENU-6 | A macro summary bar at the top shows the week's split and opens Macros when tapped. | P0 |
| MENU-7 | When a recipe is added to a week, that week pins the recipe version. Later tweaks do not change an already-planned week's list or prep. | P0 |
| MENU-8 | Suggest recipes that haven't been cooked in a while or are rated Keeper. | P2 |

### 6.4 List: Shopping list, Pantry check, Staples

| ID | Requirement | Priority |
|---|---|---|
| LIST-1 | The shopping list is generated from the menu: each recipe's ingredients are scaled to its portions, merged across recipes, rounded (section 7.3), and grouped by aisle. | P0 |
| LIST-2 | Each item shows quantity, name, and which recipes need it. | P0 |
| LIST-3 | Items on the **Always have** list (staples) never appear on the shopping list. | P0 |
| LIST-4 | Items on the **Usually have** list appear in Pantry check with Have it or Buy. Only items marked Buy go on the list. The default is Buy. | P0 |
| LIST-5 | Pantry check lists skipped staples in a collapsed section so nothing disappears silently. | P0 |
| LIST-6 | Staples lets either user add or remove items on both lists. Adding an item whose name matches a known ingredient links it to that ingredient. | P0 |
| LIST-7 | A quick-add field at the top of the shopping list, and an **Add to list** sheet on home, add any free-text item (for example "Paper towels"). The app guesses an aisle, including Household and Other. | P0 |
| LIST-8 | The Add to list sheet offers one-tap quick picks and shows items added so far, each removable. | P0 |
| LIST-9 | Tapping an item crosses it off. Crossed-off items are excluded from what is sent to Instacart. | P0 |
| LIST-10 | The shopping list warns at the top when any meal still needs a recipe, with a link to Menu. | P0 |
| LIST-11 | **Send to Instacart** creates an Instacart shopping list from the uncrossed items and opens it (section 9). | P0 (parked) |
| LIST-12 | **Copy list** copies a plain-text version grouped by aisle. | P0 |
| LIST-13 | Quick picks learn from items the household adds most often. | P2 |

### 6.5 Plan: Macros

| ID | Requirement | Priority |
|---|---|---|
| MAC-1 | Each recipe stores calories, protein, carbs and fat per serving. | P0 |
| MAC-2 | The Macros section labels the week (Protein-heavy, Carb-heavy, Fat-heavy, or Balanced) and shows the protein, carbs and fat share of calories in large numbers and a bar. | P0 |
| MAC-3 | It shows each person's daily average at home: calories and grams of protein, carbs and fat. | P0 |
| MAC-4 | A by-day chart shows one stacked bar per person per day, scaled to the largest day, with total calories. Days a person is not eating at home read "out". | P0 |
| MAC-5 | When a lower-carb alternative exists, a tip names the menu's highest-carb recipe and offers a one-tap swap to an alternative of the same meal type. | P0 |
| MAC-6 | The section states that meals out are not counted. | P0 |
| MAC-7 | Per-person protein or calorie targets, with progress shown against them. | P1 |
| MAC-8 | Look up macros from a nutrition database instead of estimating. | P2 |

### 6.6 Prep

| ID | Requirement | Priority |
|---|---|---|
| PREP-1 | Prep lists one batch per chosen recipe, grouped in cooking order: Oven, Stovetop, No-cook. Each group has a one-line instruction. | P0 |
| PREP-2 | Each batch shows meal type, servings to make, and the multiple of the base recipe (for example, ×1.25). | P0 |
| PREP-3 | Each batch shows container labels by day (for example, "Mon ×2"). Thursday and Friday labels are marked **freeze**. | P0 |
| PREP-4 | A checkbox marks each batch done. A progress bar and totals show batches done, containers, and containers to freeze. | P0 |
| PREP-5 | Tapping a batch opens the recipe at the batch's servings. | P0 |
| PREP-6 | When there is nothing to prep, the screen links to Menu. | P0 |
| PREP-7 | A merged, timed prep sequence across all batches (for example, "start rice while the oven heats"). | P2 |

### 6.7 This week (home)

| ID | Requirement | Priority |
|---|---|---|
| HOME-1 | Quick actions at the top: Add a recipe, Add to list. | P0 |
| HOME-2 | Today's meals by meal type, with who is eating each and a note when someone is out. | P0 |
| HOME-3 | A "Next week" list with one row each for Who's eating, Menu, Macros, Shopping list, and Prep day. Each row shows a live status and opens that section. | P0 |
| HOME-4 | A freezer reminder the night before a frozen meal is due, with **Remind me**. | P1 (in-app card is P0; push notification is P1) |
| HOME-5 | Containers left per remaining day, with frozen counts. | P1 |

## 7. Business rules

### 7.1 Counting meals

A meal slot is one person, one day, one meal type. The total for a meal type is the number of slots switched on. Snack slots count only when snacks are enabled for that week.

### 7.2 Assigning portions to days

Slots for each meal type are ordered by day (Monday first) and then by person (Shiva, then Doreen). Recipes fill slots in the order they appear on the menu. If portions exceed slots, the remainder is labeled "Extra" in Prep. This rule is a simplification that keeps planning fast; manual assignment is an open question (section 12).

### 7.3 Building the list

For each chosen recipe, the scale factor is portions divided by the recipe's base servings. Every ingredient quantity is multiplied by that factor. Ingredients merge when both the ingredient and the unit match. Merged quantities are rounded up as follows:

| Unit | Rounding |
|---|---|
| count, can, pint, head, bunch, scoop, clove | Up to a whole number, minimum 1 |
| lb, cup | Up to the nearest ¼ |
| tbsp, tsp | Up to the nearest ½ |
| oz | Up to a whole number |

Pantry classification happens after merging. Staples are removed. Usually-have items are removed only when marked Have it for that week. Free-text extras are appended. Crossed-off items stay visible but are excluded from Instacart.

### 7.4 Macros

Calories from each macro are protein × 4, carbs × 4, fat × 9. Shares are each macro's calories over the sum of the three. The week label uses the first threshold that matches, in this order:

| Condition | Label |
|---|---|
| Protein ≥ 35% | Protein-heavy week |
| Carbs ≥ 45% | Carb-heavy week |
| Fat ≥ 35% | Fat-heavy week |
| Otherwise | Balanced week |

Thresholds should live in settings so they can be tuned. A person's daily average divides their totals by the number of days they eat at least one meal at home. The swap tip picks the chosen recipe with the most carbs, then suggests a recipe of the same meal type that is not on the menu, has fewer carbs, and has the best protein-minus-carbs score.

### 7.5 Freezing

Containers for Thursday and Friday are marked freeze, based on a weekend prep day and the usual 3 to 4 day fridge guideline for cooked food. Freeze days should be a household setting.

### 7.6 Versioning

Versions are numbered from 1 and never deleted. The highest version is current. A planned week references the version that was current when the recipe was added to it (MENU-7).

## 8. Recipe structuring with Claude

Photos and word dumps are sent server-side to the Anthropic Messages API from a Next.js route handler. The API key never reaches the browser. Photos are sent as base64 images; notes are sent as text, truncated to about 8,000 characters.

The model returns one JSON object in this shape, which the prototype already uses:

```json
{
  "name": "string",
  "type": "b | l | d | s",
  "servings": 4,
  "method": "oven | stove | nocook",
  "perServing": { "cal": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "ingredients": [
    { "name": "Chicken breast", "qty": 2, "unit": "lb", "aisle": "Meat & fish" }
  ],
  "steps": ["string"],
  "notes": ["Anything guessed or unreadable"]
}
```

Units must come from the fixed list in section 7.3. Aisles must be one of Produce, Meat & fish, Dairy & eggs, Bakery, Pantry. The prompt instructs the model to keep the recipe's own quantities, use short grocery names without prep words, estimate servings when missing, estimate macros per serving, cap steps at eight, and list every guess in `notes`.

The server validates and normalizes the response before the client sees it. Unknown units become `count`, unknown aisles become `Pantry`, and non-numeric quantities become 1. Each ingredient name is matched case-insensitively against the household's existing ingredients so pantry lists and list merging keep working; unmatched names create new ingredients. A response with no ingredients is treated as a failure.

Errors map to plain messages: rate limit ("Try again in a minute"), unreadable photo ("Try a clearer or smaller one"), refusal, and a generic retry. A Stop button cancels a running request.

For link import (REC-13), fetch the page server-side, parse `schema.org/Recipe` JSON-LD when present, and fall back to sending the page text through the same structuring prompt.

## 9. Instacart integration (parked)

Instacart's Developer Platform offers an endpoint that creates a shopping list page from line items and returns a link. The user opens the link, chooses a store, adds items to the cart, and checks out in Instacart. The app does not place orders.

Build notes to confirm against Instacart's current documentation before starting:

1. API access requires approval through the Developer Platform. Apply early, because it gates LIST-11.
2. Line items must use Instacart's supported units, or quantity matching fails. Map the app's units to Instacart's list in one place.
3. Instacart recommends caching the generated link and creating a new one only when the list changes. Store the link on the week with a hash of the items sent.
4. Instacart also runs an MCP server with create-recipe and create-shopping-list tools. A direct REST call from a route handler is simpler for this app.
5. Free-text extras with no quantity are sent as single items.

Until access is approved, **Send to Instacart** falls back to Copy list.

## 10. Data model

The model assumes Supabase (Postgres, auth, row-level security, realtime). All tables except `households` carry `household_id`, and row-level security limits reads and writes to members of that household.

| Table | Key columns | Notes |
|---|---|---|
| `households` | `id`, `name`, `settings` (jsonb: snacks default, freeze days, prep day, macro thresholds) | One row |
| `members` | `user_id`, `household_id`, `display_name`, `initial` | Shiva (S), Doreen (D) |
| `ingredients` | `id`, `name`, `default_aisle`, `pantry_status` (none, staple, usual) | Canonical names; pantry lists live here |
| `recipes` | `id`, `type`, `name`, `method`, `rating`, `source_kind` (photo, notes, link, manual), `source_ref`, `open_guesses` (text[]), `current_version` | |
| `recipe_versions` | `id`, `recipe_id`, `version_no`, `base_servings`, `cal`, `protein_g`, `carbs_g`, `fat_g`, `steps` (text[]), `note`, `changes` (text[]), `created_by`, `created_at` | Never updated after insert |
| `recipe_version_ingredients` | `version_id`, `ingredient_id`, `qty`, `unit`, `sort_order` | `unit` is an enum |
| `weeks` | `id`, `start_date` (Monday), `snacks_enabled`, `instacart_url`, `instacart_items_hash`, `sent_at` | One row per planned week |
| `week_slots` | `week_id`, `day`, `meal`, `member_id`, `eating` | 40 rows per week with snacks |
| `week_picks` | `id`, `week_id`, `meal`, `recipe_id`, `version_id`, `portions`, `sort_order` | Pins the version |
| `week_pantry_checks` | `week_id`, `ingredient_id`, `have` | |
| `week_extras` | `id`, `week_id`, `name`, `aisle`, `created_by` | |
| `week_list_checks` | `week_id`, `item_key`, `checked` | `item_key` is ingredient and unit, or extra id |
| `week_prep_status` | `week_id`, `pick_id`, `done` | |

The shopping list, macro totals, container labels and home statuses are computed from these tables, not stored.

## 11. Technical approach

**Stack:** Next.js on Vercel, Supabase for the database and Google sign-in, the Anthropic API for recipe structuring, and Instacart's Developer Platform API. Built with Claude Code.

**App shape:** A mobile-first web app installable to the home screen as a PWA. Design for a 380 px viewport first. Both phones should reflect changes within a few seconds through Supabase realtime on the current week's tables.

**Reusing the prototype:** The prototype is a single HTML file with the full visual system (color tokens with light and dark modes, type scale, tape components) and working client-side versions of every business rule in section 7. Port its CSS tokens directly, and treat its functions for aggregation, rounding, assignment and macro math as the reference implementation for unit tests.

**Cost:** Two users stay well within Supabase's free tier. Claude API cost is a few cents per imported recipe.

**Quality bar:** Responsive down to 360 px, visible keyboard focus, reduced-motion support, and every destructive action either confirmable or undoable.

## 12. Open questions

1. **Portion assignment.** Is automatic day assignment good enough, or do you want to choose which recipe goes to which day?
2. **Macro targets.** Should each person have their own protein or calorie target (MAC-7), and what are they?
3. **Weekends and leftovers.** Do extra portions or skipped meals roll into the weekend or the next week?
4. **Nutrition accuracy.** Are estimated macros enough, or is a nutrition database worth the added setup (MAC-8)?
5. **Store choice.** Is there one usual Instacart store, so the app can remember it?
6. **Freezer reminders.** Is an in-app card enough, or do you want push notifications (HOME-4)?
7. **Doreen's input.** Does Doreen want anything the prototype does not cover?

## 13. Release plan

| Release | Scope | Done when |
|---|---|---|
| v1 | All P0 requirements, with Copy list standing in for Instacart if access is still pending | One real week is planned, shopped and prepped entirely in the app |
| v1.1 | Instacart send (if not in v1), link import, restore version, copy last week, macro targets, push reminders, containers left | Thursday planning takes under 10 minutes for two consecutive weeks |
| Later | Nutrition database, timed prep sequence, learned quick picks, recipe suggestions, original photo storage | Driven by what the first month of use shows |

## 14. Prototype reference

| Prototype screen | Requirements |
|---|---|
| This week | HOME-1 to HOME-5 |
| Recipes, recipe detail, Save a tweak | REC-1 to REC-7, REC-11, REC-14 |
| Add a recipe sheet (photo, word dump, link, type it in) | REC-8 to REC-10, REC-12, REC-13 |
| Plan › Who's eating | EAT-1 to EAT-5 |
| Plan › Menu | MENU-1 to MENU-6 |
| Plan › Macros | MAC-2 to MAC-6 |
| List › Shopping list, Add to list sheet, Instacart sheet | LIST-1, LIST-2, LIST-7 to LIST-12 |
| List › Pantry check, Staples | LIST-3 to LIST-6 |
| Prep | PREP-1 to PREP-6 |

In the prototype, photo and word-dump import call Claude for real when opened in claude.ai. Link import, Instacart, reminders and copy are simulated. Data is saved in the browser only, so the two phones do not share state.
