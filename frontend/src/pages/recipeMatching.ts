import type { Meal } from "./RecipeCard";

export type DietId =
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "no-shellfish"
  | "no-fish"
  | "no-pork"
  | "no-red-meat"
  | "no-nuts"
  | "dairy-free"
  | "egg-free"
  | "gluten-free"
  | "no-alcohol";

type Rule = {
  terms: string[];
  except?: string[];
  categories?: string[];
  // Matches compound words such as "saltfish" or "codfish".
  suffixes?: string[];
};

const MEAT: Rule = {
  terms: [
    "beef", "steak", "brisket", "oxtail", "veal", "lamb", "mutton", "goat", "chicken", "turkey",
    "duck", "goose", "pork", "bacon", "ham", "gammon", "sausage", "chorizo", "salami", "pepperoni",
    "prosciutto", "pancetta", "lard", "suet", "mince", "meatball", "venison", "rabbit", "kidney",
    "liver", "black pudding", "gelatin", "gelatine", "rib", "pheasant", "partridge", "quail",
    "meat", "chuck", "shank", "trotter", "jamon", "kielbasa", "kabanos", "morcilla", "frog",
    "doner", "marshmallow", "bone marrow", "tripe", "mincemeat",
  ],
  except: ["kidney bean", "vegetarian", "vegan", "meat free", "coconut meat", "goat cheese", "goats cheese"],
  categories: ["Beef", "Chicken", "Lamb", "Pork", "Goat"],
};

const FISH: Rule = {
  terms: [
    "fish", "salmon", "tuna", "cod", "haddock", "anchovy", "sardine", "mackerel", "trout",
    "tilapia", "herring", "sea bass", "bass", "monkfish", "pilchard", "kipper", "swordfish",
    "halibut", "plaice", "sole", "snapper", "hake", "pollock", "worcestershire sauce", "caviar",
    "barramundi", "bream", "eel", "roe", "bonito", "dashi", "katsuobushi", "prahok", "mahi",
  ],
  except: ["shellfish", "crayfish", "crawfish"],
  suffixes: ["fish"],
};

const SHELLFISH: Rule = {
  terms: [
    "prawn", "shrimp", "crab", "lobster", "mussel", "clam", "oyster", "scallop", "squid",
    "calamari", "octopus", "crayfish", "crawfish", "langoustine", "cockle", "shellfish", "seafood",
    "conch", "whelk", "winkle", "abalone",
  ],
  except: ["oyster mushroom"],
};

const PORK: Rule = {
  terms: [
    "pork", "bacon", "ham", "gammon", "chorizo", "prosciutto", "pancetta", "lard", "salami",
    "pepperoni", "sausage", "black pudding", "jamon", "kielbasa", "kabanos", "morcilla", "trotter",
  ],
  categories: ["Pork"],
};

const RED_MEAT: Rule = {
  terms: [
    "beef", "steak", "brisket", "oxtail", "veal", "lamb", "mutton", "goat", "venison", "mince",
    "meatball", "chuck", "shank", "doner", ...PORK.terms,
  ],
  except: ["goat cheese", "goats cheese"],
  categories: ["Beef", "Lamb", "Goat", "Pork"],
};

const NUTS: Rule = {
  terms: [
    "nut", "almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "hazlenut", "peanut",
    "macadamia", "praline", "marzipan", "frangipane", "nutella", "nougat", "nougatine",
  ],
};

const DAIRY: Rule = {
  terms: [
    "milk", "butter", "cheese", "cream", "yogurt", "yoghurt", "parmesan", "mozzarella", "cheddar",
    "feta", "ricotta", "mascarpone", "ghee", "creme fraiche", "crème fraîche", "buttermilk",
    "brie", "gruyere", "gruyère", "paneer", "custard", "halloumi", "stilton", "gouda", "pecorino",
    "fromage frais", "quark", "condensed milk", "evaporated milk", "whey", "manchego",
    "parmigiano", "queso", "malai", "knafeh", "dulce de leche", "white chocolate",
    "milk chocolate", "mars bar", "toffee", "fudge", "labneh", "kefir", "camembert", "emmental",
    "provolone", "burrata", "cottage", "curd",
  ],
  except: [
    "coconut milk", "coconut cream", "almond milk", "soy milk", "soya milk", "oat milk",
    "rice milk", "peanut butter", "almond butter", "cocoa butter", "butter bean", "cream of tartar",
    "bean curd", "vegan",
  ],
};

