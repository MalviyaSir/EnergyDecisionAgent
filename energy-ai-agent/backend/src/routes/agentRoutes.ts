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
  simulateWhatIf,
} from '../services/agentService.js';

const whatIfSchema = z.object({
  temperatureSetpoint: z.number().min(18).max(30).optional(),
  shiftEvCharging: z.boolean().optional(),
  reduceLightingPercent: z.number().min(0).max(60).optional(),
  batteryReservePercent: z.number().min(10).max(90).optional(),
});

const feedbackSchema = z.object({
  recommendationId: z.string().min(1),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().max(500).optional(),
});

export const agentRouter = Router();

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

agentRouter.get('/reasoning', (_request, response) => {
  response.json(getReasoning());
});

agentRouter.get('/recommendations', (_request, response) => {
  response.json(getRecommendations());
});

agentRouter.get('/savings', (_request, response) => {
  response.json(getSavings());
});

agentRouter.post('/what-if', (request, response) => {
  const result = whatIfSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: 'Invalid what-if payload', details: result.error.flatten() });
    return;
  }

  response.json(simulateWhatIf(result.data));
});

agentRouter.post('/feedback', (request, response) => {
  const result = feedbackSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({ error: 'Invalid feedback payload', details: result.error.flatten() });
    return;
  }

  response.status(201).json(recordFeedback(result.data));
});
