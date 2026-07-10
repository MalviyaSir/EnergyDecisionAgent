# Developer Reference: AI Building Energy Consultant

## File Structure

```
backend/
├── app/
│   ├── services/
│   │   ├── ai_service.py                      [ENHANCED] Main consultant engine
│   │   ├── building_context_service.py         [NEW] Data aggregation
│   │   ├── energy_consultant_prompt_builder.py [NEW] Prompt engineering
│   │   ├── energy_consultant_response_formatter.py [NEW] Response validation
│   │   ├── analytics_service.py                [Used by chat endpoint]
│   │   ├── recommendation_service.py           [Unchanged]
│   │   ├── sensor_service.py                   [Unchanged]
│   │   └── openai_client.py                    [Unchanged]
│   ├── api/
│   │   ├── chat.py                             [ENHANCED] Updated endpoint
│   │   └── other routes...                     [Unchanged]
│   ├── schemas/
│   │   └── energy.py                           [Unchanged - schema compatible]
│   ├── prompts/
│   │   └── energy_consultant.py                [Deprecated notice added]
│   └── main.py                                 [Unchanged]
```

## Integration Points

### 1. Chat Endpoint Integration

**File**: `app/api/chat.py`

**Before**:
```python
async def chat(
    request: ChatRequest,
    sensor_service: SensorService = Depends(get_sensor_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    ai_service: AIService = Depends(get_ai_service),
) -> ChatResponse:
    rooms = await sensor_service.list_rooms()
    recommendations = recommendation_service.generate(rooms)
    return ai_service.answer(request.message, recommendations)
```

**After**:
```python
async def chat(
    request: ChatRequest,
    sensor_service: SensorService = Depends(get_sensor_service),
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
    ai_service: AIService = Depends(get_ai_service),
) -> ChatResponse:
    rooms = await sensor_service.list_rooms()
    recommendations = recommendation_service.generate(rooms)
    dashboard = analytics_service.dashboard(rooms)
    
    return ai_service.answer_with_context(
        message=request.message,
        rooms=rooms,
        dashboard=dashboard,
        recommendations=recommendations,
    )
```

**Key Changes**:
- Added `analytics_service` dependency
- Fetch `dashboard` metrics
- Call new `answer_with_context()` method instead of `answer()`

### 2. AIService Integration

**File**: `app/services/ai_service.py`

**New Method**: `answer_with_context()`
```python
def answer_with_context(
    self,
    message: str,
    rooms: list[Room],
    dashboard: Dashboard,
    recommendations: list[Recommendation],
) -> ChatResponse:
    """Primary method for grounded building analysis."""
    # 1. Create context using BuildingContextService
    context = BuildingContextService.create_consultant_context(
        rooms=rooms,
        dashboard=dashboard,
        recommendations=recommendations,
        user_question=message,
    )
    
    # 2. Detect intent and get fallback
    user_intent = context.get("user_intent", "general_inquiry")
    fallback = self._generate_fallback_response(...)
    
    # 3. Get OpenAI client (with automatic failsafe)
    client = OpenAIClient.from_env()
    if client is None:
        return fallback
    
    # 4. Build context-aware prompts
    system_prompt = EnergyConsultantPromptBuilder.build_system_prompt(user_intent)
    user_prompt = EnergyConsultantPromptBuilder.build_user_prompt(...)
    
    # 5. Call OpenAI with JSON schema
    try:
        payload = client.generate_json(...)
        response = EnergyConsultantResponseFormatter.format_response(...)
        return response
    except Exception:
        return fallback
```

**Backward Compatibility**: Old `answer()` method still works unchanged.

### 3. Building Context Integration

**File**: `app/services/building_context_service.py`

**Main Method**: `create_consultant_context()`
```python
context = BuildingContextService.create_consultant_context(
    rooms=rooms,
    dashboard=dashboard,
    recommendations=recommendations,
    user_question=message,
)

# Returns:
{
    "building_status": {...},        # Health, efficiency, consumption
    "occupancy_summary": {...},      # Occupancy patterns
    "energy_summary": {...},         # Power consumption and high-use rooms
    "health_summary": {...},         # Alerts and anomalies
    "alerts_summary": {...},         # Critical and high-priority issues
    "recommendations": [...],        # Top 5 recommendations
    "user_intent": "cost_reduction", # Detected intent
    "anomalies": [...]              # Extracted anomalies
}
```

**Important**: Context never includes raw telemetry data, only summaries and metrics.

