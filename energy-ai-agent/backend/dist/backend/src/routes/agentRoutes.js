import { Router } from 'express';
import { z } from 'zod';
import { getMeterData, getObservations, getPredictions, getReasoning, getRecommendations, getSavings, getSmartDashboard, recordFeedback, } from '../services/agentService.js';
const whatIfSchema = z.object({
    temperatureSetpoint: z.number().min(18).max(30).optional(),
    shiftEvCharging: z.boolean().optional(),
    reduceLightingPercent: z.number().min(0).max(60).optional(),
    occupancyPercent: z.number().min(0).max(100).optional(),
    batteryReservePercent: z.number().min(10).max(90).optional(),
});
const feedbackSchema = z.object({
    recommendationId: z.string().min(1),
    rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    comment: z.string().max(500).optional(),
});
const chatSchema = z.object({
    message: z.string().min(1).max(1000),
});
export const agentRouter = Router();
// AI Building Energy Consultant Chat Endpoint
agentRouter.post('/chat', async (request, response, next) => {
    try {
        const result = chatSchema.safeParse(request.body);
        if (!result.success) {
            response.status(400).json({ error: 'Invalid chat payload', details: result.error.flatten() });
            return;
        }
        // Forward to Python FastAPI backend
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL ?? 'http://localhost:8000';
        const res = await fetch(`${pythonBackendUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: result.data.message }),
        });
        if (!res.ok) {
            throw new Error(`Python backend returned ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        response.json(data);
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/meter-data', async (_request, response, next) => {
    try {
        response.json(await getMeterData());
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/dashboard', async (_request, response, next) => {
    try {
        response.json(await getSmartDashboard());
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/observations', async (_request, response, next) => {
    try {
        response.json(await getObservations());
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/predictions', (_request, response) => {
    response.json(getPredictions());
});
agentRouter.get('/reasoning', async (_request, response, next) => {
    try {
        response.json(await getReasoning());
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/recommendations', async (_request, response, next) => {
    try {
        response.json(await getRecommendations());
    }
    catch (error) {
        next(error);
    }
});
agentRouter.get('/savings', async (_request, response, next) => {
    try {
        response.json(await getSavings());
    }
    catch (error) {
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
        // Convert Node.js request format to Python SimulationRequest format
        const pythonRequest = {
            turn_off_idle_ac: true,
            turn_off_idle_lights: true,
            ac_setpoint_c: result.data.temperatureSetpoint ?? 24,
            lighting_schedule_percent: result.data.reduceLightingPercent ? (100 - result.data.reduceLightingPercent) : 100,
            occupancy_percent: result.data.occupancyPercent ?? 100,
            working_hours_start: 9,
            working_hours_end: 17,
            electricity_tariff_per_kwh: 8.5,
            solar_capacity_kw: 0,
            battery_capacity_kwh: result.data.batteryReservePercent ? ((result.data.batteryReservePercent / 100) * 50) : 0, // 50 kWh max
            ev_charging_load_kw: result.data.shiftEvCharging ? 7 : 0, // 7 kW if shifting
        };
        // Forward to Python FastAPI backend
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
    }
    catch (error) {
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
