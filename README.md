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

Create a `.env` file in the frontend folder:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Use the project's public **anon key** or **publishable key**, never a secret or
service-role key. Vite reads this root file and exposes only these two Supabase
values to the frontend. Restart the frontend after changing them. The `.env`
file is ignored by Git.

## Updating Your Profile

After logging in, select **Profile** in the navigation to update your display
name and email, or change your password using the separate password form.
Display names are stored in Supabase Auth user metadata as `display_name`; the
welcome message uses this name, falling back to your current Auth email.
No additional profile table or database migration is required.

Email changes follow your Supabase project's confirmation settings. When
confirmation is required, follow the links sent to the new email address (and
the current address if secure email change is enabled). Until confirmed, the
profile continues to show the current email. Password changes require matching
passwords of at least six characters and must also meet the project's Supabase
password policy.

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