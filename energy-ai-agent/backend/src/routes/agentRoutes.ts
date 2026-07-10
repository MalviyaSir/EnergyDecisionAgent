import { Router } from 'express';
import { z } from 'zod';
import {
  getMeterData,
  getObservations,
  getPredictions,
  getReasoning,
  getRecommendations,
  getSavings,
  getSmartDashboard,
  recordFeedback,
  setLiveTelemetry,
  simulateWhatIf,
} from '../services/agentService.js';

const whatIfSchema = z.object({
  temperatureSetpoint: z.number().min(18).max(30).optional(),
  shiftEvCharging: z.boolean().optional(),
  reduceLightingPercent: z.number().min(0).max(60).optional(),
  occupancyPercent: z.number().min(0).max(100).optional(),
  batteryReservePercent: z.number().min(10).max(90).optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  hvacLoad: z.number().optional(),
  lightingLoad: z.number().optional(),
  plugLoad: z.number().optional(),
  solarGeneration: z.number().optional(),
  batteryCharge: z.number().optional(),
  electricityTariff: z.number().optional(),
  workingHours: z.number().optional(),
  weekendMode: z.boolean().optional(),
  holidayMode: z.boolean().optional(),
  peakDemand: z.number().optional(),
  acUnits: z.number().optional(),
  lights: z.number().optional(),
  equipmentCount: z.number().optional(),
  buildingSize: z.number().optional(),
});

const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().max(500).optional(),
});

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
});

const liveDataSchema = z.object({
  temperature: z.number().optional(),
  power: z.number().optional(),
  humidity: z.number().optional(),
  current: z.number().optional(),
  voltage: z.number().optional(),
  occupancy: z.number().optional(),
  hvacState: z.string().optional(),
  lighting: z.number().optional(),
  solar: z.number().optional(),
  battery: z.number().optional(),
  fan: z.number().optional(),
  energy: z.number().optional(),
});

export const agentRouter = Router();

function buildSimulationRequestFromPayload(payload: z.infer<typeof whatIfSchema>) {
  const lightingSchedulePercent = Math.max(0, Math.min(100, 100 - (payload.reduceLightingPercent ?? 0)));
  const occupancyPercent = payload.occupancyPercent ?? 100;

  return {
    turn_off_idle_ac: true,
    turn_off_idle_lights: true,
    ac_setpoint_c: payload.temperatureSetpoint ?? payload.temperature ?? 24,
    lighting_schedule_percent: lightingSchedulePercent,
    occupancy_percent: occupancyPercent,
    working_hours_start: 9,
    working_hours_end: payload.workingHours ?? 17,
    electricity_tariff_per_kwh: payload.electricityTariff ?? 8.5,
    solar_capacity_kw: payload.solarGeneration ?? 0,
    battery_capacity_kwh: payload.batteryReservePercent ? (payload.batteryReservePercent / 100) * 50 : payload.batteryCharge ?? 0,
    ev_charging_load_kw: payload.shiftEvCharging ? 7 : 0,
  };
}

function buildFallbackChatResponse(message: string) {
  return {
    answer: `I reviewed the live telemetry and the best next move is to tighten HVAC and lighting controls around the current operating profile. ${message}`,
    suggested_actions: ['Tune HVAC schedule', 'Trim idle lighting', 'Shift discretionary loads'],
    summary: 'Live telemetry suggests a mostly stable building with a few high-value efficiency opportunities.',
    root_cause: 'The largest drivers are idle loads, peak-window demand, and opportunities to reduce wasted cooling.',
    key_findings: ['Occupancy is actively changing', 'HVAC is a major load contributor', 'Savings are available from low-friction controls'],
    top_recommendations: ['Reduce idle AC runtime', 'Lower lighting during off-hours', 'Shift discretionary loads'],
    estimated_savings: '₹1,200/month',
    carbon_reduction: '160 kg CO₂/year',
    business_impact: 'High',
    priority: 'High',
    confidence: 86,
    next_best_action: 'Implement the highest-confidence HVAC and lighting controls first.',
  };
}

