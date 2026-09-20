-- Instant Pot chicken curry, added from Shiva's notes.
--
-- Hand-structured the way the Phase 7 importer will do it automatically:
-- quantities in the app's fixed units, short grocery names, an aisle each,
-- and every estimate recorded as an open guess so it shows on the recipe
-- until someone taps Looks right.
--
-- Safe to re-run: it inserts only what is missing.

-- Ingredients this recipe needs that the household does not have yet.
-- Water, oil, turmeric and coriander powder go straight onto the always-have
-- list so they never reach the shopping list.
insert into app_mealprep.ingredients (household_id, name, default_aisle, pantry_status)
select h.id, v.name, v.aisle::app_mealprep.aisle, v.status::app_mealprep.pantry_status
from app_mealprep.households h
cross join (values
  ('Shallots',                  'Produce',     'none'),
  ('Tomatoes',                  'Produce',     'none'),
  ('Curry leaves',              'Produce',     'none'),
  ('Green chilies',             'Produce',     'none'),
  ('Cashews',                   'Pantry',      'none'),
  ('Poppy seeds',               'Pantry',      'none'),
  ('Turmeric',                  'Pantry',      'staple'),
  ('Coriander powder',          'Pantry',      'staple'),
  ('Cooking oil',               'Pantry',      'staple'),
  ('Water',                     'Pantry',      'staple'),
  ('Bone-in chicken curry cut', 'Meat & fish', 'none')
) as v(name, aisle, status)
on conflict (household_id, name) do nothing;

-- The recipe.
insert into app_mealprep.recipes
  (household_id, type, name, method, rating, source_kind, source_ref, open_guesses)
select
  h.id,
  'd'::app_mealprep.meal_type,
  'Instant Pot chicken curry',
  'stove'::app_mealprep.method,
  'good'::app_mealprep.rating,
  'notes'::app_mealprep.source_kind,
  'From your notes',
  array[
    'Servings estimated at 6 from 975 g of bone-in chicken.',
    'Macros are estimated from the ingredients, and the 4½ tbsp of oil drives the fat share.',
    'Curry leaves and coriander are each listed as one bunch, since sprigs are not a unit you can shop in.',
    'Yogurt is matched to the Greek yogurt already in your list so quantities merge.'
  ]
from app_mealprep.households h
where not exists (
  select 1 from app_mealprep.recipes r
  where r.household_id = h.id and r.name = 'Instant Pot chicken curry'
);

-- Version 1.
insert into app_mealprep.recipe_versions
  (household_id, recipe_id, version_no, base_servings, cal, protein_g, carbs_g, fat_g, steps, note)
select r.household_id, r.id, 1, 6, 375, 27, 17, 21,
  array[
    'Blend the shallots, garlic, ginger, tomatoes, coriander leaves, curry leaves, chilies, cashews, poppy seeds, ground spices, yogurt and salt to a fine paste. Add water only if the blender struggles, because a thick paste sautés better.',
    'Set the Instant Pot to Sauté on Normal. Heat the oil, add the paste and cook 6 to 8 minutes, stirring and scraping the bottom, until it darkens and oil shows at the edges. Undercooked paste is what makes the curry taste raw.',
    'Add the chicken and sauté 5 minutes, turning to coat every piece in the masala.',
    'Press Cancel, pour in the water and scrape the bottom clean with a wooden spoon. Skipping this is what triggers the BURN error.',
    'Lock the lid, set the valve to Sealing and pressure cook on High for 6 minutes, or 4 minutes if boneless.',
    'Let the pressure release naturally for 10 minutes, then quick-release the rest. Natural release keeps the chicken tender.',
    'Taste for salt. If the gravy is thin, simmer on Sauté to thicken, then stir through the chopped coriander.'
  ],
  'Added from your notes, scaled for 6.'
from app_mealprep.recipes r
where r.name = 'Instant Pot chicken curry'
  and not exists (
    select 1 from app_mealprep.recipe_versions rv where rv.recipe_id = r.id and rv.version_no = 1
  );

-- Make it the current version.
update app_mealprep.recipes r
set current_version_id = rv.id
from app_mealprep.recipe_versions rv
where rv.recipe_id = r.id
  and r.name = 'Instant Pot chicken curry'
  and rv.version_no = 1
  and r.current_version_id is distinct from rv.id;

-- Ingredients, in the order they are used.
insert into app_mealprep.recipe_version_ingredients (version_id, ingredient_id, qty, unit, sort_order)
select rv.id, ing.id, v.qty, v.unit::app_mealprep.unit, v.sort_order
from (values
  ('Shallots',                  12,    'count', 0),
  ('Garlic',                    18,    'clove', 1),
  ('Fresh ginger',              1.5,   'count', 2),
  ('Tomatoes',                  3,     'count', 3),
  ('Cilantro',                  1,     'bunch', 4),
  ('Curry leaves',              1,     'bunch', 5),
  ('Green chilies',             3,     'count', 6),
  ('Cashews',                   12,    'count', 7),
  ('Poppy seeds',               1.5,   'tsp',   8),
  ('Turmeric',                  1.5,   'tsp',   9),
  ('Chili powder',              2.25,  'tsp',   10),
  ('Coriander powder',          3.75,  'tsp',   11),
  ('Garam masala',              1.5,   'tsp',   12),
  ('Nonfat Greek yogurt',       3,     'tbsp',  13),
  ('Salt',                      2.25,  'tsp',   14),
  ('Cooking oil',               4.5,   'tbsp',  15),
  ('Bone-in chicken curry cut', 2.15,  'lb',    16),
  ('Water',                     1.125, 'cup',   17)
) as v(ingredient_name, qty, unit, sort_order)
join app_mealprep.recipes r on r.name = 'Instant Pot chicken curry'
join app_mealprep.recipe_versions rv on rv.recipe_id = r.id and rv.version_no = 1
join app_mealprep.ingredients ing
  on ing.name = v.ingredient_name and ing.household_id = r.household_id
where not exists (
  select 1 from app_mealprep.recipe_version_ingredients x
  where x.version_id = rv.id and x.ingredient_id = ing.id and x.unit = v.unit::app_mealprep.unit
);
