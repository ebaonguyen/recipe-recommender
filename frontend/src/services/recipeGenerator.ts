import type { GeneratedRecipe, InventoryIngredient } from "../types/recipe";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000")
  .replace(/\/$/, "");

export async function generateRecipe(
  ingredients: InventoryIngredient[],
): Promise<GeneratedRecipe> {
  const response = await fetch(`${API_BASE_URL}/api/generate-recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ingredients }),
  });

  if (!response.ok) {
    let message = "Unable to generate a recipe. Please try again.";
    try {
      const body: { detail?: string } = await response.json();
      if (body.detail) message = body.detail;
    } catch {
      // Keep the default message if the server response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<GeneratedRecipe>;
}
