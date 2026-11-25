import { useId, useRef } from "react";
import type { ReactNode } from "react";

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

function getYouTubeEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://youtube.com/embed/${match[1]}` : null;
}

type Props = {
  meal: Meal;
  saved: boolean;
  busy: boolean;
  onToggleSave: (meal: Meal) => void;
  canSave: boolean;
  children?: ReactNode;
};

function RecipeCard({ meal, saved, busy, onToggleSave, canSave, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const ingredients = (
    <ul className="recipe-ingredients">
      {meal.ingredients.map((ingredient, index) => {
        const measure = getMeasure(meal, ingredient, index);
        return <li key={`${ingredient}-${index}`}>{measure ? `${measure} ` : ""}{ingredient}</li>;
      })}
    </ul>
  );

  const embedUrl = getYouTubeEmbedUrl(meal.youtube_url);

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
      <h2><button className="recipe-title" type="button" onClick={() => dialogRef.current?.showModal()}>{meal.name}</button></h2>
      <p>{[meal.category, meal.area ?? meal.country].filter(Boolean).join(" · ")}</p>
      {children}
      <h3 className="recipe-ingredients-heading">Ingredients</h3>
      {ingredients}

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
      <dialog ref={dialogRef} className="recipe-dialog" aria-labelledby={titleId}>
        <div className="recipe-dialog-heading">
          <h2 id={titleId}>{meal.name}</h2>
          <button type="button" className="recipe-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Close recipe details">×</button>
        </div>
        {embedUrl && (
          <div className="recipe-video">
            <h3>Video Tutorial</h3>
            <iframe
              src={embedUrl}
              title={`${meal.name} video tutorial`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <p>{[meal.category, meal.area ?? meal.country].filter(Boolean).join(" · ")}</p>
        <h3>Ingredients</h3>
        {ingredients}
        <h3>Instructions</h3>
        <p className="recipe-instructions">{meal.instructions || "No instructions available."}</p>

        {meal.source_url && (
          <div className="recipe-links">
            <a href={meal.source_url} target="_blank" rel="noopener noreferrer">
              View source
            </a>
          </div>
        )}
      </dialog>
    </li>
  );
}

export default RecipeCard;
