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

INGREDIENTS_URL = f"{BASE_URL}/list.php?i=list"

def fetch_ingredients(client: httpx.Client) -> list[dict]:
    """Fetch ingredients"""
    ingredients: list[dict] = []
    response = client.get(INGREDIENTS_URL)
    response.raise_for_status()
    found = response.json().get("meals") or []
    ingredients.extend(found)
    return ingredients

def normalize(name: str) -> str:
    """Lowercase, trim, and collapse repeated spaces."""
    return re.sub(r"\s+", " ", name.strip().lower())

def clean(value: str | None) -> str | None:
    """Trim a text field; empty or missing becomes None."""
    if value is None:
        return None
    value = value.strip()
    return value or None

def save_ingredients(supabase, ingredients: list[dict]) -> int:
    """Save ingredients to the Supabase database. Returns how many rows were saved."""
    rows: dict[str, dict] = {}
    for ingredient in ingredients:
        name = normalize(ingredient.get("strIngredient") or "")
        if not name or name in rows:      # skip blank or duplicate names
            continue
        rows[name] = {
            "id": int(ingredient["idIngredient"]),
            "name": name,
            "description": clean(ingredient.get("strDescription")),
            "thumbnail_url": clean(ingredient.get("strThumb")),
            "type": clean(ingredient.get("strType")),
        }
    if rows:
        supabase.table("ingredients").upsert(list(rows.values()), on_conflict="id").execute()
    return len(rows)


def main() -> None:
    load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY")
    if not url or not key:
        sys.exit("Set SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env first.")

    supabase = create_client(url, key)

    print("Fetching ingredients...")
    with httpx.Client(timeout=30) as client:
        ingredients = fetch_ingredients(client)

    print("Saving to Supabase...")
    save_ingredients(supabase, ingredients)
    print(f"Done: {len(ingredients)} ingredients saved.")

if __name__ == "__main__":
    main()