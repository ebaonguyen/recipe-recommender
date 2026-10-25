create table public.meals (
  id integer primary key,                      -- idMeal
  name text not null,                          -- strMeal
  category text,                               -- strCategory
  area text,                                   -- strArea
  country text,                                -- strCountry
  instructions text,                           -- strInstructions
  thumbnail_url text,                          -- strMealThumb
  youtube_url text,                            -- strYoutube
  source_url text,                             -- strSource
  image_source text,                           -- strImageSource
  tags text[] not null default '{}',           -- strTags, split on commas
  date_modified text,                          -- dateModified, kept as the API's text
  ingredients text[] not null default '{}',    -- strIngredient1-20: lowercase names, for matching
  measures jsonb not null default '{}'     -- strMeasure1-20: {"chicken": "1 lb", ...}
);

GRANT SELECT, INSERT, UPDATE ON public.meals TO service_role;