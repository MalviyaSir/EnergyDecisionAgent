# Quick Start Guide: AI Building Energy Consultant

## Using the Upgraded Chat

The chat endpoint has been enhanced with building context awareness. No code changes are needed for existing clients—the upgrade is 100% backward compatible.

### Basic Usage

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Why is today'\''s electricity bill high?"}'
```

### Response Structure

```json
{
  "answer": "Today's electricity bill is highest due to: Turn OFF AC in R1-001. Implementing the top recommendation will provide the fastest bill reduction.",
  "suggested_actions": [
    "Turn OFF AC in R1-001",
    "Switch OFF lights in R1-002",
    "Optimize cooling in R1-003"
  ],
  "summary": "Building efficiency is at 65%. Top opportunities: Turn OFF AC in R1-001, Switch OFF lights in R1-002, Optimize cooling in R1-003. Estimated monthly savings available.",
  "root_cause": "Top driver: Turn OFF AC in R1-001. Room R1-001 has remained unoccupied for 42 minutes while AC is ON.",
  "key_findings": [
    "Building Health Status: At Risk",
    "Energy Efficiency Score: 65/100",
    "Turn OFF AC in R1-001: Occupancy = False, AC Status = ON, Current Power = 2.5 kW, Temperature = 28.1°C",
    "Switch OFF lights in R1-002: Occupancy = False, Light Status = ON, Current Power = 0.3 kW, Unoccupied Duration = 15 minutes",
    "Current Building Consumption: 125.4 kW"
  ],
  "top_recommendations": [
    "Turn OFF AC in R1-001",
    "Switch OFF lights in R1-002",
    "Optimize cooling in R1-003"
  ],
  "estimated_savings": "₹45,000/month",
  "carbon_reduction": "250 kg CO2/day",
  "business_impact": "Reduce unnecessary HVAC cost, lower electricity bill, and increase equipment life.",
  "priority": "High",
  "confidence": 92,
  "next_best_action": "Turn OFF AC immediately."
}
```

## Supported Questions

### Cost Reduction
```
"Why is today's electricity bill high?"
"Reduce my electricity bill by 15%"
"How can I save money?"
"What's wasting the most energy?"
```

### Building Health
```
"How healthy is my building?"
"What are the critical issues?"
"Is my building in good condition?"
"What alerts should I address?"
```

### Sustainability
```
"How can I improve sustainability?"
"What about carbon emissions?"
"How green is my building?"
"Can I reduce my environmental impact?"
```

### Recommendations
```
"Which recommendation should I implement first?"
"Explain today's recommendations"
"What should I do today?"
"Priority guidance"
```

### Location Analysis
```
"Which rooms waste the most energy?"
"Which floor consumes the most energy?"
"Where should I focus improvements?"
```

### Anomaly Analysis
```
"What anomalies exist?"
"Why is this room drawing so much power?"
"Investigate unusual patterns"
```

## Understanding the Response

### Section 1: Executive Summary
- Quick overview of the key finding
- Sets context for the analysis
- Directly addresses user intent

### Section 2: Current Building Status
- Health score and status
- Efficiency metrics
- Current consumption

### Section 3: Root Cause Analysis
- Why the situation exists
- Grounded in telemetry
- Links to top anomalies

### Section 4: Key Findings
- Specific observations from data
- Backup evidence
- Building metrics

### Section 5: Top Recommendations
- Ranked actions to take
- Priority level (Critical/High/Medium/Low)
- Each with savings, carbon reduction, confidence

### Section 6: Estimated Total Savings
- Combined monthly savings in INR
- Across all top recommendations
- Realistic projections

### Section 7: Estimated Carbon Reduction
- CO2 reduction potential in kg/day
- Environmental impact
- Sustainability improvement

### Section 8: Business Impact & Risk
- Operational benefits
- Cost savings quantified
- Equipment reliability improvement
- Priority and confidence levels

### Section 9: Next Best Action
- Single concrete action to implement NOW
- Highest impact
- Implementable immediately

### Section 10: Final Conclusion
- Direct answer to user's question
- Actionable advice
- Next steps

## Goal-Based Prioritization

The system automatically detects user intent and prioritizes accordingly:

### For Cost Reduction Questions
```
Prioritizes by: Highest Savings → Lowest Comfort Impact → Highest Confidence → Immediate ROI
Example: Turning off idle AC is suggested first (high savings, no comfort loss)
```

### For Health Assessment Questions
```
Prioritizes by: Critical Alerts → Equipment Health → Anomalies
Example: Critical equipment failure is addressed before optimization tips
```

### For Sustainability Questions
```
Prioritizes by: Carbon Reduction → Energy Efficiency → Renewable Utilization
Example: High-impact carbon reduction actions come first
```

## When OpenAI is Unavailable

The system automatically provides rule-based responses that:
- ✅ Use the same response schema
- ✅ Ground all analysis in telemetry
- ✅ Provide deterministic results (never random)
- ✅ Maintain full functionality

No code changes are needed; the upgrade is transparent.

## Configuration

### Enable OpenAI (Optional)

```bash
export OPENAI_API_KEY="sk-..."
export OPENAI_MODEL="gpt-4o-mini"  # Optional, defaults to this
```

If not set, the system uses rule-based consultant automatically.

### Check Current Status

```bash
# Test imports
python -c "from app.services.building_context_service import BuildingContextService; print('✓ Ready')"

