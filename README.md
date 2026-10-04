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