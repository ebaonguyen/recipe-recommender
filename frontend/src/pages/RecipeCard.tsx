export type Meal = {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  country: string | null;
  instructions: string | null;
  thumbnail_url: string | null;
  youtube_url: string | null;
  source_url: string | null;
  tags: string[];
  ingredients: string[];
  measures: Record<string, string> | string[] | null;
};

export const MEAL_COLUMNS =
  "id, name, category, area, country, instructions, thumbnail_url, youtube_url, source_url, tags, ingredients, measures";

// measures is jsonb: support either { "Chicken": "200g" } or ["200g", ...]
function getMeasure(meal: Meal, ingredient: string, index: number): string {
  const { measures } = meal;
  if (!measures) return "";
  if (Array.isArray(measures)) return String(measures[index] ?? "").trim();
  return String(measures[ingredient] ?? "").trim();
}

type Props = {
  meal: Meal;
  saved: boolean;
  busy: boolean;
  onToggleSave: (meal: Meal) => void;
  canSave: boolean;
};

function RecipeCard({ meal, saved, busy, onToggleSave, canSave }: Props) {
  return (
    <li className="recipe-card">
      {meal.thumbnail_url && (
        <img
          className="recipe-card-image"
          src={meal.thumbnail_url}
          alt={meal.name}
          loading="lazy"
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
      )}
      <h2>{meal.name}</h2>
      <p>{[meal.category, meal.area ?? meal.country].filter(Boolean).join(" · ")}</p>

      <details>
        <summary>Ingredients ({meal.ingredients.length})</summary>
        <ul className="recipe-ingredients">
          {meal.ingredients.map((ingredient, index) => {
            const measure = getMeasure(meal, ingredient, index);
            return (
              <li key={`${ingredient}-${index}`}>
                {measure ? `${measure} ` : ""}{ingredient}
              </li>
            );
          })}
        </ul>
      </details>

      {meal.instructions && (
        <details>
          <summary>Instructions</summary>
          <p className="recipe-instructions">{meal.instructions}</p>
        </details>
      )}

      <div className="recipe-links">
        {meal.youtube_url && (
          <a href={meal.youtube_url} target="_blank" rel="noopener noreferrer">Video</a>
        )}
        {meal.source_url && (
          <a href={meal.source_url} target="_blank" rel="noopener noreferrer">Source</a>
        )}
      </div>

      {canSave && (
        <button
          className="recipe-save-button"
          type="button"
          disabled={busy}
          aria-pressed={saved}
          onClick={() => onToggleSave(meal)}
        >
          {busy ? "Working..." : saved ? "Remove from saved" : "Save recipe"}
        </button>
      )}
    </li>
  );
}

export default RecipeCard;
