# Architecture Diagram: AI Building Energy Consultant

## Complete System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER QUESTION RECEIVED                          │
│                 "Why is my electricity bill high?"                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   Chat Endpoint         │
                    │ (app/api/chat.py)       │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
          ┌──────────┐    ┌────────────┐  ┌──────────────┐
          │ Sensor   │    │Recommend   │  │  Analytics   │
          │ Service  │    │ Service    │  │  Service     │
          └────┬─────┘    └────┬───────┘  └──────┬───────┘
               │                │                 │
       ┌───────┴────────────────┴─────────────────┴──────┐
       │    Aggregated Building Data Ready              │
       │ - rooms (list[Room])                           │
       │ - recommendations (list[Recommendation])       │
       │ - dashboard (Dashboard)                        │
       └───────┬─────────────────────────────────────────┘
               │
               ▼
        ┌──────────────────────────────────────┐
        │ BuildingContextService               │
        │ (Data Aggregation Layer)             │
        ├──────────────────────────────────────┤
        │ • Summarize building status          │
        │ • Summarize occupancy patterns       │
        │ • Summarize energy consumption       │
        │ • Summarize health & alerts          │
        │ • Extract anomalies                  │
        │ • Detect user intent                 │
        │ • Create context (NO RAW TELEMETRY)  │
        └────────────┬─────────────────────────┘
                     │
        ┌────────────┴──────────────────┐
        │  Intent Detection              │
        │  "cost_reduction"              │
        └────────────┬──────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │ EnergyConsultantPromptBuilder        │
        │ (Intelligent Prompt Engineering)    │
        ├──────────────────────────────────────┤
        │ • Build SYSTEM prompt:               │
        │   - Energy Manager role              │
        │   - Goal-based guidance              │
        │   - Grounded analysis rules          │
        │                                      │
        │ • Build USER prompt:                 │
        │   - Reorder context by relevance     │
        │   - Add goal-specific instructions   │
        │   - Include prioritization rules     │
        └────────────┬─────────────────────────┘
                     │
        ┌────────────┴──────────────────┐
        │ Prompts Ready for LLM:         │
        │ - System prompt               │
        │ - User prompt                 │
        │ - Response schema             │
        └────────────┬──────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │  OpenAI API (With Failsafe)          │
        ├──────────────────────────────────────┤
        │ TRY:                                 │
        │  1. Check OpenAIClient.from_env()    │
        │  2. Call generate_json()             │
        │  3. Return structured response       │
        │                                      │
        │ CATCH Exception:                     │
        │  → Use Rule-Based Fallback           │
        └────────────┬─────────────────────────┘
                     │
        ┌────────────┴──────────────────────┐
        │                                   │
        ▼ (Success)              ▼ (Failure/Unavailable)
   ┌─────────────┐             ┌──────────────────┐
   │ LLM Output  │             │ Fallback Logic   │
   │ (JSON)      │             │ (Rule-Based)     │
   └──────┬──────┘             └────────┬─────────┘
          │                             │
          └──────────────┬──────────────┘
                         │
                         ▼
        ┌──────────────────────────────────────┐
        │ EnergyConsultantResponseFormatter    │
        │ (Response Validation Layer)          │
        ├──────────────────────────────────────┤
        │ • Validate all 10 sections present   │
        │ • Normalize field values             │
        │ • Merge fallback if needed           │
        │ • Ensure schema compliance           │
        │ • Truncate long fields               │
        │ • Validate priority & confidence     │
        └────────────┬─────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────┐
        │   ChatResponse (All 10 Sections)     │
        ├──────────────────────────────────────┤
        │ 1. summary                           │
        │ 2. (building_status context)         │
        │ 3. root_cause                        │
        │ 4. key_findings[]                    │
        │ 5. top_recommendations[]             │
        │ 6. estimated_savings                 │
        │ 7. carbon_reduction                  │
        │ 8. business_impact                   │
        │    priority / confidence             │
        │ 9. next_best_action                  │
        │ 10. answer (+ suggested_actions)     │
        └────────────┬─────────────────────────┘
                     │
                     ▼
                  Client
            Receives Full Response
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Chat Endpoint                                              │
│  ├── collect_data()                                         │
│  │   ├─→ sensor_service.list_rooms()                       │
│  │   ├─→ recommendation_service.generate()                 │
│  │   └─→ analytics_service.dashboard()                     │
│  │                                                          │
│  ├── answer_with_context(                                  │
│  │   message, rooms, dashboard, recommendations            │
│  │)                                                         │
│  │   │                                                      │
│  │   ├─→ BuildingContextService.create_consultant_context()│
│  │   │   │                                                  │
│  │   │   ├─→ summarize_building()                          │
│  │   │   ├─→ summarize_occupancy()                         │
│  │   │   ├─→ summarize_energy()                            │
│  │   │   ├─→ summarize_health()                            │
│  │   │   ├─→ extract_anomalies()                           │
│  │   │   └─→ detect_intent()  ◄── Returns "cost_reduction"│
│  │   │                                                      │
│  │   ├─→ EnergyConsultantPromptBuilder.build_system_prompt()│
│  │   │   (with goal-based guidance)                        │
│  │   │                                                      │
│  │   ├─→ EnergyConsultantPromptBuilder.build_user_prompt() │
│  │   │   (with reordered context)                          │
│  │   │                                                      │
│  │   ├─→ OpenAIClient.generate_json()                      │
│  │   │   ├─ TRY: Send to OpenAI API                        │
│  │   │   └─ CATCH: Use fallback                            │
│  │   │                                                      │
│  │   └─→ EnergyConsultantResponseFormatter.format_response()│
│  │       (validate all 10 sections)                        │
│  │                                                          │
│  └─→ Return ChatResponse                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Priority Flow by Intent Type

