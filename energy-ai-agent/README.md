# AI Energy Optimization Agent

Hackathon-ready foundation for an intelligent energy agent that observes smart meter usage, surfaces reasoning, recommends actions, estimates savings, runs what-if simulations, and records user feedback.

## Structure

```txt
energy-ai-agent/
  frontend/     React 19 + Vite + TypeScript + TailwindCSS
  backend/      Node.js + Express + TypeScript
  shared/       Shared TypeScript contracts
  dummy-data/   Local JSON data source
```

## Run

Install dependencies from `energy-ai-agent/`:

```bash
npm install
```

Start the backend:

```bash
npm run dev --workspace backend
```

Start the frontend in another terminal:

```bash
npm run dev --workspace frontend
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
