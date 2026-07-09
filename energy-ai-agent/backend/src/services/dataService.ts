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

export async function readMeterData(): Promise<MeterDataRecord[]> {
  const dataPath = await resolveDataPath();
  const file = await readFile(dataPath, 'utf-8');
  return JSON.parse(file) as MeterDataRecord[];
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
