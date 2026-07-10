# What-if Decision Simulator - Upgrade Documentation

## Overview

The What-if Decision Simulator has been upgraded from a placeholder into a comprehensive, AI-powered tool that allows building managers to experiment with different settings and immediately see the impact on costs, efficiency, comfort, and sustainability.

## Architecture

### Three-Tier Routing

```
Frontend (React)
    ↓
/api/what-if → Node.js Backend (4000)
    ↓
/simulation → Python FastAPI (8000)
    ↓
Comprehensive Analysis & Calculations
```

## Implementation Details

### 1. Backend Enhancements

#### Enhanced SimulationRequest Schema (`app/schemas/energy.py`)

**New Parameters:**
- `lighting_schedule_percent` (0-100): Percentage of normal lighting
- `occupancy_percent` (0-100): Expected building occupancy
- `working_hours_start` (0-23): Start of working hours
- `working_hours_end` (0-23): End of working hours
- `electricity_tariff_per_kwh` (1-20): Cost per kWh
- `solar_capacity_kw` (0-500): Solar panel capacity
- `battery_capacity_kwh` (0-1000): Battery storage capacity
- `ev_charging_load_kw` (0-100): EV charging load

**Backward Compatible:**
- `turn_off_idle_ac`: Legacy parameter (default: true)
- `turn_off_idle_lights`: Legacy parameter (default: true)
- `ac_setpoint_c`: Legacy parameter (default: 24°C)

#### Comprehensive SimulationResult Schema

**Current State Metrics:**
- `current_energy_usage_kwh`: Baseline daily energy consumption
- `current_monthly_bill_inr`: Baseline monthly cost
- `current_comfort_score`: Comfort index (0-100)
- `current_efficiency_score`: Efficiency rating (0-100)
- `current_health_score`: Building health (0-100)

**Proposed State Metrics:**
- `predicted_energy_usage_kwh`: Energy with proposed changes
- `predicted_monthly_bill_inr`: Projected monthly cost
- `predicted_comfort_score`: Expected comfort level
- `predicted_efficiency_score`: Projected efficiency
- `predicted_health_score`: Expected health score

**Impact Metrics:**
- `monthly_savings_inr`: Cost savings per month
- `annual_savings_inr`: Annual savings projection
- `carbon_reduction_kg_co2`: CO₂ emissions reduction
- `energy_efficiency_improvement_percent`: Efficiency gain
- `building_health_improvement_percent`: Health improvement
- `peak_load_reduction_kw`: Peak demand reduction
- `peak_load_reduction_percent`: Peak reduction %
- `roi_percent`: Return on investment (12 months)

**AI Analysis:**
- `executive_summary`: High-level recommendation
- `benefits`: List of key benefits
- `trade_offs`: Potential conflicts
- `risks`: Implementation risks
- `recommendations`: Actionable next steps
- `confidence_score`: Analysis confidence (0-100%)

**Comparison Data:**
- `comparisons`: Side-by-side metric comparison with % improvement

#### WhatIfAnalysisService (New)

**Location:** `app/services/whatif_analysis_service.py`

**Key Methods:**
- `analyze()`: Main entry point for AI analysis
- `_extract_benefits()`: Quantifies benefits based on metrics
- `_extract_tradeoffs()`: Identifies potential conflicts
- `_extract_risks()`: Flags implementation risks
- `_generate_recommendations()`: Creates actionable next steps
- `_calculate_confidence()`: Confidence scoring algorithm
- `_generate_summary()`: Executive summary text

**Logic:**
- Confidence calculation based on scenario conservativeness
- Benefits extraction from cost, carbon, and efficiency savings
- Trade-off identification (comfort vs savings, etc.)
- Risk assessment (thermal comfort, infrastructure limits, etc.)
- Recommendation prioritization based on impact

#### Enhanced SimulationService

**Location:** `app/services/simulation_service.py`

