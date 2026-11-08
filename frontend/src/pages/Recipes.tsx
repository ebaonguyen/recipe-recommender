import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import "./Recipes.css";
import { supabase } from "../auth/supabase";
import RecipeCard, { MEAL_COLUMNS } from "./RecipeCard";
import type { Meal } from "./RecipeCard";

function Recipes({ user }: { user: User | null }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [status, setStatus] = useState("Loading recipes...");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMeals() {
      try {
        const { data, error } = await supabase
          .from("meals")
          .select(MEAL_COLUMNS)
          .order("name", { ascending: true })
          .limit(1000);

        if (error) throw new Error(error.message);
        if (!active) return;
        setMeals(data ?? []);
        setStatus("");
      } catch (error) {
        console.error("Unable to load recipes:", error);
        if (active) setStatus("Could not load recipes. Please reload the page to retry.");
      }
    }

    void loadMeals();
    return () => {
      active = false;
    };
  }, []);

  // Load which recipes the current user has saved
  useEffect(() => {
    let active = true;

    async function loadSaved() {
      if (!user) {
        setSavedIds(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("saved_recipes")
        .select("meal_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Unable to load saved recipes:", error);
        return;
      }
      if (active) setSavedIds(new Set((data ?? []).map((row) => row.meal_id as number)));
    }

    void loadSaved();
    return () => {
      active = false;
    };
  }, [user]);

  async function toggleSave(meal: Meal) {
    if (!user) return;
    setSaveError("");
    setBusyId(meal.id);

    try {
      const isSaved = savedIds.has(meal.id);
      const { error } = isSaved
        ? await supabase
            .from("saved_recipes")
            .delete()
            .eq("user_id", user.id)
            .eq("meal_id", meal.id)
        : await supabase
            .from("saved_recipes")
            .insert({ user_id: user.id, meal_id: meal.id });

      if (error) throw new Error(error.message);

      setSavedIds((current) => {
        const next = new Set(current);
        if (isSaved) next.delete(meal.id);
        else next.add(meal.id);
        return next;
      });
    } catch (error) {
      console.error("Save toggle failed:", error);
      setSaveError("Could not update your saved recipes. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

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
      <h1>Recipes</h1>

      <div className="recipes-filters">
        <label htmlFor="recipe-search">Search by name or ingredient</label>
        <input
          id="recipe-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. chicken"
        />
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

      {saveError && <p role="alert">{saveError}</p>}
      {status ? (
        <p role="status">{status}</p>
      ) : visibleMeals.length === 0 ? (
        <p>No recipes found.</p>
      ) : (
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
      )}
    </main>
  );
}

export default Recipes;
