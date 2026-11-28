import os
import re
from decimal import Decimal, InvalidOperation
from fractions import Fraction

from google import genai
from google.genai import types

from schemas.recipe import GeneratedRecipe, InventoryIngredient


class GeminiConfigurationError(Exception):
    """Raised when Gemini is not configured on the backend."""


class GeminiGenerationError(Exception):
    """Raised when Gemini cannot generate a valid recipe."""


def _number(value: str | None) -> Decimal | None:
    if not value:
        return None
    text = value.strip().lower()
    mixed = re.fullmatch(r"(\d+)\s+(\d+)/(\d+)", text)
    fraction = re.fullmatch(r"(\d+)/(\d+)", text)
    try:
        if mixed:
            whole, numerator, denominator = map(int, mixed.groups())
            return Decimal(whole) + Decimal(numerator) / Decimal(denominator)
        if fraction:
            numerator, denominator = map(int, fraction.groups())
            return Decimal(numerator) / Decimal(denominator)
        if re.fullmatch(r"\d+(?:\.\d+)?", text):
            return Decimal(text)
        return None
    except (InvalidOperation, ZeroDivisionError):
        return None


def _unit_key(unit: str | None) -> str | None:
    if not unit:
        return None
    normalized = unit.strip().casefold().rstrip(".")
    aliases = {
        "grams": "g", "gram": "g", "g": "g",
        "kilograms": "kg", "kilogram": "kg", "kg": "kg",
        "milligrams": "mg", "milligram": "mg", "mg": "mg",
        "ounces": "oz", "ounce": "oz", "oz": "oz",
        "pounds": "lb", "pound": "lb", "lbs": "lb", "lb": "lb",
        "milliliters": "ml", "milliliter": "ml", "ml": "ml",
        "liters": "l", "liter": "l", "litre": "l", "litres": "l", "l": "l",
        "teaspoons": "tsp", "teaspoon": "tsp", "tsp": "tsp",
        "tablespoons": "tbsp", "tablespoon": "tbsp", "tbsp": "tbsp",
        "cups": "cup", "cup": "cup",
        "pieces": "piece", "piece": "piece", "pcs": "piece", "pc": "piece",
        "cloves": "clove", "clove": "clove",
        "whole": "piece", "each": "piece",
    }
    return aliases.get(normalized, normalized)


def _to_base(value: Decimal, unit: str | None) -> tuple[str | None, Decimal]:
    key = _unit_key(unit)
    conversions = {
        "mg": ("mass", Decimal("0.001")), "g": ("mass", Decimal("1")),
        "kg": ("mass", Decimal("1000")), "oz": ("mass", Decimal("28.3495")),
        "lb": ("mass", Decimal("453.592")),
        "ml": ("volume", Decimal("1")), "l": ("volume", Decimal("1000")),
        "tsp": ("volume", Decimal("4.92892")), "tbsp": ("volume", Decimal("14.7868")),
        "cup": ("volume", Decimal("236.588")),
        "piece": ("count", Decimal("1")), "clove": ("count", Decimal("1")),
    }
    if key in conversions:
        dimension, factor = conversions[key]
        return dimension, value * factor
    return (f"unit:{key}" if key else None), value


def _validate_available_quantities(
    recipe: GeneratedRecipe, inventory: list[InventoryIngredient]
) -> None:
    available = {item.name.casefold(): item for item in inventory}
    for used in recipe.ingredients:
        stock = available.get(used.name.casefold())
        if stock is None:
            raise GeminiGenerationError(
                f"Gemini included an ingredient that is not in inventory: {used.name}."
            )
        if stock.quantity is None:
            continue

        used_amount = _number(used.quantity)
        if used_amount is None:
            raise GeminiGenerationError(
                f"Gemini did not provide a measurable amount for {used.name}."
            )

        if stock.unit is None:
            if used.unit is not None:
                raise GeminiGenerationError(
                    f"Gemini used a unit for {used.name}, but inventory has no unit; please try again."
                )
            available_base = Decimal(str(stock.quantity))
            used_base = used_amount
        else:
            available_dimension, available_base = _to_base(Decimal(str(stock.quantity)), stock.unit)
            used_dimension, used_base = _to_base(used_amount, used.unit)
            if available_dimension != used_dimension or used_dimension is None:
                raise GeminiGenerationError(
                    f"Gemini used an incompatible unit for {used.name}; please try again."
                )
        if used_base > available_base:
            raise GeminiGenerationError(
                f"Gemini exceeded the saved quantity for {used.name}; please try again."
            )


def generate_recipe(ingredients: list[InventoryIngredient]) -> GeneratedRecipe:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiConfigurationError("GEMINI_API_KEY is not configured.")

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    client = genai.Client(api_key=api_key)
    inventory_json = [item.model_dump() for item in ingredients]
    prompt = f"""
Create one practical recipe using ONLY the ingredients in this user's inventory.
Do not have to use all of the ingredients, but you may use any combination of them. 
Use the exact inventory ingredient names in the recipe output so each one can be matched to its stock record.

STRICT QUANTITY RULES:
- If an inventory item has a numeric quantity, the recipe amount MUST NOT exceed it.
- Use the same unit as the inventory item when it has a unit. You may use a smaller
  amount, but never a larger amount. Do not convert units unless necessary.
- If an inventory item has no quantity (quantity is null), choose a normal,
  recipe-appropriate amount for it.
- If an inventory item has a quantity but no unit, use a numeric amount no greater
  than the saved number and leave the recipe unit blank.
- Do not invent extra ingredients to make the recipe work.
- Make the recipe realistic and provide clear numbered cooking instructions.
- If you cannot create a recipe that follows these rules, return an error message in the JSON output.


Inventory (JSON): {inventory_json}
"""

    try:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeneratedRecipe,
                temperature=0.4,
            ),
        )
        if not response.text:
            raise GeminiGenerationError("Gemini returned an empty response.")

        recipe = GeneratedRecipe.model_validate_json(response.text)
        _validate_available_quantities(recipe, ingredients)
        return recipe
    except GeminiGenerationError:
        raise
    except Exception as exc:
        raise GeminiGenerationError("Gemini could not generate a valid recipe.") from exc
