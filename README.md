# Recipe Recommender

A full-stack application with a React frontend and FastAPI backend.

## Requirements

- Python 3.9+
- Node 18+

## Project Structure

```text
recipe-recommender/
├── frontend/
└── backend/
```

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r requirements.txt
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend URL:

http://localhost:8000

API documentation:

http://localhost:8000/docs

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

http://localhost:5173

## Supabase

Create a `.env` file in the repository root using `.env.example` as a template:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Use the project's public **anon key** or **publishable key**, never a secret or
service-role key. Vite reads this root file and exposes only these two Supabase
values to the frontend. Restart the frontend after changing them. The `.env`
file is ignored by Git.

## Running the Project

You need two terminals.

Backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```