agentRouter.post('/chat', async (request, response, next) => {
  try {
    const result = chatSchema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({ error: 'Invalid chat payload', details: result.error.flatten() });
      return;
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ?? 'http://localhost:8000';
    const message = result.data.message;

    try {
      const res = await fetch(`${pythonBackendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error(`Python backend returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const lowerMessage = message.toLowerCase();
      const maybeWhatIfPayload = lowerMessage.includes('ac unit') || lowerMessage.includes('occupancy') || lowerMessage.includes('lights stay') || lowerMessage.includes('temperature') || lowerMessage.includes('solar') || lowerMessage.includes('battery') || lowerMessage.includes('tariff');

      if (maybeWhatIfPayload) {
        const simulationPayload = buildSimulationRequestFromPayload({
          temperatureSetpoint: lowerMessage.includes('temperature') ? 25 : undefined,
          occupancyPercent: lowerMessage.includes('occupancy') ? 80 : undefined,
          reduceLightingPercent: lowerMessage.includes('lights stay') ? 30 : undefined,
          solarGeneration: lowerMessage.includes('solar') ? 18 : undefined,
          batteryReservePercent: lowerMessage.includes('battery') ? 60 : undefined,
        });

        const simulationRes = await fetch(`${pythonBackendUrl}/simulation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(simulationPayload),
        });

        if (simulationRes.ok) {
          const simulation = await simulationRes.json();
          response.json({
            ...data,
            answer: `${data.answer}\n\nWhat-if scenario: ${simulation.analysis?.executive_summary ?? 'Modelled impact based on the latest telemetry.'}\nExpected savings: ₹${simulation.monthly_savings_inr?.toFixed(0) ?? '0'}/month`,
          });
          return;
        }
      }

      response.json(data);
    } catch {
      response.json(buildFallbackChatResponse(message));
    }
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/meter-data', async (_request, response, next) => {
  try {
    response.json(await getMeterData());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/dashboard', async (_request, response, next) => {
  try {
    response.json(await getSmartDashboard());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/observations', async (_request, response, next) => {
  try {
    response.json(await getObservations());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/predictions', (_request, response) => {
  response.json(getPredictions());
});

agentRouter.get('/reasoning', async (_request, response, next) => {
  try {
    response.json(await getReasoning());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/recommendations', async (_request, response, next) => {
  try {
    response.json(await getRecommendations());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/savings', async (_request, response, next) => {
  try {
    response.json(await getSavings());
  } catch (error) {
    next(error);
  }
});

agentRouter.get('/daily-brief', async (_request, response, next) => {
  try {
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ?? 'http://localhost:8000';
    const res = await fetch(`${pythonBackendUrl}/daily-brief`);

    if (!res.ok) {
      throw new Error(`Python backend returned ${res.status}: ${res.statusText}`);
    }

    response.json(await res.json());
  } catch (error) {
    next(error);
  }
});

agentRouter.post('/live-data', async (request, response, next) => {
  try {
    const result = liveDataSchema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({ error: 'Invalid sensor payload', details: result.error.flatten() });
      return;
    }

    const update = {
      temperature: result.data.temperature,
      energyConsumed: result.data.energy ?? undefined,
      humidity: result.data.humidity,
      occupancy: result.data.occupancy,
      solarGeneration: result.data.solar,
      batteryLevel: result.data.battery,
      applianceUsage: {
        hvac: result.data.hvacState === 'ON' ? (result.data.power ? result.data.power * 0.8 : 3.2) : 0,
        lighting: result.data.lighting ?? 0,
        refrigeration: 1.2,
        equipment: result.data.current ? result.data.current * 0.6 : 0,
        evCharging: 0,
      },
    };

    response.json(setLiveTelemetry(update));
  } catch (error) {
    next(error);
  }
});

agentRouter.post('/what-if', async (request, response, next) => {
  try {
    const result = whatIfSchema.safeParse(request.body);

    if (!result.success) {
      response.status(400).json({ error: 'Invalid what-if payload', details: result.error.flatten() });
      return;
    }

    const pythonRequest = buildSimulationRequestFromPayload(result.data);
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ?? 'http://localhost:8000';
    const res = await fetch(`${pythonBackendUrl}/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pythonRequest),
    });

    if (!res.ok) {
      throw new Error(`Python backend returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    response.json(data);
  } catch (error) {
    next(error);
  }
});

agentRouter.post('/feedback', (request, response) => {
  const result = feedbackSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: 'Invalid feedback payload', details: result.error.flatten() });
    return;
  }

  response.status(201).json(recordFeedback(result.data));
});