```
COST_REDUCTION INTENT
═══════════════════════════════════════════════════════════════
Input: "Reduce my electricity bill by 15%"
         ↓
Detect Intent: cost_reduction
         ↓
Context Fields Priority:
  1. energy_summary (consumption patterns)
  2. recommendations (ranked by savings)
  3. building_status (current state)
  4. alerts_summary (quick wins)
  5. occupancy_summary (pattern analysis)
         ↓
Goal Guidance in Prompt:
  Priority 1: Highest Daily/Monthly Savings
  Priority 2: Lowest Occupant Comfort Impact
  Priority 3: Highest Confidence (data-backed)
  Priority 4: Immediate ROI (quick payback)
         ↓
LLM Analysis:
  ✓ Focus on financial impact
  ✓ Consider user comfort
  ✓ Provide confidence levels
  ✓ Quantify all savings
         ↓
Output: Cost-optimized recommendations


HEALTH_ASSESSMENT INTENT
═══════════════════════════════════════════════════════════════
Input: "How healthy is my building?"
         ↓
Detect Intent: health_assessment
         ↓
Context Fields Priority:
  1. health_summary (health & alerts)
  2. alerts_summary (critical issues)
  3. anomalies (unusual patterns)
  4. building_status (overall state)
  5. recommendations (remediation)
         ↓
Goal Guidance in Prompt:
  Priority 1: Critical Alerts
  Priority 2: Equipment Health Issues
  Priority 3: Anomalies and Risks
  Priority 4: Occupant Safety
         ↓
LLM Analysis:
  ✓ Assess building condition
  ✓ Identify critical issues
  ✓ Prioritize safety risks
  ✓ Rate health 0-100
         ↓
Output: Health-focused remediation


SUSTAINABILITY INTENT
═══════════════════════════════════════════════════════════════
Input: "How can I improve sustainability?"
         ↓
Detect Intent: sustainability
         ↓
Context Fields Priority:
  1. energy_summary (consumption)
  2. building_status (carbon emissions)
  3. recommendations (efficiency)
  4. health_summary (reliability)
         ↓
Goal Guidance in Prompt:
  Priority 1: Carbon Reduction Potential
  Priority 2: Energy Efficiency Improvements
  Priority 3: Renewable Utilization
  Priority 4: Long-term Environmental Impact
         ↓
LLM Analysis:
  ✓ Calculate carbon footprint
  ✓ Assess environmental impact
  ✓ Identify renewable opportunities
  ✓ Prioritize sustainability
         ↓
Output: Sustainability-focused strategy
```

## Data Aggregation Strategy

```
RAW TELEMETRY (Room Level)
├── R1-001: occupied, ac_on, temp=28.1°C, power=2.5 kW
├── R1-002: empty, light_on, power=0.3 kW
├── R1-003: occupied, temp=35.0°C, power=1.8 kW
├── R2-001: occupied, power=1.2 kW
└── ... (60 rooms total)
         │
         ▼
BUILDING CONTEXT (Summary Level)
         │
         ├─ Building Status
         │  ├─ Health Score: 62/100
         │  ├─ Efficiency: 65/100
         │  ├─ Current Consumption: 125.4 kW
         │  └─ Predicted Daily Bill: ₹1,064
         │
         ├─ Energy Summary
         │  ├─ Total Daily Energy: 125.4 kWh
         │  ├─ Highest Power Rooms:
         │  │  ├─ R1-001: 2.5 kW
         │  │  ├─ R1-003: 1.8 kW
         │  │  └─ R2-001: 1.2 kW
         │  └─ Total Monthly Energy: 3,762 kWh
         │
         ├─ Occupancy Summary
         │  ├─ Total Rooms: 60
         │  ├─ Occupied: 42
         │  ├─ Occupancy: 70%
         │  └─ Max in Room: 12 people
         │
         ├─ Health Summary
         │  ├─ Critical Alerts: 1
         │  ├─ High Priority: 3
         │  └─ Active Anomalies: 2
         │
         └─ Anomalies
            ├─ Idle AC in R1-001 (unoccupied 42 min)
            └─ High Temp in R1-003 (35.0°C)
         │
         ▼
TO LLM: Context only, NO raw telemetry
        (~5 KB vs. raw telemetry ~50 KB)
```