**New Methods:**
- `_calculate_current_state()`: Establishes baseline from room data
- `_calculate_proposed_state()`: Calculates impact of changes
- `_build_comparisons()`: Creates comparison table
- `_generate_actions()`: Lists actions considered

**Calculations:**
1. **Current State** (from room telemetry):
   - Total energy from daily consumption data
   - Average temperature, humidity, occupancy
   - Peak load from individual room power usage

2. **Proposed State** (from parameters):
   - AC efficiency: ±5% per degree from setpoint 24°C
   - Lighting: 25% of total load × reduction %
   - Occupancy: 40% of load is occupancy-dependent
   - Solar: Reduces consumption by generation
   - EV Charging: Increases consumption
   - Battery: Reduces peak load by ~70% of capacity

3. **Impact Metrics**:
   - Savings = Current Cost - Proposed Cost
   - Carbon = (Current Energy - Proposed Energy) × 0.85 kg CO₂/kWh
   - ROI = (Annual Savings / ₹50,000 implementation) × 100

### 2. Node.js Backend Proxy

**File:** `energy-ai-agent/backend/src/routes/agentRoutes.ts`

**Endpoint:** `POST /api/what-if`

**Request Transformation:**
```typescript
Frontend Request Format → Python SimulationRequest Format
{                        {
  temperatureSetpoint      ac_setpoint_c: 24,
  reduceLightingPercent    lighting_schedule_percent: 85,
  shiftEvCharging          ev_charging_load_kw: 7 or 0,
  batteryReservePercent    battery_capacity_kwh: calculated
}                        }
```

**Features:**
- Validates incoming request with Zod schema
- Transforms from Node.js format to Python format
- Forwards to `http://localhost:8000/simulation`
- Returns Python response directly to frontend
- Error handling with detailed messages

### 3. Frontend UI Enhancement

**File:** `energy-ai-agent/frontend/src/pages/WhatIfPage.tsx`

**Sections:**

1. **Parameter Controls** (Left Panel)
   - AC Temperature slider (18-30°C)
   - Lighting Reduction slider (0-60%)
   - Occupancy Level slider (0-100%)
   - EV Charging toggle
   - Battery Reserve slider (10-90%)

2. **Key Impact Metrics** (Right Panel)
   - Monthly Savings (₹)
   - Annual Savings (₹)
   - Carbon Reduction (kg CO₂/yr)
   - ROI (%)

3. **AI Analysis Card**
   - Executive summary
   - Benefits (green checkmarks)
   - Trade-offs (amber triangles)
   - Risks (red alerts)
   - Confidence score display

4. **Recommendations Card**
   - Numbered action items
   - Implementation priorities

5. **Comparison Table**
   - Current vs Proposed side-by-side
   - Improvement percentages
   - Color-coded gains/losses

6. **Actions Considered**
   - Grid of all measures included
   - Checkmark indicators

## Usage Example

**Scenario:** Increase AC temperature from 22°C to 24°C while reducing lighting by 15%

```
Input Parameters:
- temperatureSetpoint: 24
- reduceLightingPercent: 15
- shiftEvCharging: false
- batteryReservePercent: 40

Output (Example):
- Monthly Savings: ₹6,800
- Annual Savings: ₹81,600
- Carbon Reduction: 2,400 kg CO₂/yr
- Energy Efficiency Improvement: 12%
- ROI: 195% (within 12 months)
- Confidence: 88%

Analysis:
- Benefits: "Significant monthly cost savings with minimal comfort impact"
- Trade-offs: "Higher temperature may reduce occupant comfort slightly"
- Recommendations: "Conduct thermal comfort survey before implementation"
```

## Backward Compatibility

### Preserved Functionality
- Legacy request parameters still work
- Existing clients receive backward-compatible fields
- Original `/simulation` endpoint signature unchanged
- Route remains at `POST /simulation`

### Old Clients Can Still Use:
```json
{
  "turn_off_idle_ac": true,
  "turn_off_idle_lights": true,
  "ac_setpoint_c": 24
}
```

