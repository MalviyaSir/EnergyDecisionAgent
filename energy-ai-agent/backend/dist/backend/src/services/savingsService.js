import { SavingsEngine } from '../engines/SavingsEngine.js';
import { readMeterData } from './dataService.js';
import { generateRecommendations } from './recommendationService.js';
export async function generateSavings() {
    const records = await readMeterData();
    const recommendations = await generateRecommendations();
    return new SavingsEngine().estimate(records, recommendations);
}