### 4. Prompt Builder Integration

**File**: `app/services/energy_consultant_prompt_builder.py`

**System Prompt**:
```python
system_prompt = EnergyConsultantPromptBuilder.build_system_prompt(user_intent)
# Returns: Energy Manager role + goal-based guidance specific to user_intent
```

**User Prompt**:
```python
user_prompt = EnergyConsultantPromptBuilder.build_user_prompt(
    user_question=message,
    context=context,
    user_intent=user_intent,
)
# Returns: User message + reordered context + analysis instructions
# Context fields are prioritized based on user_intent
```

**Intent Values**:
- `"cost_reduction"` - Focus on savings
- `"health_assessment"` - Focus on alerts and equipment
- `"sustainability"` - Focus on carbon reduction
- `"anomaly_analysis"` - Focus on unusual patterns
- `"priority_guidance"` - Focus on implementation order
- `"location_analysis"` - Focus on rooms and floors
- `"recommendation_analysis"` - Focus on recommendations
- `"general_inquiry"` - Default balanced analysis

### 5. Response Formatter Integration

**File**: `app/services/energy_consultant_response_formatter.py`

**Validation**:
```python
response = EnergyConsultantResponseFormatter.format_response(
    llm_output=payload,              # Raw LLM output
    recommendations=recommendations,  # For context
    fallback=fallback,               # For merging if needed
)
# Returns: Validated ChatResponse with all 10 sections
```

**Direct Creation**:
```python
response = EnergyConsultantResponseFormatter.create_comprehensive_response(
    summary="...",
    root_cause="...",
    key_findings=["...", "..."],
    top_recommendations=["...", "..."],
    estimated_savings="₹45,000/month",
    carbon_reduction="250 kg CO2/day",
    business_impact="...",
    priority="High",
    confidence=92,
    next_best_action="...",
    answer="...",  # For backward compatibility
    suggested_actions=[...]  # For backward compatibility
)
```

## Extending the System

### Add a New Intent Type

1. **Update BuildingContextService**:
```python
# In _detect_intent() method
if any(word in q for word in ["your_keywords"]):
    return "your_new_intent"
```

2. **Update EnergyConsultantPromptBuilder**:
```python
# In _get_intent_guidance() method
if intent == "your_new_intent":
    return "Specific prioritization guidance..."

# In _get_context_order() method
if intent == "your_new_intent":
    return ["field1", "field2", "field3", ...]  # Priority order

# In _get_analysis_instructions() method
elif intent == "your_new_intent":
    instructions += "Your specific analysis instructions..."
```

3. **Test**:
```python
context = BuildingContextService.create_consultant_context(...)
assert context["user_intent"] == "your_new_intent"
```

### Add a New Context Field

1. **In BuildingContextService**:
```python
def _summarize_your_metric(self, ...) -> dict[str, Any]:
    return {
        "field1": value1,
        "field2": value2,
    }

# In create_consultant_context()
context: dict[str, Any] = {
    ...
    "your_metric": BuildingContextService._summarize_your_metric(...),
}
```

2. **Test the aggregation**:
```python
context = BuildingContextService.create_consultant_context(...)
assert "your_metric" in context
```

### Customize Fallback Response

**File**: `app/services/ai_service.py`

Override these methods for custom rule-based logic:
- `_build_summary()` - Executive summary
- `_build_root_cause()` - Root cause analysis
- `_build_key_findings()` - Key findings
- `_create_answer_text()` - Answer text
- `_determine_priority()` - Priority level
- `_determine_confidence()` - Confidence

Example:
```python
def _build_summary(self, building_status, top3, user_intent):
    # Custom logic
    return "Your custom summary"
```

### Switch LLM Provider

1. **Update OpenAIClient** or create new client:
```python
class MyLLMClient:
    def generate_json(self, system_prompt, user_prompt, response_schema):
        # Call your LLM
        return response_dict
```

2. **Update AIService**:
```python
def answer_with_context(self, ...):
    # Instead of:
    # client = OpenAIClient.from_env()
    
    # Use:
    client = MyLLMClient.from_env()
```

## Testing

### Unit Testing Services

