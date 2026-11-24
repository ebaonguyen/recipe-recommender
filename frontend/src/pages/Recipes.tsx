import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import "./Recipes.css";
import RecipeCard from "./RecipeCard";
import { useMeals, useSavedRecipes } from "./recipeData";

function Recipes({ user }: { user: User | null }) {
  const { meals, status } = useMeals();
  const { savedIds, busyId, saveError, toggleSave } = useSavedRecipes(user);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = [...new Set(meals.map((meal) => meal.category).filter(Boolean))] as string[];

  const search = query.trim().toLowerCase();
  const visibleMeals = meals.filter((meal) => {
    if (category && meal.category !== category) return false;
    if (!search) return true;
    return (
      meal.name.toLowerCase().includes(search) ||
      meal.ingredients.some((ingredient) => ingredient.toLowerCase().includes(search))
    );
  });

  return (
    <main className="recipes-page">
      <header className="page-heading">
        <p className="page-eyebrow">EXPLORE SOMETHING DELICIOUS</p>
        <h1>Recipes</h1>
        <p className="page-intro">Find your next favorite meal by name, ingredient, or category.</p>
      </header>

      <div className="recipes-filters">
        <div className="filter-field">
        <label htmlFor="recipe-search">Search by name or ingredient</label>
        <input
          id="recipe-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. chicken"
        />
        </div>
        <div className="filter-field">
        <label htmlFor="recipe-category">Category</label>
        <select
          id="recipe-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        </div>
      </div>

      {saveError && <p role="alert">{saveError}</p>}
      {status ? (
        <p role="status">{status}</p>
      ) : visibleMeals.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
        <>
        <p className="results-count" role="status">{visibleMeals.length} recipe{visibleMeals.length === 1 ? "" : "s"} found</p>
        <ul className="recipes-grid">
          {visibleMeals.map((meal) => (
            <RecipeCard
              key={meal.id}
              meal={meal}
              canSave={user !== null}
              saved={savedIds.has(meal.id)}
              busy={busyId === meal.id}
              onToggleSave={toggleSave}
            />
          ))}
        </ul>
        </>
      )}
    </main>
  );
}

export default Recipes;
