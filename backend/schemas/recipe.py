from pydantic import BaseModel, Field, field_validator


class InventoryIngredient(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    quantity: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=40)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("unit")
    @classmethod
    def clean_unit(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class GenerateRecipeRequest(BaseModel):
    ingredients: list[InventoryIngredient] = Field(min_length=1, max_length=50)

    @field_validator("ingredients")
    @classmethod
    def clean_ingredients(cls, values: list[InventoryIngredient]) -> list[InventoryIngredient]:
        cleaned: list[InventoryIngredient] = []
        seen: set[str] = set()
        for item in values:
            key = item.name.casefold()
            if key not in seen:
                cleaned.append(item)
                seen.add(key)
        if not cleaned:
            raise ValueError("Provide at least one inventory ingredient.")
        return cleaned


class RecipeIngredient(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    quantity: str | None = Field(default=None, max_length=40)
    unit: str | None = Field(default=None, max_length=40)


class GeneratedRecipe(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    ingredients: list[RecipeIngredient] = Field(min_length=1, max_length=40)
    instructions: list[str] = Field(min_length=1, max_length=20)
