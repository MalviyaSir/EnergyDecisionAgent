- [x] Extend ChatResponse schema with required AI consultant fields (keep answer/suggested_actions)

- [x] Add OpenAI dependency and env-based settings


- [x] Create prompt templates module (separate from business logic)


- [x] Implement reusable OpenAI client service wrapper


- [x] Upgrade AIService to:



  - [x] Gather telemetry from SensorService

  - [x] Generate/ingest recommendations from RecommendationService

  - [x] Compute grounded fields (top recommendations, estimated savings, carbon reduction, priority/confidence)

  - [ ] Call OpenAI with structured JSON response using prompts
  - [ ] Deterministic fallback if OpenAI missing/fails
- [x] Ensure /chat endpoint remains unchanged and returns valid ChatResponse

- [x] Add robust error handling + logging

- [x] Run backend and smoke-test /chat


