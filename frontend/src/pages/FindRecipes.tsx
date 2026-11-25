import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import "./Recipes.css";
import "./FindRecipes.css";
import { supabase } from "../auth/supabase";
import Autocomplete from "../Autocomplete";
import RecipeCard from "./RecipeCard";
import { useMeals, useSavedRecipes } from "./recipeData";
import { DIETS, findMatches } from "./recipeMatching";
import type { DietId } from "./recipeMatching";

const PAGE_SIZE = 24;
const PREFERENCES_KEY = "recipe-recommender:find-preferences";

type StoredPreferences = { diets: DietId[]; cuisines: string[] };

function loadPreferences(): StoredPreferences {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "{}");
    const validDiets = new Set<string>(DIETS.map((diet) => diet.id));
    return {
      diets: Array.isArray(parsed.diets) ? parsed.diets.filter((id: unknown) => typeof id === "string" && validDiets.has(id)) : [],
      cuisines: Array.isArray(parsed.cuisines) ? parsed.cuisines.filter((name: unknown) => typeof name === "string") : [],
    };
  } catch {
    return { diets: [], cuisines: [] };
  }
}

function normalizeIngredient(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function FindRecipes({ user }: { user: User | null }) {
  const { meals, status } = useMeals();
  const { savedIds, busyId, saveError, toggleSave } = useSavedRecipes(user);
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [dietInput, setDietInput] = useState("");
  const [cuisineInput, setCuisineInput] = useState("");
  const [dietError, setDietError] = useState("");
  const [cuisineError, setCuisineError] = useState("");
  const [diets, setDiets] = useState<Set<DietId>>(() => new Set(loadPreferences().diets));
  const [cuisines, setCuisines] = useState<Set<string>>(() => new Set(loadPreferences().cuisines));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [inventoryStatus, setInventoryStatus] = useState("");
  const [inventoryLoading, setInventoryLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ diets: [...diets], cuisines: [...cuisines] }));
    } catch {
      // Preferences just won't persist.
    }
  }, [diets, cuisines]);

  // Start from the first page whenever the search criteria change.
  const criteriaKey = JSON.stringify([ingredients, [...diets], [...cuisines]]);
  const [pagedCriteriaKey, setPagedCriteriaKey] = useState(criteriaKey);
  if (pagedCriteriaKey !== criteriaKey) {
    setPagedCriteriaKey(criteriaKey);
    setVisibleCount(PAGE_SIZE);
  }

  const ingredientSuggestions = useMemo(
    () => [...new Set(meals.flatMap((meal) => meal.ingredients))].sort(),
    [meals],
  );
  const availableCuisines = useMemo(
    () => [...new Set(meals.map((meal) => meal.area).filter((area): area is string => !!area))].sort(),
    [meals],
  );
  const matches = useMemo(
    () => findMatches(meals, { ingredients, diets, cuisines }),
    [meals, ingredients, diets, cuisines],
  );

  function addIngredients(values: string[]) {
    setIngredients((current) => {
      const next = [...current];
      for (const value of values.map(normalizeIngredient)) {
        if (value && !next.includes(value)) next.push(value);
      }
      return next;
    });
  }

  function handleAddIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addIngredients(ingredientInput.split(","));
    setIngredientInput("");
  }

  async function addInventoryIngredients() {
    if (!user) return;
    setInventoryLoading(true);
    setInventoryStatus("");
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("ingredients(name)")
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);

      const names = (data ?? []).flatMap((row) => {
        const related: unknown = row.ingredients;
        const list = Array.isArray(related) ? related : related ? [related] : [];
        return list
          .map((item) => (item as { name?: unknown }).name)
          .filter((name): name is string => typeof name === "string");
      });
      if (names.length === 0) {
        setInventoryStatus("Your inventory is empty.");
        return;
      }
      addIngredients(names);
      setInventoryStatus(`Added ${names.length} item${names.length === 1 ? "" : "s"} from your inventory.`);
    } catch (error) {
      console.error("Unable to load inventory:", error);
      setInventoryStatus("Could not load your inventory. Please try again.");
    } finally {
      setInventoryLoading(false);
    }
  }

  const hasCriteria = ingredients.length > 0 || cuisines.size > 0;
  const visibleMatches = matches.slice(0, visibleCount);

  return (
    <main className="recipes-page find-page">
      <header className="page-heading">
      <p className="page-eyebrow">MAKE THE MOST OF YOUR KITCHEN</p>
      <h1>Find Recipes</h1>
      <p className="page-intro">
        Add the ingredients you have and your preferences. Recipes are ranked by how many of
        your ingredients and preferred cuisines they match.
      </p>
      </header>

      <section className="find-section" aria-labelledby="find-ingredients-heading">
        <h2 id="find-ingredients-heading">Your ingredients</h2>
        <form className="find-ingredient-form" onSubmit={handleAddIngredient}>
          <label htmlFor="find-ingredient">Ingredient</label>
          <Autocomplete
            id="find-ingredient"
            value={ingredientInput}
            options={ingredientSuggestions}
            onChange={setIngredientInput}
            placeholder="e.g. chicken, garlic"
          />
          <button type="submit" disabled={!ingredientInput.trim()}>Add</button>
          {user && (
            <button type="button" onClick={() => void addInventoryIngredients()} disabled={inventoryLoading}>
              {inventoryLoading ? "Loading..." : "Use my inventory"}
            </button>
          )}
          {ingredients.length > 0 && (
            <button type="button" onClick={() => setIngredients([])}>Clear all</button>
          )}
        </form>
        {inventoryStatus && <p role="status">{inventoryStatus}</p>}
        {ingredients.length > 0 && (
          <ul className="find-chips" aria-label="Selected ingredients">
            {ingredients.map((name) => (
              <li key={name}>
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => setIngredients((current) => current.filter((item) => item !== name))}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="find-section" aria-labelledby="diet-heading">
        <h2 id="diet-heading">Dietary restrictions</h2>
        <form className="find-ingredient-form" onSubmit={(event) => {
          event.preventDefault();
          const diet = DIETS.find((item) => item.label.toLowerCase() === dietInput.trim().toLowerCase());
          if (!diet) { setDietError("Choose a restriction from the suggestions."); return; }
          setDiets((current) => new Set([...current, diet.id]));
          setDietInput("");
          setDietError("");
        }}>
          <label htmlFor="find-diet">Restriction</label>
          <Autocomplete id="find-diet" value={dietInput}
            options={DIETS.filter((diet) => !diets.has(diet.id)).map((diet) => diet.label)}
            onChange={(value) => { setDietInput(value); setDietError(""); }}
            onSelect={(label) => {
              const diet = DIETS.find((item) => item.label === label);
              if (diet) setDiets((current) => new Set([...current, diet.id]));
              setDietInput("");
              setDietError("");
            }}
            placeholder="Search restrictions"
          />
          <button type="submit" disabled={!dietInput.trim()}>Add</button>
          {diets.size > 0 && <button type="button" onClick={() => setDiets(new Set())}>Clear all</button>}
        </form>
        {dietError && <p className="error" role="alert">{dietError}</p>}
        {diets.size > 0 && (
          <ul className="find-chips" aria-label="Selected dietary restrictions">
            {DIETS.filter((diet) => diets.has(diet.id)).map((diet) => (
              <li key={diet.id}>{diet.label}<button type="button" aria-label={`Remove ${diet.label}`} onClick={() => setDiets((current) => {
                const next = new Set(current); next.delete(diet.id); return next;
              })}>×</button></li>
            ))}
          </ul>
        )}
        <p className="find-note">
          Recipes that don't meet these are hidden. Checks are based on ingredient names, so
          always double-check labels for allergies.
        </p>
      </section>

      <section className="find-section" aria-labelledby="cuisine-heading">
        <h2 id="cuisine-heading">Preferred cuisines</h2>
        {availableCuisines.length === 0 && !status && <p>No cuisines available.</p>}
        <form className="find-ingredient-form" onSubmit={(event) => {
          event.preventDefault();
          const cuisine = availableCuisines.find((item) => item.toLowerCase() === cuisineInput.trim().toLowerCase());
          if (!cuisine) { setCuisineError("Choose a cuisine from the suggestions."); return; }
          setCuisines((current) => new Set([...current, cuisine]));
          setCuisineInput("");
          setCuisineError("");
        }}>
          <label htmlFor="find-cuisine">Cuisine</label>
          <Autocomplete id="find-cuisine" value={cuisineInput}
            options={availableCuisines.filter((cuisine) => !cuisines.has(cuisine))}
            onChange={(value) => { setCuisineInput(value); setCuisineError(""); }}
            onSelect={(cuisine) => {
              setCuisines((current) => new Set([...current, cuisine]));
              setCuisineInput("");
              setCuisineError("");
            }}
            placeholder="Search cuisines"
          />
          <button type="submit" disabled={!cuisineInput.trim()}>Add</button>
          {cuisines.size > 0 && <button type="button" onClick={() => setCuisines(new Set())}>Clear cuisines</button>}
        </form>
        {cuisineError && <p className="error" role="alert">{cuisineError}</p>}
        {cuisines.size > 0 && (
          <ul className="find-chips" aria-label="Selected cuisines">
            {[...cuisines].map((cuisine) => (
              <li key={cuisine}>{cuisine}<button type="button" aria-label={`Remove ${cuisine}`} onClick={() => setCuisines((current) => {
                const next = new Set(current); next.delete(cuisine); return next;
              })}>×</button></li>
            ))}
          </ul>
        )}
      </section>

      {saveError && <p role="alert">{saveError}</p>}
      {status ? (
        <p role="status">{status}</p>
      ) : !hasCriteria ? (
        <p>Add an ingredient or choose a cuisine to see matching recipes.</p>
      ) : matches.length === 0 ? (
        <p>No recipes match. Try adding more ingredients or removing a restriction.</p>
      ) : (
        <>
          <p role="status">
            Showing {visibleMatches.length} of {matches.length} matching recipe{matches.length === 1 ? "" : "s"}.
          </p>
          <ul className="recipes-grid">
            {visibleMatches.map((match) => (
              <RecipeCard
                key={match.meal.id}
                meal={match.meal}
                canSave={user !== null}
                saved={savedIds.has(match.meal.id)}
                busy={busyId === match.meal.id}
                onToggleSave={toggleSave}
              >
                <div className="find-match">
                  {ingredients.length > 0 && (
                    <p>
                      <strong>
                        Matches {match.matchedIngredients.length} of {ingredients.length} ingredient
                        {ingredients.length === 1 ? "" : "s"}
                      </strong>
                      {match.matchedIngredients.length > 0 && `: ${match.matchedIngredients.join(", ")}`}
                    </p>
                  )}
                  {match.cuisineMatch && <p>Preferred cuisine: {match.meal.area}</p>}
                  <p>
                    {match.missingCount === 0
                      ? "You have every ingredient!"
                      : `Needs ${match.missingCount} other ingredient${match.missingCount === 1 ? "" : "s"}`}
                  </p>
                </div>
              </RecipeCard>
            ))}
          </ul>
          {visibleCount < matches.length && (
            <button
              type="button"
              className="find-more"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Show more
            </button>
          )}
        </>
      )}
    </main>
  );
}

export default FindRecipes;
