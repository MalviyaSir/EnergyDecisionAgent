import { ObservationEngine } from '../engines/ObservationEngine.js';
import { ReasoningEngine } from '../engines/ReasoningEngine.js';
import { readMeterData } from './dataService.js';
export async function generateReasoning() {
    const records = await readMeterData();
    const observations = new ObservationEngine().analyze(records);
    return new ReasoningEngine().analyze(records, observations);
}
