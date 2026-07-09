# EnerMind AI Backend

FastAPI backend for an AI-powered Smart Energy Optimization platform.

## Features

- REST API with CORS enabled
- 100 realistic in-memory rooms
- Live sensor refresh every 5 seconds
- Rule-based AI Decision Engine
- No database dependency
- Modular routers, services, schemas, and utilities

## Run

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Interactive docs:

```text
http://127.0.0.1:8000/docs
```

## Core Endpoints

- `GET /health`
- `GET /dashboard`
- `GET /rooms`
- `GET /rooms/{room_id}`
- `GET /recommendations`
- `GET /analytics`
- `POST /simulation`
- `POST /chat`

## Decision Engine

The current AI Decision Engine is intentionally rule-based and does not call OpenAI yet.

Implemented rules include:

- AC running in an unoccupied room
- Lights running in an unoccupied room
- Temperature above 35°C
- Power consumption above anomaly threshold
- High room occupancy and building-wide occupancy pressure

This keeps the code deterministic, testable, and ready for a future LLM-backed `AIService`.
