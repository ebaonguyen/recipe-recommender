import { useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase } from "../auth/supabase";
import { generateRecipe } from "../services/recipeGenerator";
import type { GeneratedRecipe, InventoryIngredient } from "./AiRecipe";
import "./GenerateRecipe.css";

type InventoryRow = {
  quantity: number | null;
  unit: string | null;
  ingredients: { name: string } | { name: string }[] | null;
};

function GenerateRecipePage() {
  const [inventory, setInventory] = useState<InventoryIngredient[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadInventory() {
      setIsLoadingInventory(true);
      setError("");
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData.user;
        if (!user) {
          setIsLoggedIn(false);
          setInventory([]);
          return;
        }
        setIsLoggedIn(true);

        const { data, error: inventoryError } = await supabase
          .from("inventory_items")
          .select("quantity, unit, ingredients(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (inventoryError) throw inventoryError;

        const byName = new Map<string, InventoryIngredient>();
        for (const row of (data ?? []) as InventoryRow[]) {
          const ingredient = Array.isArray(row.ingredients)
            ? row.ingredients[0]
            : row.ingredients;
          if (!ingredient?.name) continue;

          const key = ingredient.name.trim().toLocaleLowerCase();
          const existing = byName.get(key);
          if (!existing) {
            byName.set(key, {
              name: ingredient.name.trim(),
              quantity: row.quantity,
              unit: row.unit,
            });
            continue;
          }

          // Keep separate stock records with different units out of a summed total.
          // When records share a unit, combine their available quantities.
          if (existing.unit?.trim().toLocaleLowerCase() === row.unit?.trim().toLocaleLowerCase()) {
            if (existing.quantity !== null && row.quantity !== null) {
              existing.quantity += row.quantity;
            } else if (existing.quantity === null && row.quantity !== null) {
              existing.quantity = row.quantity;
            }
          }
        }
        setInventory([...byName.values()]);
      } catch {
        setError("Could not load your saved inventory. Please reload the page and try again.");
      } finally {
        setIsLoadingInventory(false);
      }
    }

    void loadInventory();
  }, []);

  async function handleGenerate() {
    setError("");
    setRecipe(null);
    if (!inventory.length) {
      setError("Add ingredients to your inventory before generating a recipe.");
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateRecipe(inventory);
      setRecipe(generated);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while generating your recipe.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="generate-page">
      <header className="page-heading">
        <p className="page-eyebrow">MAKE SOMETHING WITH WHAT YOU HAVE</p>
        <h1>AI Recipe Generator</h1>
        <p className="page-intro">
          Generate a recipe from the ingredients saved in your inventory. Saved quantities
          are treated as limits, so the recipe will not ask for more than you have.
        </p>
      </header>

      <section className="generate-section" aria-labelledby="inventory-ingredients-heading">
        <h2 id="inventory-ingredients-heading">Your saved ingredients</h2>
        {isLoadingInventory ? (
          <p className="generate-status" role="status">Loading your inventory...</p>
        ) : !isLoggedIn ? (
          <p className="generate-hint">Please <Link to="/login">log in</Link> to use your saved inventory.</p>
        ) : inventory.length === 0 ? (
          <p className="generate-hint">
            Your inventory is empty. Add ingredients on the <Link to="/inventory">Inventory page</Link> first.
          </p>
        ) : (
          <ul className="generated-ingredients">
            {inventory.map((item) => (
              <li key={item.name}>
                {item.name}
                <span className="generate-hint">
                  {item.quantity === null
                    ? " — no quantity saved"
                    : ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ""} available`}
                </span>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="generate-error" role="alert">{error}</p>}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoadingInventory || !isLoggedIn || inventory.length === 0 || isGenerating}
        >
          {isGenerating ? "Generating recipe..." : "Generate recipe from my inventory"}
        </button>
        {isGenerating && (
          <p className="generate-status" role="status" aria-live="polite">
            Gemini is creating a recipe using your saved ingredients and quantity limits.
          </p>
        )}
      </section>

      {recipe && (
        <article className="generated-recipe" aria-labelledby="generated-recipe-name">
          <div className="generated-recipe-heading">
            <p className="page-eyebrow">YOUR AI-GENERATED RECIPE</p>
            <h2 id="generated-recipe-name">{recipe.name}</h2>
          </div>

          <section aria-labelledby="generated-ingredients-heading">
            <h3 id="generated-ingredients-heading">Ingredients</h3>
            <ul className="generated-ingredients">
              {recipe.ingredients.map((ingredient, index) => {
                const amount = [ingredient.quantity, ingredient.unit].filter(Boolean).join(" ");
                return (
                  <li key={`${ingredient.name}-${index}`}>
                    {amount && <span className="generated-amount">{amount}</span>}
                    {amount ? " " : ""}
                    {ingredient.name}
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-labelledby="generated-instructions-heading">
            <h3 id="generated-instructions-heading">Instructions</h3>
            <ol className="generated-instructions">
              {recipe.instructions.map((instruction, index) => (
                <li key={`${index}-${instruction}`}>{instruction}</li>
              ))}
            </ol>
          </section>

          <button
            className="generate-again-button"
            type="button"
            onClick={() => {
              setRecipe(null);
              setError("");
            }}
          >
            Generate another recipe
          </button>
        </article>
      )}
    </main>
  );
}

export default GenerateRecipePage;