```python
import pytest
from app.services.building_context_service import BuildingContextService

def test_building_context_creation():
    context = BuildingContextService.create_consultant_context(
        rooms=[...],
        dashboard={...},
        recommendations=[...],
        user_question="Why is my bill high?",
    )
    
    assert "building_status" in context
    assert "user_intent" in context
    assert context["user_intent"] == "cost_reduction"

def test_intent_detection():
    assert BuildingContextService._detect_intent("reduce cost") == "cost_reduction"
    assert BuildingContextService._detect_intent("health") == "health_assessment"
```

### Integration Testing

```python
async def test_chat_endpoint():
    response = await client.post(
        "/chat",
        json={"message": "Why is my bill high?"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check all 10 sections present
    assert "summary" in data
    assert "root_cause" in data
    assert "key_findings" in data
    assert "top_recommendations" in data
    assert "estimated_savings" in data
    assert "carbon_reduction" in data
    assert "business_impact" in data
    assert "priority" in data
    assert "confidence" in data
    assert "next_best_action" in data
    
    # Check backward compatibility
    assert "answer" in data
    assert "suggested_actions" in data
```

### Failsafe Testing

```python
def test_fallback_without_openai(monkeypatch):
    # Mock OpenAI unavailable
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    
    response = ai_service.answer_with_context(
        message="...",
        rooms=[...],
        dashboard={...},
        recommendations=[...],
    )
    
    # Should still return valid response
    assert response.summary is not None
    assert response.root_cause is not None
    assert len(response.key_findings) > 0
```

## Performance Considerations

### Context Aggregation
- `BuildingContextService`: O(n) where n = number of rooms
- Summarizes data, never sends raw telemetry
- ~50-100ms for typical building (100-500 rooms)

### Prompt Generation
- `EnergyConsultantPromptBuilder`: O(1) + O(k) for context items
- Very fast, deterministic
- ~1-5ms

### LLM Call
- `OpenAIClient`: ~1-3 seconds (network dependent)
- Fallback available if slow/timeout

### Response Formatting
- `EnergyConsultantResponseFormatter`: O(1)
- Very fast, just validation
- ~1ms

**Total**: ~1-3 seconds (dominated by LLM call)

## Logging

### Debug Level
```python
logger.debug("Calling OpenAI with user intent: %s", user_intent)
```

### Info Level
```python
logger.info("OpenAI consultant generated response successfully")
```

### Warning Level
```python
logger.warning("OpenAI consultant generation failed; using fallback. exc=%s", exc)
```

### Error Level
```python
logger.error("Critical error in consultant: %s", exc)
```

## Schema Reference

### ChatResponse
```python
class ChatResponse(BaseModel):
    # Backward compatible fields
    answer: str
    suggested_actions: list[str]
    
    # New consultant fields
    summary: str
    root_cause: str
    key_findings: list[str]
    top_recommendations: list[str]
    estimated_savings: str
    carbon_reduction: str
    business_impact: str
    priority: str  # "Critical", "High", "Medium", "Low"
    confidence: int  # 0-100
    next_best_action: str
```

### ChatRequest
```python
class ChatRequest(BaseModel):
    message: str  # 1-1000 characters
```

## Environment Variables

```bash
# Required for OpenAI integration
OPENAI_API_KEY=sk-...

# Optional
OPENAI_MODEL=gpt-4o-mini  # Default if not set

# Existing app settings (unchanged)
CORS_ORIGINS=["*"]
SENSOR_REFRESH_SECONDS=2
ROOM_COUNT=60
HIGH_POWER_THRESHOLD_KW=3.5
TARIFF_PER_KWH=8.5
CARBON_KG_PER_KWH=0.82
```

## Dependency Injection

### Services Available
```python
def my_endpoint(
    ai_service: AIService = Depends(get_ai_service),
    building_context_service: BuildingContextService = Depends(...),  # Add if needed
    sensor_service: SensorService = Depends(get_sensor_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> ChatResponse:
    ...
```

### Adding New Dependency
```python
# In app/api/dependencies.py
def get_my_service(request: Request) -> MyService:
    return request.app.state.my_service

# In app/main.py
app.state.my_service = MyService()

# In app/api/chat.py
async def chat(
    ...,
    my_service: MyService = Depends(get_my_service),
):
    ...
```

---

## Checklist for Contributors

- [ ] Tests pass
- [ ] No hardcoded secrets
- [ ] Backward compatibility maintained
- [ ] Logging added for debugging
- [ ] Type hints used
- [ ] Docstrings updated
- [ ] Error handling implemented
- [ ] Failsafe tested

---

This modular, well-documented architecture makes it easy to extend, test, and maintain the AI Building Energy Consultant system.
