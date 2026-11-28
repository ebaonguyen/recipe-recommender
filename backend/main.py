from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.recipe_generator import router as recipe_generator_router

# Load backend/.env regardless of the directory used to start Uvicorn.
load_dotenv(Path(__file__).resolve().parent / ".env")

app = FastAPI(title="PantryPal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Hello From Backend"}


app.include_router(recipe_generator_router)
