import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Link } from "react-router";
import "./Recipes.css";
import { supabase } from "../auth/supabase";
import RecipeCard, { MEAL_COLUMNS } from "./RecipeCard";
import type { Meal } from "./RecipeCard";

function SavedRecipes({ user }: { user: User }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [status, setStatus] = useState("Loading saved recipes...");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSaved() {
      try {
        const { data: saved, error: savedError } = await supabase
          .from("saved_recipes")
          .select("meal_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (savedError) throw new Error(savedError.message);
        const ids = (saved ?? []).map((row) => row.meal_id as number);

        if (ids.length === 0) {
          if (active) {
            setMeals([]);
            setStatus("");
          }
          return;
        }

        const { data: mealRows, error: mealsError } = await supabase
          .from("meals")
          .select(MEAL_COLUMNS)
          .in("id", ids);

        if (mealsError) throw new Error(mealsError.message);

        // Keep the most recently saved recipes first
        const byId = new Map((mealRows ?? []).map((meal) => [meal.id, meal]));
        const ordered = ids.flatMap((id) => {
          const meal = byId.get(id);
          return meal ? [meal] : [];
        });

        if (active) {
          setMeals(ordered);
          setStatus("");
        }
      } catch (error) {
        console.error("Unable to load saved recipes:", error);
        if (active) setStatus("Could not load your saved recipes. Please reload the page to retry.");
      }
    }

    void loadSaved();
    return () => {
      active = false;
    };
  }, [user.id]);

  async function removeSaved(meal: Meal) {
    setRemoveError("");
    setBusyId(meal.id);

    try {
      const { error } = await supabase
        .from("saved_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("meal_id", meal.id);

      if (error) throw new Error(error.message);
      setMeals((current) => current.filter((item) => item.id !== meal.id));
    } catch (error) {
      console.error("Remove saved recipe failed:", error);
      setRemoveError("Could not remove the recipe. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="recipes-page">
      <h1>Saved Recipes</h1>
      {removeError && <p role="alert">{removeError}</p>}
      {status ? (
        <p role="status">{status}</p>
      ) : meals.length === 0 ? (
        <p>
          You haven't saved any recipes yet. Browse the <Link to="/recipes">Recipes</Link> page
          to find some.
        </p>
      ) : (
        <ul className="recipes-grid">
          {meals.map((meal) => (
            <RecipeCard
              key={meal.id}
              meal={meal}
              canSave
              saved
              busy={busyId === meal.id}
              onToggleSave={removeSaved}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

export default SavedRecipes;
