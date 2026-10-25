
import os
import re
import string
import sys
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client

BASE_URL = "https://www.themealdb.com/api/json/v1/1"
FIRST_LETTERS = string.ascii_lowercase + string.digits
CHUNK_SIZE = 200
PAUSE_SECONDS = 0.5


def normalize(name: str) -> str:
    """Lowercase, trim, and collapse repeated spaces."""
    return re.sub(r"\s+", " ", name.strip().lower())


def clean(value: str | None) -> str | None:
    """Trim a text field; empty or missing becomes None."""
    if value is None:
        return None
    value = value.strip()
    return value or None


def meal_to_row(meal: dict) -> dict:
    """Turn one TheMealDB meal dictionary into a row for the meals table."""
    measures: dict[str, str] = {}
    for i in range(1, 21):
        raw_name = meal.get(f"strIngredient{i}")
        if not raw_name or not raw_name.strip():
            continue
        name = normalize(raw_name)
        measure = clean(meal.get(f"strMeasure{i}")) or ""
        if name in measures:
            # Same ingredient listed twice: keep both amounts.
            measures[name] = " + ".join(p for p in (measures[name], measure) if p)
        else:
            measures[name] = measure

    raw_tags = clean(meal.get("strTags"))
    tags = [t.strip() for t in raw_tags.split(",") if t.strip()] if raw_tags else []

    return {
        "id": int(meal["idMeal"]),
        "name": (meal.get("strMeal") or "").strip(),
        "category": clean(meal.get("strCategory")),
        "area": clean(meal.get("strArea")),
        "country": clean(meal.get("strCountry")),
        "instructions": clean(meal.get("strInstructions")),
        "thumbnail_url": clean(meal.get("strMealThumb")),
        "youtube_url": clean(meal.get("strYoutube")),
        "source_url": clean(meal.get("strSource")),
        "image_source": clean(meal.get("strImageSource")),
        "tags": tags,
        "date_modified": clean(meal.get("dateModified")),
        "ingredients": list(measures.keys()),
        "measures": measures,
    }


def save_meals(supabase, meals: list[dict]) -> int:
    """Upsert a list of TheMealDB meal dictionaries into `meals`. Returns the row count."""
    rows = {}
    for meal in meals:
        row = meal_to_row(meal)
        rows[row["id"]] = row  # same meal twice -> keep one
    row_list = list(rows.values())

    for start in range(0, len(row_list), CHUNK_SIZE):
        chunk = row_list[start : start + CHUNK_SIZE]
        supabase.table("meals").upsert(chunk, on_conflict="id").execute()
    return len(row_list)


def fetch_meals_by_letter(client: httpx.Client) -> list[dict]:
    """Fetch every meal by searching each first letter and digit (free tier)."""
    meals: list[dict] = []
    for letter in FIRST_LETTERS:
        response = client.get(f"{BASE_URL}/search.php", params={"f": letter})
        response.raise_for_status()
        found = response.json().get("meals") or []
        meals.extend(found)
        print(f"  '{letter}': {len(found)} meals")
        time.sleep(PAUSE_SECONDS)
    return meals


def main() -> None:
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env first.")

    supabase = create_client(url, key)

    print("Fetching meals...")
    with httpx.Client(timeout=30) as client:
        meals = fetch_meals_by_letter(client)

    print("Saving to Supabase...")
    saved = save_meals(supabase, meals)
    print(f"Done: {saved} meals saved.")


if __name__ == "__main__":
    main()