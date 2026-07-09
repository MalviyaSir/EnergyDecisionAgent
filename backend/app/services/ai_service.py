from app.schemas.energy import ChatResponse, Recommendation


class AIService:
    """Placeholder AI facade for the future OpenAI integration."""

    def answer(self, message: str, recommendations: list[Recommendation]) -> ChatResponse:
        top_recommendations = recommendations[:3]
        suggested_actions = [item.title for item in top_recommendations]
        answer = (
            "EnerMind AI is currently running rule-based intelligence. "
            "The highest-impact actions are based on live room telemetry and anomaly rules."
        )

        if "saving" in message.lower() or "reduce" in message.lower():
            answer = "Start with idle AC, idle lighting, and anomaly alerts; they usually produce the fastest savings."

        return ChatResponse(answer=answer, suggested_actions=suggested_actions)
