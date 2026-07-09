import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MeterDataRecord } from '../../../shared/energy.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const dataPath = path.resolve(currentDirectory, '../../../dummy-data/meter-data.json');

export async function readMeterData(): Promise<MeterDataRecord[]> {
  const file = await readFile(dataPath, 'utf-8');
  return JSON.parse(file) as MeterDataRecord[];
}
