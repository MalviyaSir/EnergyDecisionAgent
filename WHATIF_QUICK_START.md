# What-if Simulator - Quick Start Guide

## Setup Instructions

### Prerequisites
- Python 3.14 with FastAPI installed
- Node.js with npm
- Both backends running simultaneously

---

## Start the Backends

### Terminal 1: Python FastAPI Backend (Port 8000)
```bash
cd "c:\Users\Dell\OneDrive - Chandigarh University\Desktop\Hackathon\EnergyDecisionAgent\backend"
C:/Python314/python.exe -m uvicorn app.main:app --reload --port 8000
```

Expected output:
```
✓ FastAPI app loaded
✓ Simulation router loaded
✓ Backend ready for what-if simulator
```

### Terminal 2: Node.js Backend (Port 4000)
```bash
cd "c:\Users\Dell\OneDrive - Chandigarh University\Desktop\Hackathon\EnergyDecisionAgent\energy-ai-agent\backend"
npm run dev
```

Expected output:
```
AI Energy Optimization Agent API running on http://localhost:4000
```

### Terminal 3: React Frontend (Port 5173)
```bash
cd "c:\Users\Dell\OneDrive - Chandigarh University\Desktop\Hackathon\EnergyDecisionAgent\energy-ai-agent\frontend"
npm run dev
```

Expected output:
```
VITE v5.x.x  ready in xxx ms
➜ Local:   http://localhost:5173/
```

---

## Using the Simulator

1. **Open Browser:** http://localhost:5173
2. **Navigate:** Click "What-if Simulator" in sidebar
3. **Configure Scenario:**
   - Adjust AC Temperature (18-30°C)
   - Reduce Lighting (0-60%)
   - Set Occupancy Level (0-100%)
   - Toggle EV Charging
   - Adjust Battery Reserve (10-90%)
4. **Run Simulation:** Click "Run Simulation" button
5. **Review Results:**
   - Key impact metrics (top-right)
   - AI analysis and insights
   - Detailed recommendations
   - Current vs Proposed comparison
   - Actions considered

---

## Example Scenarios

### Scenario 1: Conservative AC Optimization
**Goal:** Reduce energy with minimal comfort impact

**Parameters:**
- AC Temperature: 24°C (↑ from 22°C)
- Lighting Reduction: 15%
- Occupancy: 100%
- EV Charging: Off
- Battery Reserve: 40%

**Expected Results:**
- Monthly Savings: ₹3,000-5,000
- Energy Improvement: 8-12%
- Confidence: 85-90%

---

### Scenario 2: Aggressive Peak Reduction
**Goal:** Minimize peak load with battery and solar

**Parameters:**
- AC Temperature: 26°C (↑ from 22°C)
- Lighting Reduction: 30%
- Occupancy: 80%
- EV Charging: Shift off-peak
- Battery Reserve: 60%

**Expected Results:**
- Monthly Savings: ₹8,000-12,000
- Peak Reduction: 20-30%
- Carbon Reduction: 3,000+ kg CO₂/yr
- Confidence: 75-80%

---

### Scenario 3: Cost Optimization
**Goal:** Maximum savings with tariff adjustment

**Parameters:**
- AC Temperature: 25°C
- Lighting Reduction: 25%
- Occupancy: 95%
- EV Charging: Off
- Battery Reserve: 30%

**Expected Results:**
- Annual Savings: ₹40,000-60,000
- ROI: 100-150% (12 months)
- Confidence: 80-85%

---

## Understanding Results

### Impact Metrics
| Metric | Meaning | Target |
|--------|---------|--------|
| Monthly Savings | Cost reduction per month | Higher is better |
| Annual Savings | Projected yearly savings | Higher is better |
| Carbon Reduction | CO₂ emissions avoided | Higher is better |
| Energy Efficiency | Consumption improvement | Higher % is better |
| ROI | Return on investment | >100% is excellent |

### Confidence Score
- **85-95%:** Very confident, conservative assumptions
- **75-85%:** Good confidence, safe to proceed
- **65-75%:** Moderate confidence, validate key assumptions
- **40-65%:** Lower confidence, extreme scenario, requires review

### Benefits
Green checkmarks indicate quantified benefits:
- Cost savings
- Carbon reduction
- Efficiency improvement
- Peak load reduction
- ROI potential

### Trade-offs
Amber triangles indicate potential conflicts:
- Comfort impact
- Operational changes
- Infrastructure requirements
- Staffing adjustments

### Risks
Red alerts indicate implementation risks:
- Thermal comfort concerns
- Validity of assumptions
- Safety considerations
- Infrastructure limits

---

## API Testing

### Test Python Backend Directly
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

### Test Node.js Proxy
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

---

## Troubleshooting

### Simulator Not Loading
- Check all three backends are running
- Verify ports: 8000 (Python), 4000 (Node), 5173 (React)
- Check browser console for errors

### "Unable to run simulation"
1. Check Python backend is responding:
   ```bash
   curl http://localhost:8000/health
   ```
2. Check network tab in browser DevTools
3. Verify CORS configuration

### Unexpected Results
- Verify parameter values are realistic
- Check current building data is available
- Try with default parameters first
- Review confidence score

### Performance Issues
- Restart backends if slow
- Clear browser cache
- Check system resources

---

## Advanced Configuration

### Change Python Backend URL
In Node.js backend, set environment variable:
```bash
set PYTHON_BACKEND_URL=http://your-server:8000
```

### Adjust Tariff Rate
In Python backend `utils/settings.py`:
```python
tariff_per_kwh = 10.5  # ₹ per kWh
```

### Modify Calculation Algorithms
Edit `SimulationService._calculate_proposed_state()` in:
```
backend/app/services/simulation_service.py
```

---

## Next Steps

1. **Validate Results:** Compare simulator predictions with actual savings
2. **Schedule Optimizations:** Use top-performing scenarios
3. **Implement Changes:** Follow recommendations in order
4. **Track Impact:** Monitor actual vs predicted metrics
5. **Iterate:** Run scenarios regularly as conditions change

---

## Support

For issues or questions:
1. Check logs in running terminals
2. Review error messages in browser console
3. Verify all dependencies installed
4. Test individual API endpoints with curl
5. Check documentation in WHATIF_SIMULATOR_UPGRADE.md

---

**Version:** 1.0.0  
**Last Updated:** 2025-07-10  
**Status:** Production Ready ✅