# Test endpoint
curl http://localhost:8000/health
```

## Backward Compatibility

✅ **Fully backward compatible**

- Existing clients receive same response format + new fields
- Old `answer` and `suggested_actions` fields still present
- No breaking changes
- All existing APIs unchanged

### Old Client Example
```python
# This still works exactly as before:
response = await client.post("/chat", json={"message": "..."})
answer = response["answer"]  # ✓ Still available
suggestions = response["suggested_actions"]  # ✓ Still available

# But now you also have:
summary = response["summary"]  # ✓ New field
root_cause = response["root_cause"]  # ✓ New field
# ... and 8 more sections
```

## Examples

### Example 1: Cost Reduction Query
```
Q: "Why is my electricity bill so high today?"

Response:
- Identifies top power consumers
- Quantifies daily/monthly savings potential
- Prioritizes by ROI
- Suggests immediate cost-saving actions
- Estimates carbon impact as bonus info
```

### Example 2: Health Assessment Query
```
Q: "How healthy is my building?"

Response:
- Shows health score and status
- Lists critical alerts first
- Identifies equipment health risks
- Prioritizes safety and reliability
- Explains each issue with evidence
```

### Example 3: Sustainability Query
```
Q: "How can I improve sustainability?"

Response:
- Focuses on carbon reduction potential
- Lists actions by environmental impact
- Includes energy efficiency gains
- Highlights renewable opportunities
- Quantifies CO2 reduction
```

## Troubleshooting

### Response seems generic?
- Check that OPENAI_API_KEY is set if you want LLM enhancement
- Without it, rule-based responses are used (still grounded, just simpler)
- Both are valid and accurate

### Response includes "N/A" for some fields?
- The data wasn't available in current telemetry
- Analysis is based on what IS available
- This is expected and handled correctly

### Confidence seems low?
- Confidence reflects data support strength
- Low confidence means "this is based on limited data"
- All findings are still grounded in available telemetry

### Some recommendations are the same?
- Multiple issues might require the same action
- The system ranks them by impact
- This is correct behavior

## Architecture Overview

```
Client Request
    ↓
Chat Endpoint
    ├─ Fetches room telemetry
    ├─ Generates recommendations
    └─ Gets dashboard metrics
    ↓
BuildingContextService
    └─ Summarizes building state (no raw data to LLM)
    ↓
Intent Detection
    └─ Detects: cost, health, sustainability, anomaly, etc.
    ↓
Goal-Based Prompting
    ├─ Reorders context by relevance
    ├─ Adds goal-specific guidance
    └─ Includes Energy Manager persona
    ↓
OpenAI API (with automatic fallback)
    ├─ Sends grounded context only
    ├─ Returns JSON response
    └─ If fails: Rule-based fallback used
    ↓
Response Validation
    └─ Ensures all 10 sections present
    ↓
Client Response (10 sections + backward compatible fields)
```

## Key Features

✅ **Grounded Analysis**: Never generates random or invented data  
✅ **Goal-Based**: Prioritization adapts to user intent  
✅ **Energy Manager Role**: Expert analysis, not generic chatbot  
✅ **10-Section Format**: Comprehensive, structured responses  
✅ **Automatic Failsafe**: Works without OpenAI  
✅ **Backward Compatible**: Seamless upgrade path  
✅ **Clean Code**: Modular, testable, maintainable  

---

Ready to use! The chat endpoint is now a full AI Building Energy Consultant.
