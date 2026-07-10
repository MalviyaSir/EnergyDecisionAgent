import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MeterDataRecord } from '../../../shared/energy.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const dataPathCandidates = [
  path.resolve(currentDirectory, '../../../dummy-data/meter-data.json'),
  path.resolve(currentDirectory, '../../../../../dummy-data/meter-data.json'),
];

let liveTelemetryOverrides: Partial<MeterDataRecord> | null = null;

export async function readMeterData(): Promise<MeterDataRecord[]> {
  const dataPath = await resolveDataPath();
  const file = await readFile(dataPath, 'utf-8');
  const records = JSON.parse(file) as MeterDataRecord[];

  if (!records.length) {
    return records;
  }

  if (!liveTelemetryOverrides) {
    return records;
  }

  const latestIndex = records.length - 1;
  const latest = records[latestIndex];
  const merged = { ...latest, ...liveTelemetryOverrides } as MeterDataRecord;

  if (liveTelemetryOverrides.applianceUsage) {
    merged.applianceUsage = {
      ...latest.applianceUsage,
      ...liveTelemetryOverrides.applianceUsage,
    };
  }

  return records.map((record, index) => (index === latestIndex ? merged : record));
}

export function updateLiveTelemetry(overrides: Partial<MeterDataRecord>) {
  liveTelemetryOverrides = {
    ...(liveTelemetryOverrides ?? {}),
    ...overrides,
    timestamp: new Date().toISOString(),
  };
}

async function resolveDataPath() {
  for (const candidate of dataPathCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known runtime layout.
    }
  }

  return dataPathCandidates[0];
}