**Response includes both:**
- New comprehensive metrics
- Legacy fields: `estimated_daily_saving_inr`, `estimated_monthly_saving_inr`

## Performance Characteristics

- **Request-to-Response:** <500ms (Python backend only)
- **Simulation Accuracy:** Rule-based (not ML-dependent)
- **Confidence Score:** Conservative (40-95% range)
- **Scalability:** Stateless, horizontal scaling ready

## Testing Checklist

✅ Python backend imports all services  
✅ TypeScript compiles without errors  
✅ FastAPI app loads successfully  
✅ Node.js proxy routes to Python backend  
✅ Frontend renders parameter controls  
✅ Simulation executes and returns results  
✅ UI displays all comparison metrics  
✅ AI analysis generates insights  
✅ Backward compatibility maintained  

## API Endpoints

### POST /simulation (Python FastAPI)
```bash
curl -X POST "http://localhost:8000/simulation" \
  -H "Content-Type: application/json" \
  -d '{
    "ac_setpoint_c": 24,
    "lighting_schedule_percent": 85,
    "occupancy_percent": 100,
    "working_hours_start": 9,
    "working_hours_end": 17,
    "electricity_tariff_per_kwh": 8.5,
    "solar_capacity_kw": 0,
    "battery_capacity_kwh": 20,
    "ev_charging_load_kw": 0
  }'
```

### POST /api/what-if (Node.js Proxy)
```bash
curl -X POST "http://localhost:4000/api/what-if" \
  -H "Content-Type: application/json" \
  -d '{
    "temperatureSetpoint": 24,
    "reduceLightingPercent": 15,
    "shiftEvCharging": false,
    "batteryReservePercent": 40
  }'
```

## Files Modified/Created

### Created Files
- `backend/app/services/whatif_analysis_service.py` (240 lines)

### Modified Files
- `backend/app/schemas/energy.py` - Extended SimulationRequest, added WhatIfComparison, comprehensive SimulationResult
- `backend/app/services/simulation_service.py` - Complete rewrite with comprehensive calculations
- `energy-ai-agent/backend/src/routes/agentRoutes.ts` - Updated /what-if endpoint to proxy to Python
- `energy-ai-agent/frontend/src/pages/WhatIfPage.tsx` - Complete UI redesign with parameters and results display

### Unchanged (Backward Compatible)
- `backend/app/api/simulation.py` - Route unchanged, endpoint signature compatible
- `backend/app/main.py` - No changes needed
- All other backend services

## Configuration

**Environment Variables:**
- `PYTHON_BACKEND_URL` (default: `http://localhost:8000`)

**Settings (from `utils/settings.py`):**
- `tariff_per_kwh` (₹/kWh) - Used in calculations
- `cors_origins` - CORS configuration

## Future Enhancements

1. **ML-Based Predictions**: Replace rule-based calculations with trained models
2. **Historical Optimization**: Learn from past scenarios and recommendations
3. **Real-Time Adjustments**: Auto-adjust recommendations based on live data
4. **Multi-Building Comparison**: Compare across building portfolio
5. **Scheduled Scenarios**: Pre-define and schedule optimization runs
6. **Impact Tracking**: Track actual vs predicted savings

## Troubleshooting

**Issue:** "Python backend returned 500"
- Check Python backend is running: `curl http://localhost:8000/health`
- Check simulation service imports: `python -m app.services.simulation_service`

**Issue:** "Confidence score too low"
- Confidence calculation: More extreme parameters = lower confidence
- Try more conservative parameters (22-24°C, <30% lighting reduction)

**Issue:** "Negative savings"
- Occurs when scenario increases consumption (e.g., high EV charging)
- Check for unrealistic parameter combinations

## Conclusion

The What-if Decision Simulator provides a production-ready foundation for building energy optimization experiments with comprehensive AI analysis, full backward compatibility, and clear user-facing insights into the potential impact of different operational strategies.