const EGGS: Rule = {
  terms: ["egg", "mayonnaise", "mayo", "meringue", "aioli", "custard", "lemon curd", "brioche"],
  except: ["eggplant", "egg plant", "flax egg", "chia egg", "vegan"],
};

const HONEY: Rule = { terms: ["honey"] };

const GLUTEN: Rule = {
  terms: [
    "flour", "bread", "breadcrumb", "pasta", "spaghetti", "noodle", "wheat", "barley", "rye",
    "couscous", "bulgur", "semolina", "soy sauce", "beer", "ale", "stout", "pastry", "tortilla",
    "pitta", "pita", "naan", "lasagne", "lasagna", "penne", "macaroni", "fettuccine", "linguine",
    "tagliatelle", "rigatoni", "farfalle", "orzo", "biscuit", "digestive", "cracker", "brioche",
    "baguette", "ciabatta", "croissant", "bun", "roll", "malt", "seitan", "panko", "filo", "phyllo",
    "wonton", "dumpling", "gnocchi", "ravioli", "tortellini", "cake", "sponge", "spelt", "farro",
    "pudding", "muffin", "cookie", "pretzel", "krispie", "cereal", "grain", "oat", "oatmeal",
    "freekeh", "khus khus", "knafeh", "sevaiiya", "toast", "hoisin", "gochujang", "doubanjiang",
    "teriyaki", "udon", "ramen", "crouton", "waffle", "pancake", "crepe",
  ],
  except: [
    "gluten free", "gluten-free", "rice flour", "corn flour", "almond flour", "coconut flour",
    "gram flour", "chickpea flour", "potato flour", "tapioca flour", "rice noodle", "corn tortilla",
    "tamari", "rice paper", "spring roll", "rice cake", "rice pudding", "rice flour pancake",
  ],
};

const ALCOHOL: Rule = {
  terms: [
    "wine", "beer", "ale", "stout", "lager", "rum", "brandy", "vodka", "whisky", "whiskey",
    "sherry", "cider", "liqueur", "gin", "bourbon", "sake", "mirin", "marsala", "cognac",
    "tequila", "kirsch", "grand marnier", "cointreau", "amaretto", "kahlua", "baileys",
    "champagne", "prosecco", "vermouth", "port", "madeira", "calvados", "shaoxing",
  ],
  except: ["vinegar"],
};

export const DIETS: { id: DietId; label: string; rules: Rule[] }[] = [
  { id: "vegetarian", label: "Vegetarian", rules: [MEAT, FISH, SHELLFISH] },
  { id: "vegan", label: "Vegan", rules: [MEAT, FISH, SHELLFISH, DAIRY, EGGS, HONEY] },
  { id: "pescatarian", label: "Pescatarian", rules: [MEAT] },
  { id: "no-shellfish", label: "No shellfish", rules: [SHELLFISH] },
  { id: "no-fish", label: "No fish", rules: [FISH] },
  { id: "no-pork", label: "No pork", rules: [PORK] },
  { id: "no-red-meat", label: "No red meat", rules: [RED_MEAT] },
  { id: "no-nuts", label: "No nuts", rules: [NUTS] },
  { id: "dairy-free", label: "Dairy-free", rules: [DAIRY] },
  { id: "egg-free", label: "Egg-free", rules: [EGGS] },
  { id: "gluten-free", label: "Gluten-free", rules: [GLUTEN] },
  { id: "no-alcohol", label: "No alcohol", rules: [ALCOHOL] },
];

// "Seafood" covers both fish and shellfish dishes.
const SEAFOOD_CATEGORY_RULES = new Set<Rule>([FISH, SHELLFISH]);

