export interface InventoryIngredient {
  name: string;
  quantity: number | null;
  unit: string | null;
}

export interface GeneratedRecipeIngredient {
  name: string;
  quantity: string | null;
  unit: string | null;
}

export interface GeneratedRecipe {
  name: string;
  ingredients: GeneratedRecipeIngredient[];
  instructions: string[];
}
