import { DecisionEngine } from '../engines/DecisionEngine.js';
import { ObservationEngine } from '../engines/ObservationEngine.js';
import { ReasoningEngine } from '../engines/ReasoningEngine.js';
import { readMeterData } from './dataService.js';
export async function generateRecommendations() {
    const records = await readMeterData();
    const observations = new ObservationEngine().analyze(records);
    const reasoning = new ReasoningEngine().analyze(records, observations);
    return new DecisionEngine().analyze(records, observations, reasoning);
}