// Normalizes plurals so "cookies"/"cookie" and "cherries"/"cherry" compare equal
// (both become "cookie" / "cherrie").
function singularize(word: string): string {
  if (word.length <= 3 || word.endsWith("ss") || word.endsWith("us")) return word;
  if (word.endsWith("ies")) return word.slice(0, -1);
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ie`;
  if (/(oes|ches|shes|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singularize);
}

// True when `phrase` appears in `tokens` as a contiguous run of whole words.
function containsPhrase(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0 || phrase.length > tokens.length) return false;
  for (let start = 0; start <= tokens.length - phrase.length; start++) {
    if (phrase.every((word, offset) => tokens[start + offset] === word)) return true;
  }
  return false;
}

type CompiledRule = {
  terms: string[][];
  except: string[][];
  categories: Set<string>;
  suffixes: string[];
  seafood: boolean;
};

const compiledRules = new Map<Rule, CompiledRule>();
function compile(rule: Rule): CompiledRule {
  let compiled = compiledRules.get(rule);
  if (!compiled) {
    compiled = {
      terms: rule.terms.map(tokenize),
      except: (rule.except ?? []).map(tokenize),
      categories: new Set(rule.categories ?? []),
      suffixes: rule.suffixes ?? [],
      seafood: SEAFOOD_CATEGORY_RULES.has(rule),
    };
    compiledRules.set(rule, compiled);
  }
  return compiled;
}

function violatesRule(meal: Meal, ingredientTokens: string[][], rule: Rule): boolean {
  const compiled = compile(rule);
  if (meal.category && compiled.categories.has(meal.category)) return true;
  if (meal.category === "Seafood" && compiled.seafood) return true;
  return ingredientTokens.some(
    (tokens) =>
      !compiled.except.some((phrase) => containsPhrase(tokens, phrase)) &&
      (compiled.terms.some((phrase) => containsPhrase(tokens, phrase)) ||
        tokens.some((token) => compiled.suffixes.some((suffix) => token.endsWith(suffix)))),
  );
}

export function meetsDiets(meal: Meal, diets: Iterable<DietId>): boolean {
  const ingredientTokens = meal.ingredients.map(tokenize);
  for (const dietId of diets) {
    const diet = DIETS.find((candidate) => candidate.id === dietId);
    if (diet?.rules.some((rule) => violatesRule(meal, ingredientTokens, rule))) return false;
  }
  return true;
}

// A plain ingredient (e.g. "chicken") shouldn't satisfy a derived product
// (e.g. "chicken stock") unless the user typed the derived form themselves.
const DERIVED_PRODUCT_WORDS = new Set(
  ["stock", "broth", "bouillon", "cube", "powder", "granule", "salt", "extract", "essence", "flavouring", "flavoring"]
    .map(singularize),
);

function ingredientMatches(recipeTokens: string[], wantedTokens: string[]): boolean {
  if (!containsPhrase(recipeTokens, wantedTokens)) return false;
  const wanted = new Set(wantedTokens);
  return !recipeTokens.some((token) => !wanted.has(token) && DERIVED_PRODUCT_WORDS.has(token));
}

export type RecipeMatch = {
  meal: Meal;
  matchedIngredients: string[];
  missingCount: number;
  cuisineMatch: boolean;
  score: number;
};

export type MatchCriteria = {
  ingredients: string[];
  diets: Iterable<DietId>;
  cuisines: Iterable<string>;
};

/**
 * Drops meals that violate any dietary restriction, then ranks the rest by
 * matched ingredients + matched cuisine preference. Ties prefer recipes that
 * need fewer extra ingredients. Meals with no matches at all are omitted.
 */
export function findMatches(meals: Meal[], criteria: MatchCriteria): RecipeMatch[] {
  const diets = [...criteria.diets];
  const cuisines = new Set(criteria.cuisines);
  const wanted = criteria.ingredients
    .map((name) => ({ name, tokens: tokenize(name) }))
    .filter((item) => item.tokens.length > 0);

  const matches: RecipeMatch[] = [];
  for (const meal of meals) {
    if (!meetsDiets(meal, diets)) continue;

    const recipeTokens = meal.ingredients.map(tokenize);
    const usedRecipeIngredients = new Set<number>();
    const matchedIngredients: string[] = [];
    for (const item of wanted) {
      const index = recipeTokens.findIndex((tokens) => ingredientMatches(tokens, item.tokens));
      if (index !== -1) {
        matchedIngredients.push(item.name);
        usedRecipeIngredients.add(index);
      }
    }

    const cuisineMatch = !!meal.area && cuisines.has(meal.area);
    const score = matchedIngredients.length + (cuisineMatch ? 1 : 0);
    if (score === 0 && (wanted.length > 0 || cuisines.size > 0)) continue;

    matches.push({
      meal,
      matchedIngredients,
      missingCount: meal.ingredients.length - usedRecipeIngredients.size,
      cuisineMatch,
      score,
    });
  }

  return matches.sort(
    (a, b) =>
      b.score - a.score ||
      b.matchedIngredients.length - a.matchedIngredients.length ||
      a.missingCount - b.missingCount ||
      a.meal.name.localeCompare(b.meal.name),
  );
}