## Failsafe Flow

```
┌─────────────────────────────────┐
│   Enter answer_with_context()   │
└────────────────┬────────────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ Get OpenAI Client      │
    │ (from environment)     │
    └────────────┬───────────┘
                 │
        ┌────────┴────────┐
        │                 │
   NOT SET (None)      SET
        │                │
        ▼                ▼
    ┌───────┐    ┌─────────────────┐
    │ Log:  │    │ TRY:            │
    │ "OAI  │    │ • Call OpenAI   │
    │ unavailable" │ • Parse JSON  │
    └───┬───┘    │ • Validate     │
        │        └──┬──────────────┘
        │           │
        │      ┌────┴────┐
        │      │          │
        │    Success    Exception
        │      │          │
        │      ▼          ▼
        │  ┌────────┐  ┌──────────┐
        │  │ Format │  │ Log:     │
        │  │Response│  │ "Failed" │
        │  │(LLM)   │  └──┬───────┘
        │  └────┬───┘     │
        │       │         ▼
        │       │    ┌──────────────┐
        │       │    │ Generate     │
        │       │    │ Fallback     │
        │       │    │ (rule-based) │
        │       │    └──────┬───────┘
        │       │           │
        │       └─────┬─────┘
        │             │
        └─────┬───────┘
              │
              ▼
    ┌─────────────────────────────┐
    │ Format Response             │
    │ (Validate 10 sections)      │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ Return ChatResponse         │
    │ (Same format regardless)    │
    └─────────────────────────────┘

KEY: Same response schema from both paths
     No client code changes needed
     Automatic, transparent fallback
```

## Response Format (10 Sections)

```
┌─────────────────────────────────────────────────────────────┐
│                    ChatResponse                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ SECTION 1: Executive Summary                               │
│ ├─ summary: "Building efficiency at 65%. Focus on..."     │
│                                                             │
│ SECTION 2: Building Status (implicit)                      │
│ ├─ Health: 62/100, Efficiency: 65/100, Consumption: 125 kW│
│                                                             │
│ SECTION 3: Root Cause Analysis                             │
│ ├─ root_cause: "Idle AC in unoccupied R1-001..."          │
│                                                             │
│ SECTION 4: Key Findings                                    │
│ ├─ key_findings: [                                        │
│ │  "Building Health: At Risk",                            │
│ │  "Energy Efficiency: 65/100",                           │
│ │  "Idle AC R1-001: 2.5 kW, unoccupied 42 min"           │
│ │  "Idle Lights R1-002: 0.3 kW",                         │
│ │  "Current Consumption: 125.4 kW"                        │
│ │]                                                         │
│                                                             │
│ SECTION 5: Top Recommendations                             │
│ ├─ top_recommendations: [                                 │
│ │  "Turn OFF AC in R1-001",                              │
│ │  "Switch OFF lights in R1-002",                        │
│ │  "Optimize cooling in R1-003"                          │
│ │]                                                         │
│                                                             │
│ SECTION 6: Estimated Total Savings                         │
│ ├─ estimated_savings: "₹45,000/month"                    │
│                                                             │
│ SECTION 7: Estimated Carbon Reduction                      │
│ ├─ carbon_reduction: "250 kg CO2/day"                    │
│                                                             │
│ SECTION 8: Business Impact & Risk                          │
│ ├─ business_impact: "Reduce HVAC cost, improve..."       │
│ ├─ priority: "High"                                       │
│ ├─ confidence: 92  (0-100%)                               │
│                                                             │
│ SECTION 9: Next Best Action                                │
│ ├─ next_best_action: "Turn OFF AC in R1-001 immediately" │
│                                                             │
│ SECTION 10: Final AI Conclusion                            │
│ ├─ answer: "Your bill is high due to idle AC. Turn it..."│
│ ├─ suggested_actions: [                                  │
│ │  "Turn OFF AC in R1-001",                              │
│ │  "Switch OFF lights in R1-002",                        │
│ │  "Optimize cooling in R1-003"                          │
│ │]  (Backward compatible)                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The AI Building Energy Consultant is a sophisticated system that:

✅ **Aggregates** building data without sending raw telemetry to LLM  
✅ **Detects** user intent to guide prioritization  
✅ **Builds** context-aware prompts with goal-specific guidance  
✅ **Calls** OpenAI API with automatic failsafe  
✅ **Validates** responses against strict 10-section schema  
✅ **Returns** grounded, actionable recommendations  

All while maintaining **100% backward compatibility** with existing clients.
