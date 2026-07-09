import type { SavingsResponse } from '../../../shared/energy.js';
import { SavingsEngine } from '../engines/SavingsEngine.js';
import { readMeterData } from './dataService.js';
import { generateRecommendations } from './recommendationService.js';

export async function generateSavings(): Promise<SavingsResponse> {
  const records = await readMeterData();
  const recommendations = await generateRecommendations();

  return new SavingsEngine().estimate(records, recommendations);
}
