from fastapi import APIRouter, HTTPException

from schemas.recipe import GenerateRecipeRequest, GeneratedRecipe
from services.gemini_service import (
    GeminiConfigurationError,
    GeminiGenerationError,
    generate_recipe,
)

router = APIRouter(prefix="/api", tags=["AI Recipe Generator"])


@router.post("/generate-recipe", response_model=GeneratedRecipe)
def create_recipe(request: GenerateRecipeRequest) -> GeneratedRecipe:
    try:
        return generate_recipe(request.ingredients)
    except GeminiConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail="The AI recipe generator is not configured. Add GEMINI_API_KEY to backend/.env.",
        ) from exc
    except GeminiGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc) or "The recipe could not be generated within your inventory quantities. Please try again.",
        ) from exc
